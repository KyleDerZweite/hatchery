# Operations

Production runs on Compose: PostgreSQL, the API, and nginx serving the built app.
Local development does not use any of this — see [README.md](./README.md).

## Initial setup

1. Copy `.env.example` to `.env` and fill in the production block:
   `AUTH_MODE=zitadel`, `DATABASE_URL`, `POSTGRES_PASSWORD`,
   `PANEL_API_KEY_ENCRYPTION_SECRET`, `ZITADEL_DOMAIN`, `ZITADEL_PROJECT_ID`,
   `ZITADEL_CLIENT_ID`. The API refuses to start if any of these is missing.
2. Create a Zitadel web application using Authorization Code + PKCE.
3. Register `https://<your-host>/callback` as an allowed redirect URI and
   `https://<your-host>/login` as the post-logout URI. The app derives both from
   its own origin, so there is nothing to configure on our side.
4. Set `ZITADEL_PROJECT_ID` to the project ID used as the API token audience.
5. Start it:

```bash
podman-compose up -d
```

The app is served on port 3000. Terminate TLS at a reverse proxy or ingress.
Only the frontend publishes a port: the API and PostgreSQL are reachable only on
the internal Compose network.

Check health with `podman-compose ps` — the backend reports healthy once it can
reach the database.

## Backups

Back up the database and `.env` together: `PANEL_API_KEY_ENCRYPTION_SECRET` is
required to decrypt stored panel credentials.

```bash
podman-compose exec -T postgres pg_dump -U hatchery -d hatchery -Fc > hatchery.dump
cp .env hatchery.env.backup
```

Store both encrypted, and test restoration periodically.

## Restore

Stop the backend before replacing an existing database:

```bash
podman-compose stop backend
podman-compose exec -T postgres dropdb -U hatchery --if-exists hatchery
podman-compose exec -T postgres createdb -U hatchery hatchery
podman-compose exec -T postgres pg_restore -U hatchery -d hatchery --no-owner < hatchery.dump
podman-compose start backend
```

Restore the matching `.env` first. Then verify sign-in, egg export, and one
stored panel connection.

## Upgrades

1. Read the release notes and take a backup.
2. Pull the new source or release tag.
3. `podman-compose up -d --build`. The backend runs `alembic upgrade head` before
   serving.
4. Verify sign-in, egg export, and panel validation.

Never change `PANEL_API_KEY_ENCRYPTION_SECRET` casually: rotating it requires
re-entering every stored panel API key.

## Modpack installation notes

Modrinth eggs resolve server-compatible files from `modrinth.index.json` and apply
both normal and server overrides. CurseForge eggs resolve the project/file pairs in
`manifest.json`; the target server's egg variable `CF_API_KEY` must be set, because
CurseForge does not embed mod files in client packs. Files whose authors disable
third-party distribution cannot be installed automatically, and the installer exits
with the affected project/file ID.
