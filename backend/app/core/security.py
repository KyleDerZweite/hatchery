"""JWT validation and the single authentication boundary for the API."""

import time
from dataclasses import dataclass, field
from typing import Annotated, Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import AuthMode, settings

bearer_scheme = HTTPBearer(auto_error=False)

JWKS_CACHE_TTL = 3600
_jwks_cache: dict = {}
_jwks_cache_time: float = 0


@dataclass
class User:
    id: str
    email: str
    name: str
    roles: list[str] = field(default_factory=list)

    @property
    def is_admin(self) -> bool:
        return "ADMIN" in self.roles


# The identity used by AUTH_MODE=dev. Authorization still applies to it: it owns the
# records it creates and passes the same role checks as a real user.
DEV_USER = User(
    id="dev-user",
    email="dev@localhost",
    name="Local Developer",
    roles=["ADMIN", "MEMBER"],
)


async def fetch_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if not force_refresh and _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.zitadel_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
        return _jwks_cache


def find_signing_key(token: str, jwks: dict) -> Any | None:
    kid = jwt.get_unverified_header(token).get("kid")
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    return None


def extract_roles(claims: dict) -> list[str]:
    roles = claims.get("urn:zitadel:iam:org:project:roles", {})
    return list(roles.keys()) if isinstance(roles, dict) else []


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
    if settings.auth_mode is AuthMode.DEV:
        return DEV_USER

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Refetch once on an unknown kid so tokens signed after a key rotation are
        # not rejected for the remainder of the cache TTL.
        jwks = await fetch_jwks()
        signing_key = find_signing_key(token, jwks)
        if signing_key is None:
            signing_key = find_signing_key(token, await fetch_jwks(force_refresh=True))
        if signing_key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find signing key",
            )

        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.zitadel_issuer,
            audience=settings.zitadel_project_id,
            options={"require": ["exp"]},
        )

        return User(
            id=claims.get("sub", ""),
            email=claims.get("email", ""),
            name=claims.get("name", claims.get("preferred_username", "")),
            roles=extract_roles(claims),
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


CurrentUser = Annotated[User, Depends(get_current_user)]
