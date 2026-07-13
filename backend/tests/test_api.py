from __future__ import annotations

import json
import os
import subprocess
import zipfile

import pytest
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
    install_script = created_egg["json_data"]["scripts"]["installation"]["script"]
    assert "modrinth.index.json" in install_script
    assert '.env.server != "unsupported"' in install_script
    assert "server-overrides" in install_script

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

    delete_response = await client.delete(f"/api/eggs/{egg_id}")
    assert delete_response.status_code == 204
    assert (await client.get(f"/api/eggs/{egg_id}")).status_code == 404


@respx.mock
async def test_private_egg_is_owner_scoped_and_public_egg_is_read_only(client):
    from app.core.security import User, get_current_user
    from app.main import app

    respx.get("https://api.modrinth.com/v2/project/shared-pack").mock(
        return_value=Response(200, json={"id": "shared", "title": "Shared Pack"})
    )
    respx.get("https://api.modrinth.com/v2/project/shared-pack/version").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "v1",
                    "game_versions": ["1.20.1"],
                    "loaders": ["fabric"],
                    "files": [{"primary": True, "url": "https://cdn.example/shared.mrpack"}],
                }
            ],
        )
    )
    private = await client.post(
        "/api/eggs",
        json={"source_url": "https://modrinth.com/modpack/shared-pack"},
    )
    public = await client.post(
        "/api/eggs",
        json={
            "source_url": "https://modrinth.com/modpack/shared-pack",
            "visibility": "public",
        },
    )

    async def other_user() -> User:
        return User(id="other-user", email="other@example.com", name="Other", roles=[])

    app.dependency_overrides[get_current_user] = other_user
    listed = await client.get("/api/eggs")

    assert listed.status_code == 200
    assert [egg["id"] for egg in listed.json()] == [public.json()["id"]]
    assert (await client.get(f"/api/eggs/{private.json()['id']}")).status_code == 403
    assert (await client.get(f"/api/eggs/{public.json()['id']}")).status_code == 200
    assert (
        await client.patch(f"/api/eggs/{public.json()['id']}", json={"name": "Nope"})
    ).status_code == 403


@respx.mock
async def test_modrinth_neoforge_pack_is_detected(client):
    respx.get("https://api.modrinth.com/v2/project/neo-pack").mock(
        return_value=Response(200, json={"id": "project-2", "title": "Neo Pack"})
    )
    respx.get("https://api.modrinth.com/v2/project/neo-pack/version").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "version-1",
                    "version_number": "1.0.0",
                    "game_versions": ["1.21.1"],
                    "loaders": ["neoforge"],
                    "files": [{"primary": True, "url": "https://cdn.example/pack.mrpack"}],
                    "dependencies": [],
                }
            ],
        )
    )

    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://modrinth.com/modpack/neo-pack"},
    )

    assert response.status_code == 201
    egg = response.json()
    assert egg["modloader"] == "neoforge"
    assert "neoforged.net" in egg["json_data"]["scripts"]["installation"]["script"]


@respx.mock
async def test_unknown_modrinth_modpack_returns_404(client):
    respx.get("https://api.modrinth.com/v2/project/missing-pack").mock(
        return_value=Response(404, json={"error": "not_found"})
    )

    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://modrinth.com/modpack/missing-pack"},
    )

    assert response.status_code == 404


async def test_non_http_source_url_is_rejected(client):
    response = await client.post(
        "/api/eggs",
        json={"source_url": "javascript:alert(1)//modrinth.com/modpack/x"},
    )

    assert response.status_code == 400


async def test_lookalike_modpack_domain_is_rejected(client):
    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://evilmodrinth.com/modpack/example-pack"},
    )

    assert response.status_code == 400


@respx.mock
async def test_unknown_requested_modrinth_version_returns_404(client):
    respx.get("https://api.modrinth.com/v2/project/example-pack").mock(
        return_value=Response(200, json={"id": "project-1", "title": "Example Pack"})
    )
    respx.get("https://api.modrinth.com/v2/project/example-pack/version").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "real-version",
                    "version_number": "1.0.0",
                    "game_versions": ["1.20.1"],
                    "loaders": ["fabric"],
                    "files": [],
                    "dependencies": [],
                }
            ],
        )
    )

    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://modrinth.com/modpack/example-pack/version/missing"},
    )

    assert response.status_code == 404


@respx.mock
async def test_modrinth_pack_without_downloadable_file_is_rejected(client):
    respx.get("https://api.modrinth.com/v2/project/incomplete-pack").mock(
        return_value=Response(200, json={"id": "project-3", "title": "Incomplete"})
    )
    respx.get("https://api.modrinth.com/v2/project/incomplete-pack/version").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "version-1",
                    "game_versions": ["1.20.1"],
                    "loaders": ["fabric"],
                    "files": [],
                }
            ],
        )
    )

    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://modrinth.com/modpack/incomplete-pack"},
    )

    assert response.status_code == 422
    assert "downloadable pack file" in response.json()["detail"]


async def test_curseforge_egg_resolves_manifest_files():
    from app.models.egg import ModpackSource
    from app.services.modpack_service import ModpackInfo, ModpackService, ModpackType

    service = ModpackService()
    info = ModpackInfo(
        name="Curse Pack",
        source=ModpackSource.CURSEFORGE,
        source_url="https://www.curseforge.com/minecraft/modpacks/curse-pack",
        download_url="https://media.example/curse-pack.zip",
        minecraft_version="1.20.1",
        modloader=ModpackType.FORGE,
    )

    egg = service.generate_egg_json(info)
    script = egg["scripts"]["installation"]["script"]
    variables = {item["env_variable"]: item for item in egg["variables"]}

    assert "manifest.json" in script
    assert "api.curseforge.com/v1/mods/$project_id/files/$file_id" in script
    assert "CF_API_KEY" in variables
    await service.close()


@respx.mock
async def test_curseforge_pack_imports_through_api(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "curseforge_api_key", "test-curseforge-key")
    respx.get(
        "https://api.curseforge.com/v1/mods/search",
        params={"gameId": 432, "classId": 4471, "slug": "curse-pack"},
    ).mock(
        return_value=Response(
            200,
            json={
                "data": [
                    {
                        "id": 123,
                        "name": "Curse Pack",
                        "summary": "A CurseForge pack",
                        "latestFiles": [
                            {
                                "id": 456,
                                "downloadUrl": "https://media.example/curse-pack.zip",
                                "gameVersions": ["1.20.1", "Forge"],
                            }
                        ],
                    }
                ]
            },
        )
    )

    response = await client.post(
        "/api/eggs",
        json={"source_url": "https://www.curseforge.com/minecraft/modpacks/curse-pack"},
    )

    assert response.status_code == 201
    egg = response.json()
    assert egg["source"] == "curseforge"
    assert egg["modloader"] == "forge"
    assert "manifest.json" in egg["json_data"]["scripts"]["installation"]["script"]


@pytest.mark.parametrize("loader", ["fabric", "forge", "neoforge", "quilt"])
async def test_generated_modrinth_install_scripts_are_valid_bash(loader):
    from app.models.egg import ModpackSource
    from app.services.modpack_service import ModpackInfo, ModpackService, ModpackType

    service = ModpackService()
    info = ModpackInfo(
        name="Syntax Test Pack",
        source=ModpackSource.MODRINTH,
        source_url="https://modrinth.com/modpack/syntax-test",
        download_url="https://cdn.example/pack.mrpack",
        minecraft_version="1.20.1",
        modloader=ModpackType(loader),
    )
    script = service.generate_egg_json(info)["scripts"]["installation"]["script"]

    result = subprocess.run(
        ["bash", "-n"], input=script, text=True, capture_output=True, check=False
    )

    assert result.returncode == 0, result.stderr
    if loader in {"forge", "neoforge"}:
        assert "bash run.sh nogui" in service.generate_egg_json(info)["startup"]
    await service.close()


async def test_modrinth_pack_file_resolver_executes(tmp_path):
    from app.models.egg import ModpackSource
    from app.services.modpack_service import ModpackInfo, ModpackService

    required_file = tmp_path / "required.jar"
    required_file.write_bytes(b"server mod")
    unsupported_file = tmp_path / "client-only.jar"
    unsupported_file.write_bytes(b"client mod")
    pack_file = tmp_path / "pack.mrpack"
    index = {
        "formatVersion": 1,
        "game": "minecraft",
        "versionId": "test",
        "name": "Resolver Test",
        "summary": "",
        "files": [
            {
                "path": "mods/required.jar",
                "hashes": {},
                "env": {"server": "required"},
                "downloads": [required_file.as_uri()],
                "fileSize": required_file.stat().st_size,
            },
            {
                "path": "mods/client-only.jar",
                "hashes": {},
                "env": {"server": "unsupported"},
                "downloads": [unsupported_file.as_uri()],
                "fileSize": unsupported_file.stat().st_size,
            },
        ],
        "dependencies": {"minecraft": "1.20.1", "fabric-loader": "0.16.0"},
    }
    with zipfile.ZipFile(pack_file, "w") as archive:
        archive.writestr("modrinth.index.json", json.dumps(index))
        archive.writestr("overrides/config/common.txt", "common")
        archive.writestr("server-overrides/config/server.txt", "server")

    server_dir = tmp_path / "server"
    server_dir.mkdir()
    service = ModpackService()
    info = ModpackInfo(source=ModpackSource.MODRINTH)
    env = os.environ | {"MODPACK_URL": pack_file.as_uri()}

    result = subprocess.run(
        ["bash", "-euo", "pipefail", "-c", service._get_modpack_files_script(info)],
        cwd=server_dir,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert (server_dir / "mods/required.jar").read_bytes() == b"server mod"
    assert not (server_dir / "mods/client-only.jar").exists()
    assert (server_dir / "config/common.txt").read_text() == "common"
    assert (server_dir / "config/server.txt").read_text() == "server"
    await service.close()


async def test_curseforge_pack_file_resolver_executes(tmp_path):
    from app.models.egg import ModpackSource
    from app.services.modpack_service import ModpackInfo, ModpackService

    server_dir = tmp_path / "server"
    pack_dir = server_dir / "modpack_temp"
    pack_dir.mkdir(parents=True)
    (server_dir / "mods").mkdir()
    (pack_dir / "manifest.json").write_text(
        json.dumps({"files": [{"projectID": 123, "fileID": 456}]})
    )
    (pack_dir / "overrides/config").mkdir(parents=True)
    (pack_dir / "overrides/config/pack.txt").write_text("override")

    payload = tmp_path / "example.jar"
    payload.write_bytes(b"curseforge mod")
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    fake_curl = fake_bin / "curl"
    fake_curl.write_text(
        f"""#!/bin/bash
set -euo pipefail
output=""
url="${{@: -1}}"
while [[ $# -gt 0 ]]; do
    if [[ "$1" == "-o" ]]; then output="$2"; shift 2; else shift; fi
done
if [[ "$url" == https://api.curseforge.com/* ]]; then
    printf '%s' '{{"data":{{"fileName":"example.jar","downloadUrl":"https://files.example/example.jar"}}}}'
elif [[ "$url" == "https://files.example/example.jar" ]]; then
    cp {payload} "$output"
else
    echo "Unexpected URL: $url" >&2
    exit 1
fi
"""
    )
    fake_curl.chmod(0o755)

    service = ModpackService()
    info = ModpackInfo(source=ModpackSource.CURSEFORGE)
    env = os.environ | {
        "MODPACK_URL": "https://files.example/pack.zip",
        "CF_API_KEY": "fixture-key",
        "PATH": f"{fake_bin}:{os.environ['PATH']}",
    }
    result = subprocess.run(
        ["bash", "-euo", "pipefail", "-c", service._get_modpack_files_script(info)],
        cwd=server_dir,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert (server_dir / "mods/example.jar").read_bytes() == b"curseforge mod"
    assert (server_dir / "config/pack.txt").read_text() == "override"
    await service.close()


async def test_list_pagination_is_bounded(client):
    assert (await client.get("/api/eggs?skip=-1")).status_code == 422
    assert (await client.get("/api/eggs?limit=101")).status_code == 422
    assert (await client.get("/api/panels?limit=0")).status_code == 422


def test_datetime_columns_are_timezone_aware():
    from sqlalchemy import DateTime
    from sqlmodel import SQLModel

    for table_name in ("egg_configs", "panel_instances"):
        table = SQLModel.metadata.tables[table_name]
        for column in table.columns:
            if isinstance(column.type, DateTime):
                assert column.type.timezone, f"{table_name}.{column.name} must be timezone-aware"


@respx.mock
async def test_panel_lifecycle(client):
    from app.core.db import async_session_maker
    from app.models.panel import PanelInstance
    from app.services.panel_service import decrypt_panel_api_key

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
    get_response = await client.get(f"/api/panels/{panel_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Primary Panel"

    async with async_session_maker() as session:
        stored_panel = await session.get(PanelInstance, panel_id)
        assert stored_panel is not None
        assert stored_panel.api_key_encrypted != "ptla_test_key"
        assert decrypt_panel_api_key(stored_panel.api_key_encrypted) == "ptla_test_key"

    update_response = await client.patch(
        f"/api/panels/{panel_id}",
        json={"name": "Updated Panel", "api_key": "ptla_updated_key"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated Panel"
    assert "api_key" not in update_response.json()

    async with async_session_maker() as session:
        stored_panel = await session.get(PanelInstance, panel_id)
        assert stored_panel is not None
        assert decrypt_panel_api_key(stored_panel.api_key_encrypted) == "ptla_updated_key"

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


async def test_panel_test_rejects_non_http_url(client):
    create_response = await client.post(
        "/api/panels",
        json={"name": "Bad Panel", "url": "ftp://internal.host", "api_key": "key"},
    )
    assert create_response.status_code == 422


@respx.mock
async def test_panel_test_does_not_follow_redirects(client):
    create_response = await client.post(
        "/api/panels",
        json={"name": "Redirect Panel", "url": "http://panel.example.com", "api_key": "key"},
    )
    assert create_response.status_code == 201
    panel_id = create_response.json()["id"]

    respx.get("http://panel.example.com/api/application/nodes?per_page=1").mock(
        return_value=Response(301, headers={"location": "https://evil.example/"})
    )

    test_response = await client.post(f"/api/panels/{panel_id}/test")

    assert test_response.status_code == 200
    result = test_response.json()
    assert result["success"] is False
    assert "redirected" in result["message"]
