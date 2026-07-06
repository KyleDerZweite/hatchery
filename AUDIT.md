# Project Audit — 2026-07-06

Full end-to-end audit and repair of the Hatchery MVP. Every finding below was
verified against the code before fixing, and every fix was verified afterwards
(including against a real PostgreSQL 16 container). Nothing in this document is
speculative.

## Headline

The production deployment path (compose + PostgreSQL) had **never worked**:
the backend container crash-looped on startup, and even past that point every
database write would have failed. Both blockers were masked because the test
suite runs on SQLite and overrides authentication. Both are fixed and the
compose path is now verified end-to-end.

## Blockers (fixed)

### 1. Migrations could not run at all

Three stacked failures:

1. `backend/alembic.ini` had no `prepend_sys_path`, so `alembic upgrade head`
   failed with `ModuleNotFoundError: No module named 'app'` — from a plain
   shell and inside the container alike.
2. `backend/alembic/env.py` built a **synchronous** engine from the raw
   `postgresql://` URL. SQLAlchemy resolves that scheme to psycopg2, which is
   not a dependency; only `asyncpg` is installed.
3. The container CMD is `alembic upgrade head && uvicorn ...`, so the failed
   migration prevented the API from ever starting on PostgreSQL.

**Fix:** added `prepend_sys_path = .` and converted `env.py` to Alembic's
async template so migrations run through the same asyncpg driver as the app.

### 2. Every write crashed on PostgreSQL

Models set timezone-aware `datetime.now(UTC)` values, but all datetime columns
were naive `TIMESTAMP`. asyncpg raises `TypeError` when encoding an aware
datetime into a naive column, so every egg/panel INSERT/UPDATE returned a 500.
SQLite (used by the tests) tolerates this, which is why the suite passed.

**Fix:** all datetime columns are now `TIMESTAMP WITH TIME ZONE` in both the
models and the initial migration. Amending the initial migration was safe
because it had never successfully run on PostgreSQL. While in there, the
migration's `source`/`visibility` columns were aligned to the models' native
enums and `json_data` nullability was aligned, so
`alembic revision --autogenerate` now produces an empty diff.

## High severity (fixed)

- **`javascript:` URL execution.** Modpack URLs are validated with
  `re.search`, so `javascript:alert(1)//modrinth.com/modpack/x` passed
  validation and was stored; clicking "Source" on such an egg executed the
  payload via `window.open` — exploitable across users through public eggs.
  Fixed in the backend (http/https scheme required in
  `ModpackService.fetch_modpack_info`) and the frontend (all external links go
  through `openExternalUrl` in `src/lib/utils.ts`, which allows only http/https
  and adds `noopener,noreferrer`).
- **Panel API key leak via redirects (SSRF).** The panel connection test sent
  the decrypted API key as a Bearer header with `follow_redirects=True`; a
  malicious panel URL could redirect the credentialed request to an
  attacker-controlled host. Redirects are no longer followed (a redirect now
  returns a clear failure message) and non-http(s) panel URLs are rejected.
- **Container builds clobbered their own dependencies.** Neither image had a
  `.dockerignore`, so `COPY . .` overwrote the image's freshly installed
  `node_modules`/`.venv` with whatever the host had. Both files added.

## Medium severity (fixed)

- NeoForge modpacks imported from Modrinth were generated as **Forge** eggs
  (`"forge" in "neoforge"` matched first), producing a broken server. The
  check order now matches the CurseForge path.
- Unknown modpack slugs and upstream API failures silently produced junk
  "Unknown Modpack" eggs; they now return 404/502.
- JWKS handling: an unknown token `kid` now triggers one forced JWKS refetch
  (previously a Zitadel key rotation rejected valid logins for up to an hour),
  and `exp` is a required claim.
- Startup now logs warnings when running non-debug with placeholder secrets or
  an empty `ZITADEL_PROJECT_ID` (auth fails closed without it, but previously
  with an opaque "Invalid token" error).
- The module-global modpack HTTP client is closed on app shutdown.
- `ProtectedRoute` called `signinRedirect()` during render (double-fires under
  StrictMode); now a ref-guarded effect.
- Regenerating an egg did not invalidate the eggs list cache; stale names/
  versions showed for up to 5 minutes.
- nginx `add_header` inheritance dropped the security headers on static
  assets; they are repeated in the static-asset location block.
- Frontend Dockerfile defaulted `VITE_API_URL` to `http://localhost:8000`,
  baking every user's own machine into bare builds; the default is now empty
  (relative `/api`, proxied by nginx — the compose model).
- Toolchain drift: the image built on Node 20/pnpm 9 while CI used Node 22/
  pnpm 10. Both now use Node 22 and the `packageManager` pin (pnpm 10.29.2).
- `pnpm typecheck` pointed at `tsconfig.node.json`; it now runs `tsc -b`, the
  same project the build type-checks.
- Config/docs drift: `.env.example` now documents `CORS_ORIGINS`, the pairing
  of `ZITADEL_DOMAIN` (backend) with `VITE_ZITADEL_AUTHORITY` (frontend), and
  secret generation. The hardcoded personal default domain in
  `app/core/config.py` was replaced with `auth.example.com`.

## Test coverage added

The suite grew from 4 to 15 tests:

- JWT validation path with a mocked JWKS endpoint (valid token, expired,
  wrong audience, missing `exp`, key-rotation refetch) — previously zero
  coverage because every test overrode `get_current_user`.
- NeoForge loader detection, unknown-slug 404, non-http URL rejection.
- Panel test scheme rejection and redirect refusal.
- Regression guard asserting all datetime columns are timezone-aware.

## Verification performed

- `pytest` (15 passed), `ruff check`, `ruff format --check`, `mypy` — clean.
- `eslint`, `tsc -b`, `vite build` — clean.
- Alembic upgrade → downgrade → upgrade round-trip on SQLite.
- Against a disposable PostgreSQL 16 container: `alembic upgrade head`,
  autogenerate drift check (empty), and a write smoke test (egg + panel
  insert/update/read with aware datetimes) through the app's asyncpg engine.
- Both container images built; the backend image ran against PostgreSQL
  exactly as compose does — migration succeeded, `/health` returned 200,
  unauthenticated `/api/eggs` returned 401.

## Known issues intentionally left open

- **Silent token renewal** falls back to loading the SPA in a hidden iframe
  (no `silent_redirect_uri`, no `offline_access` scope). It functions, but a
  proper fix needs an IdP decision: register a dedicated silent-renew URI in
  Zitadel, or enable refresh tokens and add `offline_access`. Expired sessions
  currently land on the login page via the 401 handler, which is acceptable.
- **No role enforcement.** `require_member`/`CurrentAdmin` exist but no route
  uses them; any authenticated Zitadel user can use the app (resources are
  still owner-scoped). This matches the self-hosted MVP design. Gate the
  routers with `require_member` if Zitadel role grants should control access.
- Cosmetics: undefined `card-vine` CSS class (9 uses, silent no-op), the
  create-egg form keeps the previous visibility/Java selection, `limit` query
  params are unbounded, and the JS bundle exceeds 500 kB (no code splitting).

## Migration note for existing deployments

Fresh PostgreSQL deployments are correct out of the box (and none can predate
this fix — the path never worked). Long-lived **SQLite** dev databases created
before this change keep naive-timestamp columns; recreate them or run the
migration round-trip if that matters.
