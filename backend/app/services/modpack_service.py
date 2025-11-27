"""
Modpack Service - URL parsing and egg generation for CurseForge and Modrinth modpacks.

This service handles:
1. Parsing CurseForge and Modrinth URLs
2. Fetching modpack metadata via APIs
3. Generating Pterodactyl/Pelican egg configurations
"""

import re
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from dataclasses import dataclass, field

import httpx

from app.core.config import settings
from app.models.egg import ModpackSource


class ModpackType(str, Enum):
    """Supported modloader types."""
    FORGE = "forge"
    FABRIC = "fabric"
    NEOFORGE = "neoforge"
    QUILT = "quilt"
    VANILLA = "vanilla"


@dataclass
class ModpackInfo:
    """Container for parsed modpack information."""
    name: str = "Unknown Modpack"
    source: ModpackSource = ModpackSource.UNKNOWN
    source_url: str = ""
    slug: str = ""
    project_id: str = ""
    minecraft_version: str | None = None
    modloader: ModpackType | None = None
    modloader_version: str | None = None
    java_version: int = 17
    description: str | None = None
    icon_url: str | None = None
    author: str | None = None
    mod_count: int = 0
    mods: list[dict[str, Any]] = field(default_factory=list)
    download_url: str | None = None
    file_id: str | None = None


class ModpackService:
    """Service for parsing modpack URLs and generating egg configurations."""

    # URL patterns for different platforms
    CURSEFORGE_PATTERNS = [
        r"curseforge\.com/minecraft/modpacks/([a-zA-Z0-9-]+)(?:/files/(\d+))?",
        r"legacy\.curseforge\.com/minecraft/modpacks/([a-zA-Z0-9-]+)(?:/files/(\d+))?",
    ]

    MODRINTH_PATTERNS = [
        r"modrinth\.com/modpack/([a-zA-Z0-9-]+)(?:/version/([a-zA-Z0-9]+))?",
    ]

    # Modrinth API base URL
    MODRINTH_API = "https://api.modrinth.com/v2"
    
    # CurseForge API base URL
    CURSEFORGE_API = "https://api.curseforge.com/v1"

    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "Hatchery/1.0 (https://github.com/hatchery)"}
        )

    async def close(self):
        """Close the HTTP client."""
        await self.http_client.aclose()

    def detect_source(self, url: str) -> tuple[ModpackSource, str | None, str | None]:
        """
        Detect the modpack source from a URL.

        Returns:
            Tuple of (source platform, slug/id, optional version/file id)
        """
        for pattern in self.CURSEFORGE_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return ModpackSource.CURSEFORGE, match.group(1), match.group(2) if len(match.groups()) > 1 else None

        for pattern in self.MODRINTH_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return ModpackSource.MODRINTH, match.group(1), match.group(2) if len(match.groups()) > 1 else None

        return ModpackSource.UNKNOWN, None, None

    async def fetch_modpack_info(self, url: str) -> ModpackInfo:
        """
        Fetch modpack information from the URL.

        Args:
            url: CurseForge or Modrinth modpack URL

        Returns:
            ModpackInfo with fetched metadata
        """
        source, slug, version_id = self.detect_source(url)

        if source == ModpackSource.MODRINTH and slug:
            return await self._fetch_modrinth_info(slug, version_id, url)
        elif source == ModpackSource.CURSEFORGE and slug:
            return await self._fetch_curseforge_info(slug, version_id, url)
        else:
            # Return placeholder for unknown sources
            return ModpackInfo(
                name="Unknown Modpack",
                source=source,
                source_url=url,
                description="Unable to parse modpack URL. Please provide a valid CurseForge or Modrinth URL.",
            )

    async def _fetch_modrinth_info(self, slug: str, version_id: str | None, url: str) -> ModpackInfo:
        """Fetch modpack info from Modrinth API."""
        info = ModpackInfo(
            source=ModpackSource.MODRINTH,
            source_url=url,
            slug=slug,
        )

        try:
            # Fetch project info
            response = await self.http_client.get(f"{self.MODRINTH_API}/project/{slug}")
            if response.status_code == 200:
                data = response.json()
                info.name = data.get("title", slug)
                info.project_id = data.get("id", "")
                info.description = data.get("description", "")
                info.icon_url = data.get("icon_url")

            # Fetch versions to get loader/minecraft info
            versions_response = await self.http_client.get(
                f"{self.MODRINTH_API}/project/{slug}/version"
            )
            if versions_response.status_code == 200:
                versions = versions_response.json()
                if versions:
                    # Use specified version or latest
                    version = None
                    if version_id:
                        version = next((v for v in versions if v.get("id") == version_id or v.get("version_number") == version_id), None)
                    if not version:
                        version = versions[0]  # Latest version

                    info.file_id = version.get("id")
                    
                    # Get Minecraft version
                    game_versions = version.get("game_versions", [])
                    mc_versions = [v for v in game_versions if re.match(r"^\d+\.\d+(\.\d+)?$", v)]
                    if mc_versions:
                        info.minecraft_version = mc_versions[0]

                    # Get modloader
                    loaders = version.get("loaders", [])
                    if loaders:
                        loader = loaders[0].lower()
                        if "fabric" in loader:
                            info.modloader = ModpackType.FABRIC
                        elif "forge" in loader:
                            info.modloader = ModpackType.FORGE
                        elif "neoforge" in loader:
                            info.modloader = ModpackType.NEOFORGE
                        elif "quilt" in loader:
                            info.modloader = ModpackType.QUILT

                    # Get download URL
                    files = version.get("files", [])
                    if files:
                        primary_file = next((f for f in files if f.get("primary")), files[0])
                        info.download_url = primary_file.get("url")

                    # Get dependencies for loader version
                    deps = version.get("dependencies", [])
                    for dep in deps:
                        dep_id = dep.get("project_id", "")
                        if dep_id in ["P7dR8mSH", "fabric-api"]:  # Fabric API
                            continue
                        version_id = dep.get("version_id")
                        if version_id and info.modloader:
                            info.modloader_version = version_id

            # Detect Java version based on Minecraft version
            info.java_version = self._detect_java_version(info.minecraft_version)

        except Exception as e:
            # Fallback on error
            info.name = slug.replace("-", " ").title()
            info.description = f"Modrinth modpack: {slug} (Error fetching details: {e})"

        return info

    async def _fetch_curseforge_info(self, slug: str, file_id: str | None, url: str) -> ModpackInfo:
        """Fetch modpack info from CurseForge API."""
        info = ModpackInfo(
            source=ModpackSource.CURSEFORGE,
            source_url=url,
            slug=slug,
        )

        # CurseForge API requires an API key
        api_key = settings.curseforge_api_key
        if not api_key:
            info.name = slug.replace("-", " ").title()
            info.description = f"CurseForge modpack: {slug} (API key not configured)"
            return info

        try:
            headers = {"x-api-key": api_key}

            # Search for project by slug
            search_response = await self.http_client.get(
                f"{self.CURSEFORGE_API}/mods/search",
                params={
                    "gameId": 432,  # Minecraft
                    "classId": 4471,  # Modpacks
                    "slug": slug,
                },
                headers=headers,
            )

            if search_response.status_code == 200:
                search_data = search_response.json()
                mods = search_data.get("data", [])
                if mods:
                    mod = mods[0]
                    info.project_id = str(mod.get("id", ""))
                    info.name = mod.get("name", slug)
                    info.description = mod.get("summary", "")
                    
                    # Get icon
                    logo = mod.get("logo", {})
                    info.icon_url = logo.get("url") if logo else None

                    # Get author
                    authors = mod.get("authors", [])
                    if authors:
                        info.author = authors[0].get("name")

                    # Get latest file info
                    latest_files = mod.get("latestFiles", [])
                    if latest_files:
                        target_file = None
                        if file_id:
                            target_file = next((f for f in latest_files if str(f.get("id")) == file_id), None)
                        if not target_file:
                            target_file = latest_files[0]

                        info.file_id = str(target_file.get("id", ""))
                        info.download_url = target_file.get("downloadUrl")

                        # Get Minecraft version
                        game_versions = target_file.get("gameVersions", [])
                        mc_versions = [v for v in game_versions if re.match(r"^\d+\.\d+(\.\d+)?$", v)]
                        if mc_versions:
                            info.minecraft_version = mc_versions[0]

                        # Get modloader
                        for ver in game_versions:
                            ver_lower = ver.lower()
                            if "fabric" in ver_lower:
                                info.modloader = ModpackType.FABRIC
                                break
                            elif "neoforge" in ver_lower:
                                info.modloader = ModpackType.NEOFORGE
                                break
                            elif "forge" in ver_lower:
                                info.modloader = ModpackType.FORGE
                                break
                            elif "quilt" in ver_lower:
                                info.modloader = ModpackType.QUILT
                                break

            # Detect Java version
            info.java_version = self._detect_java_version(info.minecraft_version)

        except Exception as e:
            info.name = slug.replace("-", " ").title()
            info.description = f"CurseForge modpack: {slug} (Error: {e})"

        return info

    def _detect_java_version(self, minecraft_version: str | None) -> int:
        """Detect required Java version based on Minecraft version."""
        if not minecraft_version:
            return 17

        try:
            parts = minecraft_version.split(".")
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0

            if major == 1:
                if minor >= 21:
                    return 21
                elif minor >= 18:
                    return 17
                elif minor >= 17:
                    return 16
                elif minor >= 12:
                    return 11
                else:
                    return 8
            else:
                return 21  # Future versions
        except (ValueError, IndexError):
            return 17

    def generate_egg_json(
        self,
        modpack_info: ModpackInfo,
        java_version: int | None = None,
    ) -> dict[str, Any]:
        """
        Generate a Pterodactyl egg JSON configuration.

        Args:
            modpack_info: Parsed modpack information
            java_version: Override Java version (uses detected version if None)

        Returns:
            Pterodactyl-compatible egg JSON structure
        """
        java_ver = java_version or modpack_info.java_version
        modloader = modpack_info.modloader or ModpackType.FORGE

        # Generate egg JSON
        egg_json = {
            "_comment": "DO NOT EDIT: FILE GENERATED AUTOMATICALLY BY HATCHERY",
            "meta": {
                "version": "PTDL_v2",
                "update_url": None
            },
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "name": modpack_info.name,
            "author": "hatchery@generated.local",
            "description": modpack_info.description or f"Generated {modloader.value.title()} server for {modpack_info.name}",
            "features": ["eula", "java_version", "pid_limit"],
            "docker_images": self._get_docker_images(java_ver),
            "file_denylist": [],
            "startup": self._get_startup_command(modloader, java_ver),
            "config": {
                "files": '{\r\n    "server.properties": {\r\n        "parser": "properties",\r\n        "find": {\r\n            "server-port": "{{server.build.default.port}}",\r\n            "enable-query": "true",\r\n            "query.port": "{{server.build.default.port}}"\r\n        }\r\n    }\r\n}',
                "startup": '{\r\n    "done": ")! For help, type "\r\n}',
                "logs": '{\r\n    "custom": false,\r\n    "location": "logs/latest.log"\r\n}',
                "stop": "stop"
            },
            "scripts": {
                "installation": {
                    "script": self._get_install_script(modpack_info, modloader),
                    "container": f"eclipse-temurin:{java_ver}-jdk",
                    "entrypoint": "bash"
                }
            },
            "variables": self._get_variables(modpack_info, modloader, java_ver),
        }

        return egg_json

    def _get_docker_images(self, java_version: int) -> dict[str, str]:
        """Get Docker image mapping for Java version."""
        base = "ghcr.io/pterodactyl/yolks"
        images = {
            f"Java {java_version}": f"{base}:java_{java_version}",
        }
        
        # Add common fallbacks
        if java_version != 17:
            images["Java 17"] = f"{base}:java_17"
        if java_version != 21:
            images["Java 21"] = f"{base}:java_21"

        return images

    def _get_startup_command(self, modloader: ModpackType, java_version: int) -> str:
        """Get the server startup command."""
        memory_flags = "-Xms128M -Xmx{{SERVER_MEMORY}}M"

        # Java optimization flags based on version
        if java_version >= 17:
            jvm_flags = "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1"
        else:
            jvm_flags = "-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:MaxGCPauseMillis=100 -XX:+DisableExplicitGC -XX:TargetSurvivorRatio=90 -XX:G1NewSizePercent=50 -XX:G1MaxNewSizePercent=80 -XX:G1HeapWastePercent=5 -XX:+UseStringDeduplication"

        return f"java {memory_flags} {jvm_flags} -jar {{{{SERVER_JARFILE}}}}"

    def _get_install_script(self, modpack_info: ModpackInfo, modloader: ModpackType) -> str:
        """Get the installation script for the egg."""
        mc_version = modpack_info.minecraft_version or "1.20.1"
        loader_version = modpack_info.modloader_version or "latest"

        if modloader == ModpackType.FABRIC:
            script = self._get_fabric_install_script(mc_version, loader_version, modpack_info)
        elif modloader == ModpackType.FORGE:
            script = self._get_forge_install_script(mc_version, loader_version, modpack_info)
        elif modloader == ModpackType.NEOFORGE:
            script = self._get_neoforge_install_script(mc_version, loader_version, modpack_info)
        elif modloader == ModpackType.QUILT:
            script = self._get_quilt_install_script(mc_version, loader_version, modpack_info)
        else:
            script = self._get_vanilla_install_script(mc_version, modpack_info)

        return script

    def _get_fabric_install_script(self, mc_version: str, loader_version: str, info: ModpackInfo) -> str:
        """Generate Fabric server installation script."""
        return f'''#!/bin/bash
# Fabric Server Installation Script - Generated by Hatchery
# Modpack: {info.name}
# Source: {info.source_url}

cd /mnt/server || exit 1

echo "🧵 Installing Fabric server for Minecraft {mc_version}"

# Install dependencies
apt-get update && apt-get install -y curl jq unzip

# Clean up any existing files
rm -rf mods/ config/ server.jar fabric-installer.jar

# Create necessary directories
mkdir -p mods config logs

MINECRAFT_VERSION="{mc_version}"
FABRIC_VERSION="${{FABRIC_VERSION:-{loader_version}}}"

if [[ "$FABRIC_VERSION" == "latest" ]]; then
    echo "⬇️ Fetching latest Fabric version..."
    FABRIC_VERSION=$(curl -sSL "https://meta.fabricmc.net/v2/versions/loader" | jq -r '.[0].version')
fi

# Download Fabric installer
echo "⬇️ Downloading Fabric installer..."
INSTALLER_VERSION=$(curl -sSL "https://meta.fabricmc.net/v2/versions/installer" | jq -r '.[0].version')
curl -o fabric-installer.jar -sSL "https://maven.fabricmc.net/net/fabricmc/fabric-installer/$INSTALLER_VERSION/fabric-installer-$INSTALLER_VERSION.jar"

if [[ ! -f fabric-installer.jar ]]; then
    echo "❌ Failed to download Fabric installer"
    exit 1
fi

# Install Fabric server
echo "🔧 Installing Fabric server..."
java -jar fabric-installer.jar server -mcversion "$MINECRAFT_VERSION" -loader "$FABRIC_VERSION" -downloadMinecraft

# Find and rename server jar
SERVER_JAR=$(find . -maxdepth 1 -name "fabric-server*.jar" -o -name "server.jar" | head -n1)
if [[ -n "$SERVER_JAR" && "$SERVER_JAR" != "./server.jar" ]]; then
    mv "$SERVER_JAR" server.jar
fi

rm -f fabric-installer.jar

# Download modpack if URL provided
if [[ -n "${{MODPACK_URL}}" ]]; then
    echo "📦 Downloading modpack..."
    curl -o modpack.zip -sSL "${{MODPACK_URL}}"
    if [[ -f modpack.zip ]]; then
        unzip -o modpack.zip -d modpack_temp/
        # Copy overrides
        if [[ -d modpack_temp/overrides ]]; then
            cp -r modpack_temp/overrides/* ./
        fi
        rm -rf modpack.zip modpack_temp/
    fi
fi

# Accept EULA
echo "eula=true" > eula.txt

echo "✅ Fabric server installation completed!"
'''

    def _get_forge_install_script(self, mc_version: str, loader_version: str, info: ModpackInfo) -> str:
        """Generate Forge server installation script."""
        return f'''#!/bin/bash
# Forge Server Installation Script - Generated by Hatchery
# Modpack: {info.name}
# Source: {info.source_url}

cd /mnt/server || exit 1

echo "🔥 Installing Forge server for Minecraft {mc_version}"

# Install dependencies
apt-get update && apt-get install -y curl jq unzip

# Clean up any existing files
rm -rf mods/ config/ server.jar forge-installer.jar

# Create necessary directories
mkdir -p mods config logs

MINECRAFT_VERSION="{mc_version}"
FORGE_VERSION="${{FORGE_VERSION:-{loader_version}}}"

if [[ "$FORGE_VERSION" == "recommended" ]] || [[ "$FORGE_VERSION" == "latest" ]]; then
    echo "⬇️ Fetching Forge version info..."
    FORGE_VERSION=$(curl -sSL "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json" | jq -r ".promos[\\"$MINECRAFT_VERSION-recommended\\"] // .promos[\\"$MINECRAFT_VERSION-latest\\"]")
fi

FORGE_URL="https://maven.minecraftforge.net/net/minecraftforge/forge/$MINECRAFT_VERSION-$FORGE_VERSION/forge-$MINECRAFT_VERSION-$FORGE_VERSION-installer.jar"

echo "⬇️ Downloading Forge installer..."
curl -o forge-installer.jar -sSL "$FORGE_URL"

if [[ ! -f forge-installer.jar ]]; then
    echo "❌ Failed to download Forge installer"
    exit 1
fi

# Install Forge
echo "🔧 Installing Forge server..."
java -jar forge-installer.jar --installServer

# Find the server jar
SERVER_JAR=$(find . -maxdepth 1 -name "forge-*.jar" -not -name "*installer*" | head -n1)
if [[ -n "$SERVER_JAR" ]]; then
    cp "$SERVER_JAR" server.jar
fi

rm -f forge-installer.jar

# Download modpack if URL provided
if [[ -n "${{MODPACK_URL}}" ]]; then
    echo "📦 Downloading modpack..."
    curl -o modpack.zip -sSL "${{MODPACK_URL}}"
    if [[ -f modpack.zip ]]; then
        unzip -o modpack.zip -d modpack_temp/
        # Copy overrides
        if [[ -d modpack_temp/overrides ]]; then
            cp -r modpack_temp/overrides/* ./
        fi
        rm -rf modpack.zip modpack_temp/
    fi
fi

# Accept EULA
echo "eula=true" > eula.txt

echo "✅ Forge server installation completed!"
'''

    def _get_neoforge_install_script(self, mc_version: str, loader_version: str, info: ModpackInfo) -> str:
        """Generate NeoForge server installation script."""
        return f'''#!/bin/bash
# NeoForge Server Installation Script - Generated by Hatchery
# Modpack: {info.name}
# Source: {info.source_url}

cd /mnt/server || exit 1

echo "⚡ Installing NeoForge server for Minecraft {mc_version}"

# Install dependencies
apt-get update && apt-get install -y curl jq unzip

# Clean up any existing files
rm -rf mods/ config/ server.jar neoforge-installer.jar

# Create necessary directories
mkdir -p mods config logs

MINECRAFT_VERSION="{mc_version}"
NEOFORGE_VERSION="${{NEOFORGE_VERSION:-{loader_version}}}"

if [[ "$NEOFORGE_VERSION" == "latest" ]]; then
    echo "⬇️ Fetching latest NeoForge version..."
    NEOFORGE_VERSION=$(curl -sSL "https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge" | jq -r '.versions[-1]')
fi

NEOFORGE_URL="https://maven.neoforged.net/releases/net/neoforged/neoforge/$NEOFORGE_VERSION/neoforge-$NEOFORGE_VERSION-installer.jar"

echo "⬇️ Downloading NeoForge installer..."
curl -o neoforge-installer.jar -sSL "$NEOFORGE_URL"

if [[ ! -f neoforge-installer.jar ]]; then
    echo "❌ Failed to download NeoForge installer"
    exit 1
fi

# Install NeoForge
echo "🔧 Installing NeoForge server..."
java -jar neoforge-installer.jar --installServer

rm -f neoforge-installer.jar

# Download modpack if URL provided
if [[ -n "${{MODPACK_URL}}" ]]; then
    echo "📦 Downloading modpack..."
    curl -o modpack.zip -sSL "${{MODPACK_URL}}"
    if [[ -f modpack.zip ]]; then
        unzip -o modpack.zip -d modpack_temp/
        if [[ -d modpack_temp/overrides ]]; then
            cp -r modpack_temp/overrides/* ./
        fi
        rm -rf modpack.zip modpack_temp/
    fi
fi

# Accept EULA
echo "eula=true" > eula.txt

echo "✅ NeoForge server installation completed!"
'''

    def _get_quilt_install_script(self, mc_version: str, loader_version: str, info: ModpackInfo) -> str:
        """Generate Quilt server installation script."""
        return f'''#!/bin/bash
# Quilt Server Installation Script - Generated by Hatchery
# Modpack: {info.name}
# Source: {info.source_url}

cd /mnt/server || exit 1

echo "🪡 Installing Quilt server for Minecraft {mc_version}"

# Install dependencies
apt-get update && apt-get install -y curl jq unzip

# Clean up any existing files
rm -rf mods/ config/ server.jar quilt-installer.jar

# Create necessary directories
mkdir -p mods config logs

MINECRAFT_VERSION="{mc_version}"
QUILT_VERSION="${{QUILT_VERSION:-{loader_version}}}"

if [[ "$QUILT_VERSION" == "latest" ]]; then
    echo "⬇️ Fetching latest Quilt version..."
    QUILT_VERSION=$(curl -sSL "https://meta.quiltmc.org/v3/versions/loader" | jq -r '.[0].version')
fi

# Download Quilt installer
echo "⬇️ Downloading Quilt installer..."
INSTALLER_VERSION=$(curl -sSL "https://meta.quiltmc.org/v3/versions/installer" | jq -r '.[0].version')
curl -o quilt-installer.jar -sSL "https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/$INSTALLER_VERSION/quilt-installer-$INSTALLER_VERSION.jar"

if [[ ! -f quilt-installer.jar ]]; then
    echo "❌ Failed to download Quilt installer"
    exit 1
fi

# Install Quilt server
echo "🔧 Installing Quilt server..."
java -jar quilt-installer.jar install server "$MINECRAFT_VERSION" "$QUILT_VERSION" --download-server

# Rename to server.jar
if [[ -f "quilt-server-launch.jar" ]]; then
    mv quilt-server-launch.jar server.jar
fi

rm -f quilt-installer.jar

# Download modpack if URL provided
if [[ -n "${{MODPACK_URL}}" ]]; then
    echo "📦 Downloading modpack..."
    curl -o modpack.zip -sSL "${{MODPACK_URL}}"
    if [[ -f modpack.zip ]]; then
        unzip -o modpack.zip -d modpack_temp/
        if [[ -d modpack_temp/overrides ]]; then
            cp -r modpack_temp/overrides/* ./
        fi
        rm -rf modpack.zip modpack_temp/
    fi
fi

# Accept EULA
echo "eula=true" > eula.txt

echo "✅ Quilt server installation completed!"
'''

    def _get_vanilla_install_script(self, mc_version: str, info: ModpackInfo) -> str:
        """Generate Vanilla server installation script."""
        return f'''#!/bin/bash
# Vanilla Server Installation Script - Generated by Hatchery
# Modpack: {info.name}
# Source: {info.source_url}

cd /mnt/server || exit 1

echo "🎮 Installing Vanilla Minecraft server {mc_version}"

# Install dependencies
apt-get update && apt-get install -y curl jq

MINECRAFT_VERSION="{mc_version}"

# Get version manifest
echo "⬇️ Fetching version manifest..."
VERSION_MANIFEST=$(curl -sSL "https://launchermeta.mojang.com/mc/game/version_manifest.json")
VERSION_URL=$(echo "$VERSION_MANIFEST" | jq -r ".versions[] | select(.id==\\"$MINECRAFT_VERSION\\") | .url")

if [[ -z "$VERSION_URL" ]]; then
    echo "❌ Could not find Minecraft version $MINECRAFT_VERSION"
    exit 1
fi

# Get server download URL
SERVER_URL=$(curl -sSL "$VERSION_URL" | jq -r '.downloads.server.url')

echo "⬇️ Downloading Minecraft server..."
curl -o server.jar -sSL "$SERVER_URL"

# Accept EULA
echo "eula=true" > eula.txt

echo "✅ Vanilla server installation completed!"
'''

    def _get_variables(
        self,
        modpack_info: ModpackInfo,
        modloader: ModpackType,
        java_version: int,
    ) -> list[dict[str, Any]]:
        """Get egg environment variables."""
        variables = [
            {
                "name": "Server Jar File",
                "description": "The name of the server jarfile to run.",
                "env_variable": "SERVER_JARFILE",
                "default_value": "server.jar",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:50",
                "field_type": "text"
            },
            {
                "name": "Server Memory",
                "description": "The maximum amount of memory (in MB) for the server.",
                "env_variable": "SERVER_MEMORY",
                "default_value": self._get_recommended_memory(modpack_info.mod_count),
                "user_viewable": True,
                "user_editable": False,
                "rules": "required|numeric|min:512",
                "field_type": "text"
            },
            {
                "name": "Minecraft Version",
                "description": "The Minecraft version for the server.",
                "env_variable": "MINECRAFT_VERSION",
                "default_value": modpack_info.minecraft_version or "1.20.1",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:20",
                "field_type": "text"
            },
        ]

        # Add modloader-specific variables
        if modloader == ModpackType.FABRIC:
            variables.append({
                "name": "Fabric Version",
                "description": "The version of Fabric loader to install.",
                "env_variable": "FABRIC_VERSION",
                "default_value": modpack_info.modloader_version or "latest",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:20",
                "field_type": "text"
            })
        elif modloader == ModpackType.FORGE:
            variables.append({
                "name": "Forge Version",
                "description": "The version of Forge to install.",
                "env_variable": "FORGE_VERSION",
                "default_value": modpack_info.modloader_version or "recommended",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:20",
                "field_type": "text"
            })
        elif modloader == ModpackType.NEOFORGE:
            variables.append({
                "name": "NeoForge Version",
                "description": "The version of NeoForge to install.",
                "env_variable": "NEOFORGE_VERSION",
                "default_value": modpack_info.modloader_version or "latest",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:20",
                "field_type": "text"
            })
        elif modloader == ModpackType.QUILT:
            variables.append({
                "name": "Quilt Version",
                "description": "The version of Quilt loader to install.",
                "env_variable": "QUILT_VERSION",
                "default_value": modpack_info.modloader_version or "latest",
                "user_viewable": True,
                "user_editable": True,
                "rules": "required|string|max:20",
                "field_type": "text"
            })

        # Add modpack URL variable if available
        if modpack_info.download_url:
            variables.append({
                "name": "Modpack URL",
                "description": "Direct download URL for the modpack.",
                "env_variable": "MODPACK_URL",
                "default_value": modpack_info.download_url,
                "user_viewable": True,
                "user_editable": True,
                "rules": "nullable|url",
                "field_type": "text"
            })

        return variables

    def _get_recommended_memory(self, mod_count: int) -> str:
        """Get recommended memory based on mod count."""
        if mod_count > 200:
            return "6144"
        elif mod_count > 100:
            return "4096"
        elif mod_count > 50:
            return "3072"
        elif mod_count > 20:
            return "2048"
        else:
            return "1536"


# Singleton instance
modpack_service = ModpackService()


async def get_modpack_service() -> ModpackService:
    """Get the modpack service instance."""
    return modpack_service
