# MVP Plan: Hatchery

## MVP Objective

Deliver a self-hosted MVP that lets an authenticated Minecraft server operator sign in, create an editable egg from a modpack URL, verify panel compatibility, and export the egg artifact for use on self-managed infrastructure.

## Scope Definition

### In-Scope

These items are the minimum required to deliver the core value proposition defined in `PRODUCT_STRATEGY.md`.

1. Stable application startup and shippable runtime.
2. OIDC-based sign-in and authenticated access to the product.
3. Modpack URL import for Modrinth and CurseForge.
4. Egg generation from imported modpack metadata.
5. Egg listing, viewing, editing, regeneration, and JSON export.
6. Panel record management.
7. Real panel connectivity validation.
8. Production-safe persistence and schema migration support.
9. Encryption at rest for stored panel API keys.
10. Production build health for backend and frontend.
11. Core automated test coverage for startup, auth-gated flows, egg workflows, and panel workflows.
12. Self-hosted OSS deployment package using containerized backend, frontend, and PostgreSQL.
13. Minimal operator documentation for installation, configuration, backup/restore, and release upgrades.

### Out-of-Scope

These items are explicitly deferred because they belong to later phases in `PRODUCT_STRATEGY.md` or are not required for the fastest MVP path.

1. AI project generation and the `/projects` product surface.
2. Quest generation and `.mrpack` workflows.
3. Redis- and `arq`-based background workers for project processing.
4. One-click egg upload or publishing into panels.
5. Full deployment orchestration, retries, deployment logs, or deployment status tracking.
6. Team/workspace support.
7. Enterprise RBAC, service accounts, or advanced SSO patterns.
8. Managed control-plane / SaaS offering.
9. Usage reporting, commercial packaging tiers, or enterprise observability layers beyond MVP-grade logging and health checks.

## Core Features & User Flow

### Core Features

1. `Sign In`
   Authenticate with Zitadel and load the main application successfully.

2. `Create Egg From URL`
   Accept a Modrinth or CurseForge modpack URL, parse metadata, infer server settings, and generate egg JSON.

3. `Manage Egg`
   Show generated eggs in a list; allow the user to open details, edit metadata, regenerate from source, and export JSON.

4. `Manage Panels`
   Let the user save panel records with encrypted API credentials and run a real compatibility/connection check.

5. `Operate Self-Hosted Deployment`
   Run the product via the supported self-hosted stack with PostgreSQL in production and documented environment configuration.

### Critical User Journey

1. The operator signs in.
2. The operator pastes a modpack URL into Hatchery.
3. Hatchery parses the source and generates an editable egg artifact.
4. The operator reviews and adjusts the egg if needed.
5. The operator adds or selects a panel record and runs a connection test to confirm compatibility.
6. The operator exports the final egg JSON for use on their panel.

This is the MVP because it exactly matches the Phase 1 exit criteria from `PRODUCT_STRATEGY.md`: sign in, create an egg from a URL, verify panel connectivity, edit the output, and export it without leaving the product.

## Technical Execution

### Priority 1: Make The Existing Product Runnable

1. Reconcile the AI subsystem enough to restore clean app startup.
   Fastest path: remove or isolate the broken AI router from the runtime path until its service contract is consistent.
2. Align backend CI and local runtime targets on Python 3.12+.
3. Separate mockup pages from the production typecheck/build path, or exclude them from production validation.
4. Fix frontend domain typing to match backend models, especially `owner_id`.

Reason:

The current codebase does not qualify as a releasable MVP while backend import fails and frontend typecheck is blocked by production-path mismatches.

### Priority 2: Harden The Core Egg Workflow

1. Validate and normalize Modrinth and CurseForge URL handling in `backend/app/services/modpack_service.py`.
2. Improve error responses for malformed URLs, unsupported sources, missing CurseForge credentials, and fetch failures.
3. Keep the egg workflow focused on the current proven UI and API surface:
   1. create
   2. list
   3. view
   4. edit
   5. regenerate
   6. export
4. Improve egg detail and edit UX only where it directly reduces operator friction.

Implementation targets:

1. `backend/app/api/eggs.py`
2. `backend/app/services/modpack_service.py`
3. `frontend/src/pages/EggsPage.tsx`
4. `frontend/src/pages/EggDetailPage.tsx`
5. `frontend/src/components/eggs/EditEggDialog.tsx`

### Priority 3: Turn Panel Records Into A Useful Validation Step

1. Add a panel integration service layer separate from HTTP routers.
2. Implement a real connectivity/compatibility test in place of the placeholder in `backend/app/api/panels.py`.
3. Validate endpoint reachability, authentication success, and minimum panel capability needed for later egg use.
4. Keep panel validation and egg generation as separate bounded workflows; do not add deployment yet.

Implementation targets:

1. Add a new backend service module for panel integration.
2. Refactor `backend/app/api/panels.py` to call that service layer.
3. Update `frontend/src/pages/PanelsPage.tsx` to surface real connection results clearly.

### Priority 4: Make Data And Secrets Production-Safe

1. Introduce Alembic or equivalent migrations.
2. Keep SQLite for local development only.
3. Make PostgreSQL the documented production database.
4. Encrypt stored panel API keys at rest.
5. Add outbound request controls and basic rate limiting for third-party API calls.

Implementation targets:

1. Database migration setup for existing models.
2. Config updates for environment-specific database settings.
3. Secret handling changes in the panel model/service layer.

### Priority 5: Add MVP-Level Test And Operational Coverage

1. Add backend tests for:
   1. app startup
   2. auth-protected route access
   3. egg creation from supported URLs
   4. egg export and regeneration
   5. panel CRUD
   6. panel connection test success/failure paths
2. Add frontend production validation so the non-mock app can build and typecheck cleanly.
3. Standardize structured logs across app startup, egg generation, and panel validation.
4. Add health checks for database reachability.

### Priority 6: Package The MVP For Self-Hosted Deployment

1. Ship the MVP as the self-hosted OSS distribution, not a managed control plane.
2. Use containerized backend and frontend.
3. Use PostgreSQL in the production deployment definition.
4. Run the frontend behind Nginx or another reverse proxy.
5. Terminate TLS at the reverse proxy or ingress layer.
6. Publish minimal docs for:
   1. environment setup
   2. Zitadel configuration
   3. PostgreSQL setup
   4. backup/restore
   5. upgrade/migration steps

## Timeline & Milestones

### Phase 1: Stabilization

Goal:

Restore a clean, releasable product baseline.

Milestones:

1. Backend starts cleanly.
2. Frontend production code typechecks and builds.
3. CI matches supported runtime versions.

Deliverables:

1. Broken AI runtime path removed or fixed.
2. Mockup code isolated from production validation.
3. Frontend/backend model alignment completed.

### Phase 2: Core Workflow Completion

Goal:

Make the egg workflow dependable end to end.

Milestones:

1. URL import is hardened for supported sources.
2. Egg generation, edit, regenerate, and export all work reliably.
3. Error handling is operator-friendly.

Deliverables:

1. Stable egg APIs.
2. Stable egg UI.
3. Regression tests for the egg workflow.

### Phase 3: Panel Validation And Production Readiness

Goal:

Make Hatchery useful as a panel-adjacent operator tool.

Milestones:

1. Real panel connectivity validation replaces the placeholder flow.
2. Panel credentials are encrypted at rest.
3. Database migrations are in place.

Deliverables:

1. Panel integration service layer.
2. Production database path documented around PostgreSQL.
3. MVP security baseline for stored secrets.

### Phase 4: MVP Deployment

Goal:

Ship the initial self-hosted OSS MVP.

Milestones:

1. Containerized deployment uses backend, frontend, and PostgreSQL.
2. Install and upgrade docs are published.
3. Backup/restore and environment configuration docs are published.
4. MVP acceptance passes:
   1. sign in
   2. create egg from URL
   3. verify panel connectivity
   4. edit egg
   5. export egg

Deliverables:

1. Initial self-hosted release package.
2. Operator documentation.
3. Release notes and migration guidance.

## MVP Acceptance Standard

The MVP is complete when Hatchery reliably operates as a self-hosted modpack-to-egg platform for technical server operators and satisfies this full user flow:

1. Sign in through Zitadel.
2. Create an egg from a supported modpack URL.
3. Review and edit the generated artifact.
4. Validate a connected panel successfully.
5. Export the egg for use on self-managed infrastructure.

Anything beyond that remains deferred until after this MVP is shipped.
