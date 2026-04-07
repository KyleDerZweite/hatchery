from __future__ import annotations

import respx
from httpx import Response


@respx.mock
async def test_health_endpoint(client):
    response = await client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["database"] == "reachable"


async def test_auth_is_required_without_override():
    from httpx import ASGITransport, AsyncClient

    from app.main import app

    app.dependency_overrides.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/eggs")

    assert response.status_code == 401


@respx.mock
async def test_egg_lifecycle(client):
    respx.get("https://api.modrinth.com/v2/project/example-pack").mock(
        return_value=Response(
            200,
            json={
                "id": "project-1",
                "title": "Example Pack",
                "description": "A test pack",
                "icon_url": "https://cdn.example/icon.png",
            },
        )
    )
    respx.get("https://api.modrinth.com/v2/project/example-pack/version").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "version-1",
                    "version_number": "1.0.0",
                    "game_versions": ["1.20.1"],
                    "loaders": ["fabric"],
                    "files": [{"primary": True, "url": "https://cdn.example/pack.mrpack"}],
                    "dependencies": [],
                }
            ],
        )
    )

    create_response = await client.post(
        "/api/eggs",
        json={
            "source_url": "https://modrinth.com/modpack/example-pack",
            "visibility": "private",
            "java_version": 17,
        },
    )
    assert create_response.status_code == 201
    created_egg = create_response.json()
    assert created_egg["name"] == "Example Pack"
    assert created_egg["modloader"] == "fabric"

    egg_id = created_egg["id"]

    list_response = await client.get("/api/eggs")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = await client.patch(
        f"/api/eggs/{egg_id}",
        json={"name": "Updated Pack", "java_version": 21},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Pack"
    assert update_response.json()["java_version"] == 21

    export_response = await client.get(f"/api/eggs/{egg_id}/export")
    assert export_response.status_code == 200
    exported = export_response.json()
    assert exported["name"] == "Example Pack"

    regenerate_response = await client.post(f"/api/eggs/{egg_id}/regenerate")
    assert regenerate_response.status_code == 200
    assert regenerate_response.json()["id"] == egg_id


@respx.mock
async def test_panel_lifecycle(client):
    create_response = await client.post(
        "/api/panels",
        json={
            "name": "Primary Panel",
            "url": "https://panel.example.com",
            "api_key": "ptla_test_key",
            "description": "Main panel",
        },
    )
    assert create_response.status_code == 201
    panel = create_response.json()
    assert panel["has_api_key"] is True
    assert panel["last_test_status"] == "untested"
    panel_id = panel["id"]

    respx.get("https://panel.example.com/api/application/nodes?per_page=1").mock(
        return_value=Response(200, json={"object": "list"}, headers={"X-Powered-By": "Pelican"})
    )

    test_response = await client.post(f"/api/panels/{panel_id}/test")
    assert test_response.status_code == 200
    result = test_response.json()
    assert result["success"] is True
    assert result["panel_type"] == "pelican"

    list_response = await client.get("/api/panels")
    assert list_response.status_code == 200
    listed_panel = list_response.json()[0]
    assert listed_panel["last_test_status"] == "ok"

    delete_response = await client.delete(f"/api/panels/{panel_id}")
    assert delete_response.status_code == 204
