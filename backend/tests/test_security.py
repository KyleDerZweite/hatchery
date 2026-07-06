from __future__ import annotations

import json
import time

import jwt
import pytest
import respx
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from httpx import Response

from app.core import security
from app.core.config import settings

JWKS_URL = f"https://{settings.zitadel_domain}/oauth/v2/keys"


@pytest.fixture(autouse=True)
def clear_jwks_cache():
    security._jwks_cache = {}
    security._jwks_cache_time = 0
    yield
    security._jwks_cache = {}
    security._jwks_cache_time = 0


@pytest.fixture(scope="module")
def rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def make_jwks(key, kid: str = "test-kid") -> dict:
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(key.public_key()))
    jwk.update({"kid": kid, "alg": "RS256", "use": "sig"})
    return {"keys": [jwk]}


def make_token(key, kid: str = "test-kid", **overrides) -> str:
    claims = {
        "sub": "user-1",
        "email": "user@example.com",
        "name": "User One",
        "iss": settings.zitadel_issuer,
        "aud": settings.zitadel_project_id,
        "exp": int(time.time()) + 300,
        "urn:zitadel:iam:org:project:roles": {"MEMBER": {}},
    }
    for claim, value in overrides.items():
        if value is None:
            claims.pop(claim, None)
        else:
            claims[claim] = value
    return jwt.encode(claims, key, algorithm="RS256", headers={"kid": kid})


def credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


@respx.mock
async def test_valid_token_is_accepted(rsa_key):
    respx.get(JWKS_URL).mock(return_value=Response(200, json=make_jwks(rsa_key)))

    user = await security.get_current_user(credentials(make_token(rsa_key)))

    assert user.id == "user-1"
    assert user.email == "user@example.com"
    assert user.roles == ["MEMBER"]


@respx.mock
async def test_expired_token_is_rejected(rsa_key):
    respx.get(JWKS_URL).mock(return_value=Response(200, json=make_jwks(rsa_key)))
    token = make_token(rsa_key, exp=int(time.time()) - 60)

    with pytest.raises(HTTPException) as exc_info:
        await security.get_current_user(credentials(token))

    assert exc_info.value.status_code == 401


@respx.mock
async def test_wrong_audience_is_rejected(rsa_key):
    respx.get(JWKS_URL).mock(return_value=Response(200, json=make_jwks(rsa_key)))
    token = make_token(rsa_key, aud="another-project")

    with pytest.raises(HTTPException) as exc_info:
        await security.get_current_user(credentials(token))

    assert exc_info.value.status_code == 401


@respx.mock
async def test_token_without_exp_is_rejected(rsa_key):
    respx.get(JWKS_URL).mock(return_value=Response(200, json=make_jwks(rsa_key)))
    token = make_token(rsa_key, exp=None)

    with pytest.raises(HTTPException) as exc_info:
        await security.get_current_user(credentials(token))

    assert exc_info.value.status_code == 401


@respx.mock
async def test_unknown_kid_triggers_jwks_refetch(rsa_key):
    route = respx.get(JWKS_URL)
    route.side_effect = [
        Response(200, json={"keys": []}),
        Response(200, json=make_jwks(rsa_key)),
    ]

    user = await security.get_current_user(credentials(make_token(rsa_key)))

    assert user.id == "user-1"
    assert route.call_count == 2
