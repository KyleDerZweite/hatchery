# Development

## Scope

This repository is trimmed to the MVP described in `MVP_PLAN.md`.

In scope:

1. OIDC sign in with Zitadel
2. Modpack import
3. Egg generation
4. Egg editing and export
5. Panel record management
6. Panel connection validation

Out of scope:

1. AI generation
2. Project workflows
3. `.mrpack` export
4. Automatic panel deployment

## Backend Commands

```bash
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Checks:

```bash
cd backend
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

## Frontend Commands

```bash
cd frontend
pnpm install
pnpm dev
```

Checks:

```bash
cd frontend
pnpm typecheck
pnpm build
```

## Database

1. PostgreSQL is the production database.
2. SQLite is allowed for local development and tests only.
3. Schema changes must go through Alembic migrations.

## Secrets

1. `PANEL_API_KEY_ENCRYPTION_SECRET` is required for encrypted panel credentials.
2. Do not change the encryption secret without planning a credential rotation.

## Pangolin

The `newt` service exists for Pangolin based access, but it is optional.

Run the MVP without Pangolin:

```bash
podman-compose up -d
```

Run with Pangolin:

```bash
podman-compose --profile pangolin up -d
```
