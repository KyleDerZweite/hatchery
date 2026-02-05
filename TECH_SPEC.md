# TECH_SPEC.md — Technical Specification for Hatchery + ModMorphic Merge

## 1. Executive Summary

### Objective
Merge **ModMorphic** (`morphic/`) INTO **Hatchery** (main project) to create a unified platform that:
1. Parses existing modpack URLs (CurseForge/Modrinth) → Pterodactyl eggs
2. Generates NEW modpacks from AI prompts → .mrpack exports
3. Provides unified Zitadel OIDC authentication
4. Uses modern tooling (uv/pnpm/podman-compose)

### Why Merge?
- **Hatchery** has superior auth (Zitadel OIDC), better project structure, SQLite/PostgreSQL flexibility
- **ModMorphic** has AI-powered modpack creation, Modrinth caching, quest generation, .mrpack export
- Both duplicate AI services and Modrinth API logic
- Merging eliminates ~40% code duplication and creates a complete platform

### Outcome
Single codebase at `/home/kyle/CodingProjects/hatchery/` with:
- Egg generation from existing modpacks (Hatchery core)
- AI-powered modpack creation from prompts (ModMorphic features)
- Unified services, models, and frontend

---

## 2. Architecture Diagram (Target State)

```
hatchery/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry (existing)
│   │   ├── api/
│   │   │   ├── __init__.py         # Router aggregation
│   │   │   ├── admin.py            # Admin endpoints (existing)
│   │   │   ├── ai.py               # AI config endpoints (existing)
│   │   │   ├── eggs.py             # Egg CRUD (existing)
│   │   │   ├── panels.py           # Panel management (existing)
│   │   │   ├── projects.py         # NEW: ModMorphic project CRUD
│   │   │   └── users.py            # User endpoints (existing)
│   │   ├── core/
│   │   │   ├── __init__.py         # Settings, deps (existing)
│   │   │   ├── config.py           # Unified config (extend)
│   │   │   ├── db.py               # Database (existing)
│   │   │   ├── security.py         # Zitadel auth (existing)
│   │   │   └── constants.py        # NEW: Loaders, templates
│   │   ├── models/
│   │   │   ├── __init__.py         # Model exports
│   │   │   ├── egg.py              # EggConfig (existing)
│   │   │   ├── panel.py            # Panel (existing)
│   │   │   ├── mod.py              # NEW: ModReference, ModVersion
│   │   │   └── project.py          # NEW: Project, ProjectMods, ProjectQuests
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── modpack_service.py  # CurseForge/Modrinth fetch (existing)
│   │   │   ├── modrinth_service.py # NEW: Mod search/caching (from morphic)
│   │   │   ├── ai_service.py       # Unified AI service (merge)
│   │   │   ├── quest_service.py    # NEW: SNBT quest generation (from morphic)
│   │   │   └── export_service.py   # NEW: .mrpack export (from morphic)
│   │   └── worker.py               # NEW: arq background worker (optional)
│   ├── tests/
│   ├── pyproject.toml              # Updated dependencies
│   └── Dockerfile                  # Updated for uv
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Routes (extend)
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx   # Existing
│   │   │   ├── EggsPage.tsx        # Existing
│   │   │   ├── ProjectsPage.tsx    # NEW: ModMorphic projects
│   │   │   ├── ProjectDetailPage.tsx # NEW
│   │   │   └── CreateWizardPage.tsx # NEW
│   │   └── lib/
│   │       ├── api.ts              # API client (extend)
│   │       └── auth.tsx            # Auth context (existing)
│   └── package.json                # Updated
├── podman-compose.yml              # Unified containers
└── TECH_SPEC.md                    # This file
```

---

## 3. Stack Decisions

### Runtime & Tooling

| Layer | Technology | Notes |
|-------|------------|-------|
| Python | 3.12+ | Target version (upgrade from 3.11) |
| Package Manager | uv | Already migrated |
| Web Framework | FastAPI | Existing |
| ORM | SQLModel | Existing |
| Database | SQLite (dev) / PostgreSQL (prod) | Existing pattern |
| Auth | Zitadel OIDC | Tier 1 Native (existing) |
| Async HTTP | httpx | Existing |
| Node.js | 20+ LTS | Target version |
| Package Manager | pnpm | Already migrated |
| Frontend | React 18 + Vite 6 | Existing |
| Container | Podman Compose | Already migrated |

### New Dependencies (from ModMorphic)

```toml
# Add to backend/pyproject.toml
dependencies = [
    # ... existing ...
    "openai>=1.0.0",      # AI integration (OpenRouter)
    "arq>=0.26.0",        # Background worker (optional)
    "redis>=5.0.0",       # Worker backend (optional)
]
```

### Optional Features
- **Redis + arq**: Background worker for long-running AI modpack generation
- If Redis unavailable, run synchronously with timeout warnings

---

## 4. Authentication Strategy

### Selected: Tier 1 — Zitadel Native

**Justification:**
- Hatchery already implements stateless JWT validation via Zitadel JWKS
- ModMorphic has NO auth (Tier 0)
- Merging requires deprecating ModMorphic's "no auth" approach

**Implementation:**
1. All existing Hatchery endpoints remain protected
2. New ModMorphic endpoints (`/api/projects`) inherit auth protection
3. `owner_id` field added to `Project` model (from JWT `sub` claim)
4. Public projects controlled via `visibility` field (same pattern as eggs)

**Changes Required:**
- `morphic/backend/app/routers/projects.py`: Add `CurrentUser` dependency
- `morphic/backend/app/models/project.py`: Add `owner_id: str` field

---

## 5. Interface Definitions

### New API Endpoints

```python
# POST /api/projects - Create AI-generated modpack project
class ProjectCreate(BaseModel):
    name: str
    mc_version: str = "1.20.1"
    loader: str = "fabric"  # forge, fabric, neoforge, quilt
    user_prompt: str  # Natural language description
    templates: list[str] = ["tech"]

class ProjectOut(BaseModel):
    id: UUID
    name: str
    mc_version: str
    loader: str
    user_prompt: str
    templates: list[str]
    status: ProjectStatus  # queued, processing, ready, failed
    ai_reasoning: str
    created_at: datetime
    updated_at: datetime

# GET /api/projects - List user's projects
# GET /api/projects/{id} - Get project details
# GET /api/projects/{id}/mods - List mods in project
# GET /api/projects/{id}/quests - Get generated quests
# GET /api/projects/{id}/export - Download .mrpack
```

### Key Service Signatures

```python
# services/modrinth_service.py
async def search_mods(
    client: httpx.AsyncClient,
    query: str,
    game_version: str | None = None,
    loader: str | None = None,
    limit: int = 20,
) -> list[ModSearchResult]: ...

async def fetch_and_cache_mod(
    session: AsyncSession,
    client: httpx.AsyncClient,
    slug_or_id: str,
    mc_version: str,
    loader: str,
) -> tuple[ModReference, ModVersion | None]: ...

# services/ai_service.py (unified)
class AIService:
    async def select_mods(
        candidate_descriptions: list[str],
        user_prompt: str,
        mc_version: str,
        loader: str,
        template_names: list[str],
        target_count: int = 50,
    ) -> dict: ...  # {"selected_slugs": [...], "reasoning": str}

    async def generate_quest_outline(
        mod_descriptions: list[str],
        user_prompt: str,
        template_names: list[str],
        chapter_count: int = 3,
        quests_per_chapter: int = 5,
    ) -> dict: ...

    # Existing methods preserved
    async def clean_name(raw_name: str) -> str | None: ...
    async def enhance_description(...) -> str | None: ...

# services/quest_service.py
def generate_quest_files(outline: dict) -> dict[str, str]: ...

# services/export_service.py
async def generate_mrpack(session: AsyncSession, project_id: UUID) -> bytes: ...
```

---

## 6. Database Changes

### New Tables

```sql
-- mod_references: Cache of Modrinth project metadata
CREATE TABLE mod_references (
    id UUID PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) DEFAULT 'modrinth',
    title VARCHAR(255),
    description TEXT,
    icon_url VARCHAR(512),
    categories TEXT,  -- comma-separated
    downloads INTEGER DEFAULT 0,
    modrinth_project_id VARCHAR(64),
    last_updated TIMESTAMP
);

-- mod_versions: Specific version + loader combinations
CREATE TABLE mod_versions (
    id UUID PRIMARY KEY,
    mod_reference_id UUID REFERENCES mod_references(id),
    version_number VARCHAR(64),
    mc_version VARCHAR(32),
    loader VARCHAR(32),
    filename VARCHAR(255),
    download_url VARCHAR(1024),
    file_size INTEGER,
    sha1 VARCHAR(64),
    sha512 VARCHAR(128),
    modrinth_version_id VARCHAR(64),
    dependencies_json TEXT,  -- JSON array
    fetched_at TIMESTAMP
);

-- projects: AI-generated modpack projects
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,  -- Zitadel subject
    name VARCHAR(255) NOT NULL,
    mc_version VARCHAR(32) NOT NULL,
    loader VARCHAR(32) DEFAULT 'fabric',
    user_prompt TEXT,
    templates TEXT,  -- JSON array
    status VARCHAR(32) DEFAULT 'queued',
    ai_reasoning TEXT,
    error_message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- project_mods: Link table
CREATE TABLE project_mods (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    mod_version_id UUID REFERENCES mod_versions(id),
    is_dependency BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP
);

-- project_quests: Generated SNBT quest data
CREATE TABLE project_quests (
    id UUID PRIMARY KEY,
    project_id UUID UNIQUE REFERENCES projects(id),
    story_title VARCHAR(255),
    story_description TEXT,
    quest_files_json TEXT,  -- JSON object
    total_quests INTEGER DEFAULT 0,
    generated_at TIMESTAMP
);
```

### Migration Path
1. SQLModel models auto-create tables on `init_db()` (SQLite)
2. For PostgreSQL: Use Alembic migrations (add later if needed)
3. Existing `egg_configs` table unchanged

---

## 7. Configuration

### Updated `backend/pyproject.toml`

```toml
[project]
name = "hatchery-backend"
version = "0.2.0"
description = "Hatchery - Modpack-to-Server Automation Platform with AI-powered Creation"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlmodel>=0.0.22",
    "sqlalchemy>=2.0.25",
    "aiosqlite>=0.19.0",
    "asyncpg>=0.30.0",
    "PyJWT>=2.8.0",
    "python-multipart>=0.0.9",
    "httpx>=0.27.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
    "email-validator>=2.0.0",
    "openai>=1.0.0",      # NEW: OpenRouter AI
    "arq>=0.26.0",        # NEW: Background worker (optional)
    "redis>=5.0.0",       # NEW: Worker backend (optional)
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "respx>=0.21.0",
    "ruff>=0.4.0",
    "mypy>=1.8.0",
]

[tool.ruff]
target-version = "py312"
line-length = 100
```

### Updated `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    # ... existing ...
    
    # OpenRouter AI (NEW from morphic)
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.5-flash"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    ai_max_tokens: int = 16384
    ai_temperature: float = 0.7
    
    # Redis (NEW - optional for background worker)
    redis_url: str = "redis://localhost:6379"
    
    # Modrinth
    modrinth_user_agent: str = "Hatchery/0.2.0 (https://github.com/hatchery)"
```

---

## 8. Code Smells & Technical Debt to Address

### High Priority

| Issue | Location | Action |
|-------|----------|--------|
| PostgreSQL-specific JSON column | `morphic/backend/app/models/project.py:10` | Change to `sqlalchemy.JSON` (works in SQLite too) |
| No auth on project endpoints | `morphic/backend/app/routers/projects.py` | Add `CurrentUser` dependency |
| Duplicate AI services | Both `ai_service.py` files | Merge into unified service |
| Duplicate Modrinth logic | `modpack_service.py` + `modrinth_service.py` | Consolidate, keep both patterns |
| Hardcoded database URL | `morphic/backend/app/config.py:14` | Delete, use Hatchery's config |
| `datetime.utcnow()` deprecated | morphic models | Use `datetime.now(UTC)` |

### Medium Priority

| Issue | Location | Action |
|-------|----------|--------|
| No `owner_id` on Project | morphic `Project` model | Add field for ownership |
| Empty worker directory | `morphic/worker/` | Delete (worker is in backend) |
| Frontend has no auth | morphic `frontend/` | Use Hatchery's React Router pattern |

### Low Priority

| Issue | Location | Action |
|-------|----------|--------|
| Line length 88 vs 100 | morphic `pyproject.toml` | Standardize to 100 |
| Different ruff rules | morphic `pyproject.toml` | Use Hatchery's rules |

---

## 9. Files to DELETE (After Merge)

```
morphic/                          # Entire directory after successful merge

# Specific files that are superseded:
morphic/backend/app/config.py     # Use Hatchery's config.py
morphic/backend/app/database.py   # Use Hatchery's db.py
morphic/backend/app/models/mod.py # Move to Hatchery, update imports
morphic/backend/app/models/project.py  # Move to Hatchery, update imports
morphic/frontend/                  # Entire frontend (use Hatchery's)
morphic/worker/                    # Empty directory
morphic/docker-compose.yml         # Use root podman-compose.yml
```

---

## 10. Success Criteria

1. **All Hatchery tests pass**: `uv run pytest` in `backend/`
2. **All existing endpoints work**: Eggs, panels, users, admin
3. **New endpoints functional**: Projects CRUD, export, quests
4. **Auth protects new endpoints**: `POST /api/projects` requires valid JWT
5. **SQLite works**: Local dev without PostgreSQL
6. **PostgreSQL works**: Production deployment
7. **Background worker optional**: Graceful degradation without Redis
8. **Frontend builds**: `pnpm build` succeeds
9. **Container deploys**: `podman-compose up` works