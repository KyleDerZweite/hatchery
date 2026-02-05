# MIGRATION_PLAN.md — Step-by-Step Action Plan for Hatchery + ModMorphic Merge

## Overview

This plan merges ModMorphic (`morphic/`) into Hatchery in **4 phases** with **validation checkpoints**.

**Estimated Time:** 4-6 hours for complete merge
**Risk Level:** Medium (database schema additions, service merging)

---

## Phase 1: Setup & Dependencies

### 1.1 Update Python Dependencies
```bash
cd backend

# Add new dependencies to pyproject.toml manually, then:
uv sync
```

**Changes to `pyproject.toml`:**
- Add `openai>=1.0.0` (OpenRouter AI)
- Add `arq>=0.26.0` (optional background worker)
- Add `redis>=5.0.0` (optional worker backend)
- Update `requires-python` to `>=3.12`
- Update `target-version` to `"py312"`

### 1.2 Update Configuration
**File:** `backend/app/core/config.py`

Add new settings:
```python
# OpenRouter AI
openrouter_api_key: str = ""
openrouter_model: str = "google/gemini-2.5-flash"
openrouter_base_url: str = "https://openrouter.ai/api/v1"
ai_max_tokens: int = 16384
ai_temperature: float = 0.7

# Redis (optional for background worker)
redis_url: str = "redis://localhost:6379"

# Modrinth User Agent
modrinth_user_agent: str = "Hatchery/0.2.0 (https://github.com/hatchery)"
```

### 1.3 Create Constants Module
**File:** `backend/app/core/constants.py` (NEW)

```python
LOADERS = ["forge", "fabric", "neoforge", "quilt"]
TEMPLATES = ["tech", "magic", "adventure", "vanilla+", "optimization", "kitchen-sink"]
```

### 1.4 Validation Checkpoint
```bash
cd backend
uv sync
uv run python -c "from app.core.config import settings; print(settings)"
```

✅ **PASS:** Dependencies install, config loads without error

---

## Phase 2: Model Migration

### 2.1 Create `mod.py` Model
**File:** `backend/app/models/mod.py` (NEW)

Copy from `morphic/backend/app/models/mod.py` with changes:
1. Change `from sqlalchemy.dialects.postgresql import JSON` to `from sqlalchemy import JSON`
2. Add `from datetime import UTC` import
3. Change `datetime.utcnow()` → `datetime.now(UTC)`

### 2.2 Create `project.py` Model
**File:** `backend/app/models/project.py` (NEW)

Copy from `morphic/backend/app/models/project.py` with changes:
1. Remove PostgreSQL-specific JSON import
2. Use `from sqlalchemy import JSON` instead
3. Add `owner_id: str = Field(index=True)` field (for Zitadel subject)
4. Change `datetime.utcnow()` → `datetime.now(UTC)`

### 2.3 Update `models/__init__.py`
**File:** `backend/app/models/__init__.py`

Add exports:
```python
from app.models.mod import ModReference, ModVersion
from app.models.project import Project, ProjectMods, ProjectQuests, ProjectStatus

__all__ = [
    # ... existing ...
    "ModReference",
    "ModVersion", 
    "Project",
    "ProjectMods",
    "ProjectQuests",
    "ProjectStatus",
]
```

### 2.4 Validation Checkpoint
```bash
cd backend
uv run python -c "
from app.models.mod import ModReference, ModVersion
from app.models.project import Project, ProjectMods, ProjectQuests, ProjectStatus
print('Models imported successfully')
"
```

✅ **PASS:** All models import without error

---

## Phase 3: Service Migration

### 3.1 Create `modrinth_service.py`
**File:** `backend/app/services/modrinth_service.py` (NEW)

Copy from `morphic/backend/app/services/modrinth_service.py` with changes:
1. Update import: `from app.core.config import settings`
2. Update import: `from app.models.mod import ModReference, ModVersion`

### 3.2 Create `quest_service.py`
**File:** `backend/app/services/quest_service.py` (NEW)

Copy from `morphic/backend/app/services/quest_service.py` (no changes needed).

### 3.3 Create `export_service.py`
**File:** `backend/app/services/export_service.py` (NEW)

Copy from `morphic/backend/app/services/export_service.py` with changes:
1. Update imports to use `app.models.mod`, `app.models.project`
2. Change `from sqlalchemy import JSON` if needed

### 3.4 Merge AI Services
**File:** `backend/app/services/ai_service.py` (MODIFY existing)

Merge functions from `morphic/backend/app/services/ai_service.py` into existing file:

**Add to existing class:**
```python
# System prompts (from morphic)
MOD_SELECTOR_SYSTEM_PROMPT = """..."""  # Copy from morphic
QUEST_SYSTEM_PROMPT = """..."""  # Copy from morphic

async def select_mods(
    candidate_descriptions: list[str],
    user_prompt: str,
    mc_version: str,
    loader: str,
    template_names: list[str] | None = None,
    target_count: int = 50,
) -> dict: ...

async def generate_quest_outline(
    mod_descriptions: list[str],
    user_prompt: str,
    template_names: list[str] | None = None,
    chapter_count: int = 3,
    quests_per_chapter: int = 5,
) -> dict: ...
```

**Key changes:**
- Use `openai.AsyncOpenAI` client (already in dependencies)
- Keep existing convenience methods (`clean_name`, `enhance_description`, etc.)
- Add new high-level methods (`select_mods`, `generate_quest_outline`)

### 3.5 Update `services/__init__.py`
**File:** `backend/app/services/__init__.py`

Add exports:
```python
from app.services.modrinth_service import (
    search_mods,
    get_project,
    get_versions,
    fetch_and_cache_mod,
    new_http_client,
)
from app.services.quest_service import generate_quest_files, count_quests
from app.services.export_service import generate_mrpack
```

### 3.6 Validation Checkpoint
```bash
cd backend
uv run python -c "
from app.services.modrinth_service import search_mods, new_http_client
from app.services.quest_service import generate_quest_files
from app.services.export_service import generate_mrpack
from app.services.ai_service import ai_service
print('Services imported successfully')
"
```

✅ **PASS:** All services import without error

---

## Phase 4: API Router Migration

### 4.1 Create `projects.py` Router
**File:** `backend/app/api/projects.py` (NEW)

Copy from `morphic/backend/app/routers/projects.py` with changes:

1. **Add authentication:**
```python
from app.core import CurrentUser, SessionDep

@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(
    body: ProjectCreate,
    current_user: CurrentUser,  # NEW
    session: SessionDep,
) -> Project:
    project = Project(
        name=body.name,
        owner_id=current_user.id,  # NEW
        ...
    )
```

2. **Update all endpoints with auth:**
- `list_projects`: Filter by `owner_id == current_user.id` or `visibility == public`
- `get_project`: Check ownership or public
- `get_project_mods`: Check ownership
- `export_project`: Check ownership

3. **Update imports:**
```python
from app.core.constants import LOADERS, TEMPLATES
from app.core.config import settings
from app.models.mod import ModReference, ModVersion
from app.models.project import Project, ProjectMods, ProjectQuests, ProjectStatus
from app.services import export_service
```

### 4.2 Update `api/__init__.py`
**File:** `backend/app/api/__init__.py`

Add router:
```python
from app.api.projects import router as projects_router

api_router.include_router(projects_router)  # Add after eggs_router
```

### 4.3 Validation Checkpoint
```bash
cd backend
uv run uvicorn app.main:app --reload &
# In another terminal:
curl http://localhost:8000/health
curl http://localhost:8000/docs  # Check Swagger includes /api/projects
```

✅ **PASS:** Server starts, `/docs` shows new endpoints, auth required on protected endpoints

---

## Phase 5: Background Worker (Optional)

### 5.1 Create `worker.py`
**File:** `backend/app/worker.py` (NEW)

Copy from `morphic/backend/app/worker.py` with changes:
1. Update imports
2. Add `owner_id` to project creation logic

**Note:** Worker requires Redis. Make it gracefully degrade:
```python
# In projects.py router
try:
    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await redis.enqueue_job("create_modpack_task", ...)
except Exception:
    # Fallback: Run synchronously with timeout warning
    await create_modpack_task_sync(...)
```

### 5.2 Add to `pyproject.toml`
```toml
[project.optional-dependencies]
worker = ["arq>=0.26.0", "redis>=5.0.0"]
```

---

## Phase 6: Frontend Integration

### 6.1 Create New Pages
**Files to create in `frontend/src/pages/`:**

- `ProjectsPage.tsx` - List projects
- `ProjectDetailPage.tsx` - View project details, mods, quests
- `CreateProjectPage.tsx` - Wizard for new project

Copy components from `morphic/frontend/src/views/` as starting point, then:
1. Add auth checks (use `useAuth` hook)
2. Use existing `api.ts` client
3. Match existing Hatchery styling

### 6.2 Update Routes
**File:** `frontend/src/App.tsx`

Add routes:
```tsx
<Route path="projects" element={<ProjectsPage />} />
<Route path="projects/:id" element={<ProjectDetailPage />} />
<Route path="projects/create" element={<CreateProjectPage />} />
```

### 6.3 Extend API Client
**File:** `frontend/src/lib/api.ts`

Add:
```typescript
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: ProjectCreate) => api.post('/projects', data),
  getMods: (id: string) => api.get(`/projects/${id}/mods`),
  getQuests: (id: string) => api.get(`/projects/${id}/quests`),
  export: (id: string) => api.get(`/projects/${id}/export`, { responseType: 'blob' }),
};
```

### 6.4 Validation Checkpoint
```bash
cd frontend
pnpm install
pnpm dev
# Open browser, navigate to /projects (requires auth)
```

✅ **PASS:** Frontend builds, routes work, API calls succeed with auth

---

## Phase 7: Container Updates

### 7.1 Update `podman-compose.yml`
**File:** `podman-compose.yml` (root)

Add Redis service (optional):
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### 7.2 Validation Checkpoint
```bash
podman-compose up -d
podman-compose logs -f backend
curl http://localhost:8000/health
```

✅ **PASS:** All containers start, health check passes

---

## Phase 8: Cleanup

### 8.1 Delete Merged Code
```bash
rm -rf morphic/
```

### 8.2 Run Full Test Suite
```bash
cd backend
uv run pytest

cd ../frontend
pnpm lint
pnpm typecheck
pnpm build
```

### 8.3 Update Documentation
- Update `AGENTS.md` with new structure
- Update `README.md` with new features
- Delete or update any references to "ModMorphic"

---

## Final Validation Checklist

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Backend tests pass | `uv run pytest` | All pass |
| Backend typecheck | `uv run mypy app` | No errors |
| Backend lint | `uv run ruff check .` | No errors |
| Frontend builds | `pnpm build` | Success |
| Frontend lint | `pnpm lint` | No errors |
| Frontend typecheck | `pnpm typecheck` | No errors |
| Containers start | `podman-compose up -d` | All healthy |
| Health endpoint | `curl localhost:8000/health` | `{"status": "healthy"}` |
| Docs accessible | `curl localhost:8000/docs` | HTML response |
| Auth required | `curl localhost:8000/api/projects` | 401 Unauthorized |
| Project creation | POST with valid JWT | 201 Created |

---

## Rollback Plan

If merge fails at any phase:

1. **Phase 1-2:** Simply delete new files, no database changes yet
2. **Phase 3-4:** Delete new services/routers, restart server
3. **Phase 5-6:** `git checkout -- frontend/` to restore
4. **Full rollback:** `git checkout -- .` and restart containers

**Database:** No migrations to rollback (SQLModel auto-creates tables on startup)

---

## Estimated Timeline

| Phase | Time | Dependencies |
|-------|------|--------------|
| Phase 1: Setup | 30 min | None |
| Phase 2: Models | 30 min | Phase 1 |
| Phase 3: Services | 1 hour | Phase 2 |
| Phase 4: API Routers | 1 hour | Phase 3 |
| Phase 5: Worker | 30 min | Phase 4 (optional) |
| Phase 6: Frontend | 1.5 hours | Phase 4 |
| Phase 7: Containers | 15 min | Phase 6 |
| Phase 8: Cleanup | 15 min | All |

**Total:** 5-6 hours

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database conflicts | SQLModel handles auto-creation; no Alembic needed for SQLite |
| Service merge issues | Keep both AI services initially, merge incrementally |
| Auth breaking | Test auth on each endpoint before proceeding |
| Frontend breaking | Keep morphic frontend as reference until new pages work |
| Redis unavailable | Worker is optional; sync fallback implemented |