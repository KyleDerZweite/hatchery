# AGENTS.md - Guide for AI agents working on Hatchery

Hatchery converts CurseForge and Modrinth modpack URLs into deployable
Pterodactyl/Pelican server eggs.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, FastAPI, SQLModel, Alembic, Uvicorn |
| Frontend | TypeScript, React 19, Vite, Tailwind v4, TanStack Query |
| Database | PostgreSQL in production; SQLite locally and in tests |
| Auth | Zitadel OIDC in production; a fixed local user with `AUTH_MODE=dev` |
| Package managers | uv (Python), pnpm (JavaScript) |
| Deployment | Podman Compose (`compose.yaml`), production only |

## Commands

`./dev.sh` from the repo root starts both sides with hot reloading. That is the
only supported local workflow — do not reintroduce a Compose-based one.

```bash
# backend/
uv run pytest
uv run ruff check .      # and: uv run ruff format .
uv run mypy app

# frontend/
pnpm lint
pnpm typecheck
pnpm build
```

## Layout

```
backend/app/
  main.py            FastAPI app, health endpoint
  api/               routers: auth (public config), eggs, panels; dependencies.py holds ownership checks
  core/              config.py (settings + startup validation), security.py (the auth boundary), db.py, rate_limit.py
  models/            SQLModel tables and schemas: egg.py, panel.py
  services/          modpack_service.py (URL parsing, egg generation), panel_service.py (encryption, connection test)
frontend/src/
  App.tsx            routes
  lib/auth.tsx       the whole auth surface: config fetch, dev + Zitadel providers, useAuth
  lib/api.ts         fetch-based API client; throws ApiError carrying the backend's `detail`
  pages/, components/
```

## Conventions

- Authentication mode is decided in exactly one place: `get_current_user` in
  `core/security.py`. Do not add `if dev` branches to business logic.
- Settings are validated once, at startup, in `core/config.py`. Do not read
  environment variables elsewhere.
- Authorization lives in `api/dependencies.py` (`get_*_or_404`). The frontend's
  `canManage` is a UI affordance only; the backend re-checks every request.
- Errors surface through `ApiError.message`, which carries FastAPI's `detail`.
  Do not re-extract error details in components.
- Tailwind is configured in CSS (`src/index.css`, `@theme`). There is no
  `tailwind.config.js`.
- No barrel/re-export modules. Import from the defining module.
