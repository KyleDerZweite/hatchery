# Project Audit — 2026-07-06

## MVP acceptance audit — 2026-07-11

| Requirement | Current evidence |
| --- | --- |
| Stable runtime | Both production images build; the backend migrates and starts against PostgreSQL 16. |
| OIDC authentication | Zitadel Authorization Code + PKCE frontend flow and JWT/JWKS backend validation; valid, expired, missing-expiry, wrong-audience, and key-rotation tests pass. |
| Modrinth and CurseForge import | Route-level tests cover both providers, version selection, canonical URL validation, upstream failures, and incomplete packs. |
| Runnable egg generation | PTDL v2 output includes loader-aware installation and startup; Bash syntax is checked for Fabric, Forge, NeoForge, and Quilt. |
| Egg management | Create, list, read, update, regenerate, export, delete authorization, and public/private visibility are implemented and tested. |
| Panel management | Create, list, read, update, key rotation, validation, and delete APIs are implemented; the MVP UI covers add/list/test/delete. |
| Panel compatibility test | Real application API calls distinguish success, authentication rejection, redirects, incompatibility, and unreachable panels without forwarding credentials across redirects. |
| Persistence and migrations | PostgreSQL is the production path; Alembic round trips on SQLite and migrates from a clean PostgreSQL container at startup. |
| Secrets at rest | Panel keys use Fernet encryption; tests inspect database ciphertext, decrypt it, rotate it, and verify API responses never expose it. |
| Outbound controls | Provider/panel requests have timeouts, strict URL handling, redirect controls, and per-user throttling for expensive operations. |
| Build health and tests | Ruff, formatting, mypy, 29 backend tests, ESLint, TypeScript, and the Vite production build pass. |
| Self-hosted package | Podman Compose provides backend, Nginx frontend, PostgreSQL, health checks, migrations, required secrets, and an optional Pangolin profile. |
| Operator documentation | `README.md`, `.env.example`, `DEVELOPMENT.md`, and `OPERATIONS.md` cover setup, Zitadel, PostgreSQL, backup/restore, and upgrades. |

The built-image smoke test created a disposable PostgreSQL 16 instance, ran the
backend container's actual migration/start command, received 200 from `/health`,
received 401 from the protected egg API, served the SPA from the frontend image,
and received the same 401 through Nginx's `/api` proxy.

### Follow-up repairs

Generated installation scripts previously unpacked only `overrides`, omitting
the mods referenced by Modrinth and CurseForge pack manifests. They now resolve
server-compatible Modrinth index entries and CurseForge manifest file
references, apply server overrides, pin loader versions from pack metadata,
reject unsafe indexed paths, and support modern Forge/NeoForge `run.sh`
startup. Generated scripts are syntax-tested for all four supported loaders,
and a fixture executes the Modrinth resolver to prove required downloads,
server exclusions, and both override layers. A second fixture executes
CurseForge manifest resolution and file installation. URL host matching,
requested-version handling, pagination bounds, regeneration metadata,
permission-aware UI controls, and operator documentation were also hardened.

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

## Original test coverage added

The suite grew from 4 to 15 tests:

- JWT validation path with a mocked JWKS endpoint (valid token, expired,
  wrong audience, missing `exp`, key-rotation refetch) — previously zero
  coverage because every test overrode `get_current_user`.
- NeoForge loader detection, unknown-slug 404, non-http URL rejection.
- Panel test scheme rejection and redirect refusal.
- Regression guard asserting all datetime columns are timezone-aware.

## Original verification performed

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

## Migration note for existing deployments

Fresh PostgreSQL deployments are correct out of the box (and none can predate
this fix — the path never worked). Long-lived **SQLite** dev databases created
before this change keep naive-timestamp columns; recreate them or run the
migration round-trip if that matters.
