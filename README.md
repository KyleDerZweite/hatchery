# Hatchery

Hatchery turns a Modrinth or CurseForge modpack URL into an editable, exportable
Pterodactyl-compatible egg. Self-hosted, AGPLv3-or-later.

## Run it locally

Prerequisites: [uv](https://docs.astral.sh/uv/getting-started/installation/),
[pnpm](https://pnpm.io/installation), and Node 22+.

```bash
./dev.sh
```

That starts the API on <http://127.0.0.1:8000> and the app on
<http://127.0.0.1:5173>, both with hot reloading. It creates `.env` from
`.env.example` on first run, installs dependencies when the lockfiles change, and
applies database migrations. Press Ctrl+C to stop both.

No Docker, no Compose, no identity provider. Local development uses SQLite and
`AUTH_MODE=dev`, which signs you in as a fixed local user (`dev@localhost`, roles
`ADMIN` and `MEMBER`). Authorization still applies: that user owns the records it
creates, exactly like a real one.

To import CurseForge packs, set `CURSEFORGE_API_KEY` in `.env`. Modrinth needs no key.

## What it does

1. Import a Modrinth or CurseForge modpack URL.
2. Generate an editable Pterodactyl-compatible egg.
3. Validate a panel connection with an application API key.
4. Export the egg JSON.

Panel deployment is not part of the MVP. Current product direction is in
[DIRECTION.md](./DIRECTION.md).

## Checks

```bash
cd backend  && uv run pytest && uv run ruff check . && uv run mypy app
cd frontend && pnpm lint && pnpm typecheck && pnpm build
```

## Authentication

| | Local (`AUTH_MODE=dev`) | Production (`AUTH_MODE=zitadel`, the default) |
|---|---|---|
| Identity | fixed `dev-user` | Zitadel OIDC, JWT verified against JWKS |
| Config | none | `ZITADEL_DOMAIN`, `ZITADEL_PROJECT_ID`, `ZITADEL_CLIENT_ID` |
| Database | SQLite | PostgreSQL |

`AUTH_MODE` defaults to `zitadel`, so the local bypass can never turn on by
omission. The API refuses to start if `AUTH_MODE=dev` is paired with a
non-SQLite database, and refuses to start in `zitadel` mode if any required
setting is missing. The browser app fetches its auth config from
`/api/auth/config` at startup, so no OIDC settings are baked into the build.

## Production

PostgreSQL + Zitadel, deployed with Compose. See [OPERATIONS.md](./OPERATIONS.md).
`compose.yaml` is for deployment only — it is not used for local development.

## Stack

FastAPI, SQLModel, Alembic, PostgreSQL · React 19, Vite, Tailwind v4, TanStack
Query · uv (Python), pnpm (JavaScript).

## License

AGPLv3 or later. See [LICENSE](./LICENSE).
