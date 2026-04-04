# Hatchery

Hatchery is a self hosted modpack to egg workflow for Minecraft server operators.

## MVP

The MVP does five things:

1. Sign in with Zitadel.
2. Import a Modrinth or CurseForge modpack URL.
3. Generate an editable Pterodactyl compatible egg.
4. Validate a panel connection with an application API key.
5. Export the egg JSON.

Panel deployment is not part of the MVP.

## Stack

1. Backend: FastAPI, SQLModel, PostgreSQL, Alembic
2. Frontend: React, Vite, Tailwind
3. Auth: Zitadel OIDC
4. Runtime: Podman Compose

## Run

1. Copy `.env.example` to `.env`.
2. Set the Zitadel variables.
3. Start the stack:

```bash
podman-compose up -d
```

4. Open `http://localhost:3000`.

## Services

1. `frontend`: static app served by Nginx
2. `backend`: API server with Alembic migrations on startup
3. `postgres`: production database for the MVP
4. `newt`: optional Pangolin tunnel sidecar

`newt` is isolated behind the `pangolin` profile so the MVP can run without Pangolin:

```bash
podman-compose up -d
```

Enable Pangolin only when needed:

```bash
podman-compose --profile pangolin up -d
```

## Backend

```bash
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## Tests

Backend:

```bash
cd backend
uv sync --extra dev
uv run pytest
```

Frontend:

```bash
cd frontend
pnpm typecheck
pnpm build
```
