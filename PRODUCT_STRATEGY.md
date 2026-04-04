# Product Strategy: Hatchery

## Document Purpose

This document describes how to transition Hatchery from an engineering project into a viable product, based on the repository state as of April 4, 2026.

This strategy is grounded in implemented code first. Planning documents in the repo are only treated as product evidence when the codebase already reflects them.

## Product Transition

### Product Summary

Hatchery can become a workflow product for Minecraft server operators who need to turn modpack metadata into runnable server artifacts without manual setup work.

Today, the strongest implemented product asset is not "AI modpack creation." It is:

1. Authenticated, multi-user management of generated egg configurations.
2. Automatic parsing of Modrinth and CurseForge modpack URLs into server-oriented metadata.
3. Automatic generation of Pterodactyl-compatible egg JSON.
4. Basic storage and retrieval of panel connection records.

The codebase also contains an early second product line:

1. AI-assisted project generation backed by `/api/projects`.
2. Modrinth metadata caching.
3. `.mrpack` export generation.
4. Quest file generation.

That second line is promising, but it is not yet productized because it is only partially surfaced in the UI and parts of the AI stack are internally inconsistent.

### Current Product Translation From Code

Based on the backend and frontend, Hatchery currently translates into this product concept:

**Core product:** "Generate Minecraft server deployment artifacts from modpack URLs for Pterodactyl-style panels."

**Current product scope actually supported by the main UI:**

1. OIDC login with Zitadel.
2. Egg creation, listing, editing, regeneration, and JSON export.
3. Panel record creation, listing, deletion, and placeholder connection testing.
4. User/account visibility tied to JWT roles.

**Current platform capabilities that exist in backend code but are not yet first-class product features:**

1. AI-generated projects via `/api/projects`.
2. Modrinth mod caching and version persistence.
3. Quest generation and `.mrpack` export.
4. Admin settings visibility.

### Core Value Proposition

The clearest near-term value proposition is:

> Hatchery reduces the operational work required to take a published Minecraft modpack and make it deployable on self-managed game server infrastructure.

For the current implementation, that value is strongest for:

1. Self-hosters already using Pterodactyl or Pelican-like panels.
2. Small hosting teams managing repeated modpack setups.
3. Technical modpack communities that want reproducible server provisioning inputs.

### Why This Is Not Yet A Product

The repository is still a project because several product-critical gaps remain:

1. There is no implemented end-to-end deployment into a panel. Panels are stored, but no production deployment flow exists.
2. `backend/app/api/panels.py` explicitly ships a placeholder connection test instead of a real API integration.
3. The main frontend does not expose `/projects`; the project-generation flow is mostly backend-only plus mockup pages.
4. The AI router and AI service contract are mismatched. `backend/app/api/ai.py` imports `AIConfig`, `AIRequest`, `configure`, and `process`, but `backend/app/services/ai_service.py` does not provide them. Importing `app.main` currently fails for that reason.
5. Test coverage is minimal. The backend test suite only checks Python/import sanity and skips app startup.
6. Database schema is created with `SQLModel.metadata.create_all()` at startup, with no migration system.
7. Panel API keys are stored in the database with an explicit "encrypted or plain text for MVP" comment.
8. CI is not aligned with runtime targets: backend `pyproject.toml` requires Python 3.12+, while `.github/workflows/ci.yml` still uses Python 3.11.

### Product Definition Recommendation

Hatchery should be positioned in two steps, not one.

**Step 1: Productize the server-artifact workflow**

1. Import modpack URL.
2. Generate editable egg.
3. Validate panel compatibility.
4. Export or publish deployment artifact.

**Step 2: Expand into modpack authoring and orchestration**

1. AI-assisted project generation.
2. Dependency resolution and curated mod selection.
3. Quest generation.
4. `.mrpack` distribution.

This sequencing matches the codebase. The egg workflow is already visible and coherent. The AI project workflow is promising but not release-grade.

## Market Analysis

### Target Market

The current implementation points to a narrow but real market:

1. Advanced Minecraft hobbyists who self-host modded servers.
2. Community operators running multiple servers for friends, creators, or small networks.
3. Small game-hosting resellers or infrastructure teams already using Pterodactyl/Pelican.
4. Modpack creators who need a smoother path from pack publication to server deployment.

This is not yet aimed at general Minecraft players. The product assumes panel knowledge, API credentials, and comfort with self-hosted infrastructure.

### Primary User Persona

**Name:** Technical Server Operator

**Profile:**

1. Runs one or more Minecraft servers.
2. Uses Pterodactyl, Pelican, Docker, or VPS-based infrastructure.
3. Installs modpacks frequently enough that repeated setup work is painful.
4. Values speed, repeatability, and reduced configuration errors more than visual polish.

**Jobs to be done:**

1. Turn a modpack URL into a server-ready config quickly.
2. Avoid manually finding Java versions, loaders, startup flags, and install scripts.
3. Reuse deployment patterns across multiple servers or customers.
4. Keep outputs editable rather than fully opaque.

### Secondary User Persona

**Name:** Modpack Builder / Community Admin

**Profile:**

1. Curates or designs packs for a group.
2. Wants server and client packaging to stay in sync.
3. Is interested in AI assistance, but only if the output is inspectable and exportable.

This persona is better aligned with the `/projects` backend than with the current frontend.

### Competitive And Alternative Landscape

Hatchery is entering a market with adjacent alternatives rather than many direct equivalents.

**1. Pterodactyl**

Pterodactyl is a free, open-source game server management panel focused on isolated containerized game servers, and it already has a strong operator audience. It is infrastructure, not a modpack-to-panel automation layer. Hatchery’s opening is to sit above Pterodactyl and automate the modpack-specific setup work that Pterodactyl leaves to operators.

Source: https://pterodactyl.io/

**2. Crafty Controller**

Crafty Controller is a self-hosted Minecraft server management panel with backups, file management, and multi-server operations. It competes as an easier all-in-one panel for some users who might otherwise adopt Hatchery plus Pterodactyl. Hatchery differentiates by focusing on modpack import, artifact generation, and panel-oriented automation rather than replacing the whole control plane.

Source: https://craftycontrol.com/

**3. Modrinth Hosting**

Modrinth Hosting now provides tightly integrated mod and modpack installation, backups, file management, SFTP access, and hosting operations inside the Modrinth ecosystem. This is the strongest product-level competitive pressure for Hatchery because it reduces the need for self-managed provisioning for many users. Hatchery’s counter-position is control, bring-your-own-infrastructure, and panel interoperability rather than managed hosting.

Source: https://modrinth.com/hosting

**4. mrpack4server and similar server-side install tools**

Tools like `mrpack4server` already help operators install Modrinth-format modpacks on arbitrary hosts. These tools are lighter-weight alternatives for technical users who do not need a web product. Hatchery differentiates by offering identity, persistence, multi-user access, artifact management, and eventually deployment workflows.

Source: https://github.com/Patbox/mrpack4server

### Competitive Positioning

The best product position for Hatchery is:

**"Bring-your-own-panel automation for modded Minecraft operations."**

That avoids competing head-on with full hosting providers and avoids trying to replace generic game server panels. It also fits the code that already exists.

## Product Roadmap

### Phase 0: Release Readiness

Objective: make the current codebase shippable before expanding scope.

Milestones:

1. Repair backend startup by reconciling `api/ai.py` with `services/ai_service.py`, or remove the broken AI router from the runtime path until reworked.
2. Align CI with runtime requirements by moving backend CI to Python 3.12+.
3. Add a migration system for database changes.
4. Replace plaintext panel secret storage with encrypted-at-rest storage.
5. Expand tests to cover app startup, auth dependencies, egg creation, panel CRUD, and project processing happy paths.
6. Define a supported environment matrix for SQLite dev and PostgreSQL production.

Exit criteria:

1. Backend imports and starts cleanly.
2. Frontend typecheck passes for non-mock product code.
3. Core API paths are covered by integration tests.

### Phase 1: Core Product MVP

Objective: productize Hatchery as a modpack-to-egg platform.

Milestones:

1. Harden Modrinth and CurseForge import flows.
2. Add validation and better error handling for unsupported or malformed packs.
3. Improve egg editing, preview, and export UX.
4. Implement a real panel connectivity test.
5. Add audit history for egg creation, regeneration, and export.
6. Publish installation, admin, and operator documentation.

Exit criteria:

1. A user can sign in, create an egg from a URL, verify panel connectivity, edit the output, and export it without leaving the product.

### Phase 2: Deployment Product

Objective: move from artifact generation to actual operational deployment.

Milestones:

1. Introduce a deployment abstraction layer for Pterodactyl and Pelican APIs.
2. Add one-click egg upload/publish into connected panels.
3. Add deployment status, retries, and failure logs.
4. Add per-panel capability checks and compatibility validation.
5. Add secrets rotation and panel health monitoring.

Exit criteria:

1. Hatchery can deploy generated artifacts to a supported panel from inside the product.

### Phase 3: AI Project Studio

Objective: promote the existing `/projects` backend into a second product surface.

Milestones:

1. Add a real Projects UI in the main application, not only mockups.
2. Make project processing asynchronous through a worker queue instead of FastAPI background tasks.
3. Surface project statuses, logs, selected mods, and quest outputs.
4. Add export management for `.mrpack`.
5. Add approval/edit loops around AI-selected outputs.

Exit criteria:

1. Users can create, inspect, edit, and export AI-generated projects through the main UI.

### Phase 4: Team And Enterprise Readiness

Objective: support organizations rather than individual operators.

Milestones:

1. Add team/workspace concepts above `owner_id`.
2. Introduce granular RBAC beyond simple role extraction.
3. Add audit logs, usage reporting, and API keys/service accounts.
4. Support external secret managers and SSO-ready deployment patterns.
5. Add operational SLAs, backup policies, and admin observability.

## Architectural Changes

### 1. Runtime And API Consistency

Required changes:

1. Normalize the AI subsystem. Either:
   1. keep the new global OpenRouter-style `AIService`, or
   2. restore per-user configurable AI contracts.
2. Remove or isolate incomplete modules from the runtime path until they are consistent.
3. Add explicit API versioning once deployment features are introduced.

Why:

The current backend cannot be considered production-ready while `app.main` fails to import because of router-service drift.

### 2. Data Management

Required changes:

1. Introduce Alembic or an equivalent migration framework.
2. Keep SQLite for local development only.
3. Make PostgreSQL the documented production database.
4. Add indexes and retention rules for project, mod cache, and audit data.

Why:

`create_all()` is acceptable for experiments, but not for tracked product evolution, upgrades, or incident recovery.

### 3. Background Processing

Required changes:

1. Move project processing out of FastAPI background tasks.
2. Use Redis plus `arq`, which is already declared as a dependency.
3. Persist job state and structured task logs.
4. Add retries, idempotency, and timeout policies for external API work.

Why:

The current project pipeline performs network calls, AI calls, DB writes, and export preparation in a request-coupled app process. That is fragile under scale and hard to operate.

### 4. Security

Required changes:

1. Encrypt stored panel API keys.
2. Add outbound request controls and rate limits for third-party APIs.
3. Add audit logging for sensitive actions.
4. Validate allowed redirect and origin settings per environment.
5. Add tenancy-aware access checks if workspaces are introduced.

Why:

The auth foundation is good, but secret storage and operator controls are still MVP-grade.

### 5. Deployment Architecture

Required changes:

1. Create a panel integration service layer separate from HTTP routers.
2. Treat egg generation and panel deployment as separate bounded workflows.
3. Add capability adapters for Pterodactyl and Pelican rather than embedding assumptions directly in endpoints.
4. Store deployment attempts and results as first-class records.

Why:

This is the missing architecture needed to transform Hatchery from a generator into an operations product.

### 6. Frontend Product Architecture

Required changes:

1. Add a first-class `Projects` route only when the backend flow is stable.
2. Separate mockups from production typechecking/build paths, or move them into a design-only package.
3. Align frontend domain types with backend models; current `owner_id` typing mismatches already cause type errors.
4. Add user-facing job status and error reporting for long-running actions.

Why:

The product UI currently exposes only part of the backend and is blocked by mixed production and mockup code in the same app tree.

### 7. Observability

Required changes:

1. Standardize structured logging across app, worker, and deployment flows.
2. Add metrics for import success rate, generation duration, deployment success rate, and third-party API failure rate.
3. Add health checks for database, worker, and external dependency reachability.

Why:

A product operator needs to understand whether failures come from Hatchery, Modrinth, CurseForge, AI providers, or panel APIs.

## Deployment & Distribution

### Recommended Distribution Model

Hatchery should be distributed in two forms.

**1. Self-hosted OSS distribution**

Best for:

1. Technical hobbyists.
2. Community operators.
3. Small hosts already invested in Pterodactyl/Pelican.

Packaging:

1. Containerized backend, frontend, PostgreSQL, and Redis.
2. Example environment templates for Zitadel and reverse proxy setup.
3. Helm chart or Compose package after the current Podman Compose path is stabilized.

**2. Managed control-plane offering later**

Best for:

1. Teams that want the workflow but not the hosting burden.
2. Hosts that want a branded operator experience.

Packaging:

1. SaaS app for auth, artifact generation, project workflows, and deployment orchestration.
2. Customer-managed panel infrastructure connected through API credentials.

This hybrid model fits the codebase better than full managed server hosting.

### Hosting Strategy

For the near term:

1. Run backend as a containerized FastAPI service.
2. Run frontend behind Nginx or another reverse proxy.
3. Use PostgreSQL for production persistence.
4. Add Redis when project processing or deployment jobs become supported features.
5. Terminate TLS at a reverse proxy or ingress layer.

### Operational Model

Required operational capabilities before product launch:

1. Environment-specific configuration management.
2. Secret rotation for panel credentials and AI provider keys.
3. Database backup and restore procedures.
4. Release notes and migration guides.
5. Support playbooks for third-party API outages.

### Pricing And Packaging Direction

The current implementation suggests three eventual packaging tiers:

1. Free self-hosted community edition: egg generation, panel records, export.
2. Pro/self-hosted commercial edition: deployment automation, audit logs, team features.
3. Managed offering: hosted control plane, support, operational monitoring, enterprise auth patterns.

This tiering matches the codebase better than usage-based pricing today because the current architecture is still workflow-centric, not metered-service-centric.

## Strategic Conclusion

Hatchery is closest to product viability when treated as a **modpack deployment automation layer for self-managed Minecraft infrastructure**.

The repository already contains the seeds of a broader AI modpack platform, but the product transition should not start there. The correct path is:

1. Stabilize runtime and release engineering.
2. Productize egg generation and panel integration.
3. Add true deployment workflows.
4. Then promote AI project generation into a second major product module.

If executed in that order, Hatchery can move from an interesting internal tool into a credible product for technical Minecraft server operators.
