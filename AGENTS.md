# AGENTS.md - AI Agent Guide for Hatchery

## Project Overview

Hatchery is a Modpack-to-Server Automation Platform that converts CurseForge and Modrinth modpack URLs into deployable Pterodactyl/Pelican server eggs.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, FastAPI, SQLModel, Uvicorn |
| Frontend | TypeScript, React 19, Vite, Tailwind CSS, TanStack Query |
| Database | PostgreSQL (production), SQLite (local dev/tests only) |
| Auth | Zitadel OIDC |
| Containerization | Podman + Podman Compose |
| Package Managers | uv (Python), pnpm (Node.js) |

## Project Structure

```
hatchery/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── api/            # API route handlers
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLModel database models
│   │   └── services/       # Business logic
│   ├── tests/              # Test files
│   ├── pyproject.toml      # Ruff, mypy, pytest config
│   └── uv.lock             # Python dependencies lock
├── frontend/               # TypeScript React frontend
│   ├── src/
│   │   ├── main.tsx        # React entry point
│   │   ├── App.tsx         # Route definitions
│   │   ├── components/     # UI and page components
│   │   ├── pages/          # Route page components
│   │   └── lib/            # Utilities (API client, auth)
│   ├── package.json
│   ├── pnpm-lock.yaml      # Node.js dependencies lock
│   └── vite.config.ts
└── docker-compose.yml      # Podman Compose config
```

## Commands

### Backend (from `backend/` directory)

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
uv run pytest

# Lint
uv run ruff check .

# Format
uv run ruff format .

# Type check
uv run mypy app --ignore-missing-imports
```

### Frontend (from `frontend/` directory)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Container (Podman)

```bash
# Start all services
podman-compose up -d

# View logs
podman-compose logs -f

# Stop services
podman-compose down
```

## Code Conventions

### Python

- PEP 8 with Ruff enforcement (line length: 100)
- Use type hints
- Prefer async/await for I/O operations
- Pydantic/SQLModel for API schemas and database models
- Business logic in `services/` module
- FastAPI routers in `api/` module
- Database models in `models/` module

### TypeScript

- Strict mode enabled
- Path alias `@/` for `./src/`
- Functional React components with hooks
- Reusable UI components in `components/ui/`
- Page components in `pages/`
- Centralized axios API client in `lib/api.ts`

## Architecture Patterns

- **Backend**: Service Layer Pattern, Repository Pattern, Router Pattern, Dependency Injection
- **Frontend**: Component-Based, API Client Pattern, Auth Context Pattern, Protected Routes

## Key Files

| Purpose | File |
|---------|------|
| Backend Entry | `backend/app/main.py` |
| Core Business Logic | `backend/app/services/modpack_service.py` |
| Configuration | `backend/app/core/config.py` |
| API Router | `backend/app/api/__init__.py` |
| Database Models | `backend/app/models/egg.py` |
| Frontend Entry | `frontend/src/main.tsx` |
| Route Definitions | `frontend/src/App.tsx` |
| API Client | `frontend/src/lib/api.ts` |
| Python Config | `backend/pyproject.toml` |
| TypeScript Config | `frontend/tsconfig.json` |
| CI Pipeline | `.github/workflows/ci.yml` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string (default: sqlite; postgres in compose) |
| `SECRET_KEY` | Application secret (generate for production) |
| `PANEL_API_KEY_ENCRYPTION_SECRET` | Fernet key source for stored panel API keys |
| `CURSEFORGE_API_KEY` | Required for CurseForge modpack imports |
| `ZITADEL_DOMAIN` | Zitadel OIDC provider domain (no scheme) |
| `ZITADEL_PROJECT_ID` | JWT audience; auth rejects all tokens while unset |
| `CORS_ORIGINS` | Allowed CORS origins (JSON list) |
| `VITE_API_URL` | Backend URL for frontend (empty = relative `/api` via nginx) |
| `VITE_ZITADEL_AUTHORITY` | Zitadel authority URL (with scheme) |
| `VITE_ZITADEL_CLIENT_ID` | Zitadel client ID |
| `VITE_ZITADEL_REDIRECT_URI` | OIDC redirect URI (`/callback`) |
| `VITE_ZITADEL_POST_LOGOUT_URI` | Post-logout redirect URI |

## CI Pipeline

GitHub Actions runs on push/PR to `main`:
- Backend: Ruff lint/format check, mypy, pytest (via uv)
- Frontend: pnpm lint, typecheck, build