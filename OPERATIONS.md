# Operations

Hatchery's supported production path is Podman Compose with PostgreSQL. SQLite
is intended only for local development and tests.

## Initial setup

1. Copy `.env.example` to `.env` and replace every placeholder secret.
2. Create a Zitadel web application using Authorization Code + PKCE.
3. Register `VITE_ZITADEL_REDIRECT_URI` and
   `VITE_ZITADEL_POST_LOGOUT_URI` as allowed redirect URIs.
4. Set `ZITADEL_PROJECT_ID` to the project ID used as the API token audience.
5. Set `ZITADEL_DOMAIN` and `VITE_ZITADEL_AUTHORITY` to the same Zitadel
   instance (without and with `https://`, respectively).
6. Set `CURSEFORGE_API_KEY` if CurseForge imports are required.
7. Start the stack with `podman-compose up -d`.
8. Confirm `http://localhost:8000/health` reports a reachable database.

Terminate TLS at a reverse proxy or ingress. Do not expose PostgreSQL publicly;
remove its host `ports` mapping when remote host access is unnecessary.

## Backups

Back up the database and `.env` together. The panel-encryption secret in `.env`
is required to decrypt stored panel credentials.

```bash
podman-compose exec -T postgres pg_dump -U hatchery -d hatchery -Fc > hatchery.dump
cp .env hatchery.env.backup
```

Store both files encrypted and test restoration periodically.

## Restore

Stop the backend before replacing an existing database, then restore into an
empty database:

```bash
podman-compose stop backend
podman-compose exec -T postgres dropdb -U hatchery --if-exists hatchery
podman-compose exec -T postgres createdb -U hatchery hatchery
podman-compose exec -T postgres pg_restore -U hatchery -d hatchery --no-owner < hatchery.dump
podman-compose start backend
```

Restore the matching `.env` before starting the backend. Verify `/health`, sign
in, and test one stored panel connection.

## Upgrades

1. Read the release notes and take a backup.
2. Pull the new source or release tag.
3. Rebuild and restart with `podman-compose up -d --build`.
4. The backend runs `alembic upgrade head` before starting the API.
5. Verify `/health`, authentication, egg export, and panel validation.

Never change `PANEL_API_KEY_ENCRYPTION_SECRET` casually. Rotating it requires
re-entering every stored panel API key.

## Modpack installation notes

Modrinth eggs resolve server-compatible files from `modrinth.index.json` and
apply both normal and server overrides. CurseForge eggs resolve the project/file
pairs in `manifest.json`; the target server's egg variable `CF_API_KEY` must be
set because CurseForge does not embed those mod files in client packs. Files
whose authors disable third-party distribution cannot be installed
automatically, and the installer exits with the affected project/file ID.
