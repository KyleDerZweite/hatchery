# Hatchery — Product Direction

**Status: AUTHORITATIVE. Written 2026-07-13.**

This document supersedes `PRODUCT_STRATEGY.md`, `MVP_PLAN.md`, and every prior
planning artifact in this repository. Where any of those disagree with this
document, this document wins. They are retained only as a historical record of
how we got here.

---

## 1. The shift, in one paragraph

Hatchery was designed as a *compiler*: modpack URL in, Pterodactyl egg JSON out,
deterministically. That compiler is largely built and it works. But the real job
our users have is not "produce an artifact" — it is **"get this thing running,
and fix it when it doesn't."** That job has an unbounded long tail (wrong Java,
wrong RAM, client-only mods on a server, a mod that isn't a modpack, a loader
version that doesn't exist for that Minecraft version) which no lookup table can
close. So Hatchery becomes an **agent harness**: a deterministic core that does
everything mechanical, plus a model with domain-specific tools that engages when
the deterministic path fails or when the request needs judgment.

The agent is the exception handler, not the main path. That distinction governs
every decision below.

---

## 2. Why we believe this: the TerraFirmaCraft case

On 2026-07-13 a general-purpose coding agent, given only a CurseForge API key and
a Pelican application API key, was asked to set up TerraFirmaCraft on a Pelican
panel after the panel's built-in CurseForge egg failed with:

```
ERROR: File id '8065927' not found for project 'TerraFirmaCraft'
```

It succeeded, end to end, in roughly 25 tool calls. The final server answered a
real Minecraft protocol handshake: `TerraFirmaCraft · 1.21.1 · 0/10 players`.

*(All credentials used in that session have been rotated and are deliberately
absent from this document.)*

### 2.1 What it actually figured out

Six moments of genuine judgment. None are reachable by deterministic code:

1. **TerraFirmaCraft is a mod, not a modpack.** The CurseForge egg installs
   modpacks — it fetches a server-pack archive and reads `manifest.json`. Project
   302973 lives under `/mc-mods/`, so it has no server pack and no manifest. The
   "file id not found" error was a *symptom*; correcting the file ID would never
   have worked, because the egg was structurally the wrong tool.

2. **The panel had no Forge egg** — only NeoForge — so it reasoned about whether
   NeoForge could substitute.

3. **It caught the NeoForge 1.20.1 trap.** This is the single most instructive
   moment in the trace. It queried the NeoForge release maven for 20.1.x versions
   and got *zero results*. Instead of shrugging, it investigated, and found that
   NeoForge for MC 1.20.1 only ever existed under a **different maven artifact**
   (`net.neoforged:forge`, versioned 47.x) which that egg cannot install. The
   obvious plan — TFC 1.20.1 + NeoForge egg — would have failed at install time.
   No lookup table anywhere contains this fact.

4. **It re-targeted the entire build** to MC 1.21.1 + NeoForge 21.1.235, because
   TFC's NeoForge line (4.2.5) is newer and more actively developed than its
   Forge 1.20.1 line (3.2.23).

5. **It opened the jar** and found `data/tfc/worldgen/world_preset/overworld.json`,
   concluded `level-type=tfc:overworld`, and — critically — knew this had to be
   written **before first boot**, because chunks generated with vanilla worldgen
   are permanently wrong and cannot be retroactively fixed.

6. **It verified against `level.dat`, not `server.properties`.** It refused to
   trust the config it had just written, on the correct suspicion that the egg
   might rewrite `server.properties` on start. It confirmed TFC's geology palette
   (granite, gneiss, schist, dolomite, chert…) was baked into the world.

Points 5 and 6 together are what separate this from a toy. The agent identified an
irreversible action, sequenced around it, and then verified the outcome against
ground truth rather than against its own intent. **That is the behavior we are
productizing.**

### 2.2 Guardrails the trace demonstrated (encode these)

- **Check before destroying.** It inspected the server volume (4 KB, zero files),
  confirmed the failed install had left nothing behind, and stated explicitly that
  converting the server would destroy no data — *before* doing it.
- **Sequence around irreversibility.** World generation is one-way. Config first,
  boot second.
- **Verify against ground truth.** `level.dat`, not `server.properties`.
- **Know the limits of your own evidence.** It noted its Minecraft protocol ping
  ran from the host to its own public IP, which proves the server is listening and
  speaking Minecraft but does **not** prove the port is open from the outside.

### 2.3 The uncomfortable finding

**Most of that request should never have reached an agent, and our code is what
forced it to.** See §3.

---

## 3. Deterministic gaps in the current codebase

These are bugs and missing features, not research problems. They are the highest
value-per-hour work in this entire document, and several of them are the direct
cause of the failure modes we set out to solve with AI.

### 3.1 We cannot see mods at all — only modpacks

- `ModpackService.CURSEFORGE_PATTERNS` (`modpack_service.py:62`) only matches
  `curseforge.com/minecraft/modpacks/...`. A `/mc-mods/` URL returns `UNKNOWN`
  and we throw *"Unsupported modpack URL."*
- `_fetch_curseforge_info` hardcodes `classId: 4471` (modpacks) in its search
  (`modpack_service.py:285`). We are structurally blind to mods.

CurseForge tells us what a project is: `classId` **6 = mod**, **4471 = modpack**.
Drop the filter, branch on the result. The agent's single biggest "insight" in
§2.1 becomes a deterministic answer.

### 3.2 We ignore dependencies entirely

CurseForge file metadata carries `dependencies: [{modId, relationType}]`, where
`relationType` **3 = required**, **2 = optional**. That is exactly how the agent
found Patchouli (required) and JEI (optional). Our code never reads this field.

Walk it transitively and "install a single mod plus its required dependencies onto
a loader" becomes a fully deterministic feature — which alone would have handled
~80% of the TFC request with no model in the loop.

### 3.3 Client-only mods are never filtered on CurseForge

`_get_modpack_files_script` (`modpack_service.py:543`) is *right* in architecture:
it builds a server from the **client** pack's manifest, which is precisely how you
deploy a pack that ships no server pack. But:

- The Modrinth branch filters `select(.env.server != "unsupported")` (line 560).
- The CurseForge branch (line 599) downloads **every** file in the manifest into
  `mods/`. Client mods go straight onto the server.

This is the "starts, then immediately shuts down" failure. See §5 for the fix.

### 3.4 `mod_count` is never populated → every egg gets 1536 MB

`ModpackInfo.mod_count` is declared `= 0` (`modpack_service.py:52`) and **nothing
in either fetch path ever assigns it**. `_get_recommended_memory(mod_count)`
(line 1070) therefore returns `"1536"` for every pack we have ever generated. A
300-mod pack gets 1.5 GB. This is the "RAM configured wrong" failure.

Root cause: **we never open the pack.** We only read metadata *about* the pack
from the search APIs. The mod list, the configs, the overrides tree — every hard
problem lives inside the zip, and our backend has never looked inside one.
`ModpackInfo.mods` is declared and never filled.

### 3.5 Java mapping is wrong at the 1.20.5 boundary

`_detect_java_version` (`modpack_service.py:375`) maps everything in
`1.18 ≤ v < 1.21` to Java 17. **MC 1.20.5+ requires Java 21.** This is the "JVM
version mismatch" failure, exactly.

### 3.6 A null `downloadUrl` kills the whole install

When a mod author disables third-party downloads, `downloadUrl` is null and the
install script hard-exits (`modpack_service.py:606`). No fallback, no partial
install, no useful report. See §9.2 for the legitimate handling.

### 3.7 No loader-version resolver

Nothing in the codebase knows which maven artifact serves which loader/MC-version
pair. The NeoForge 1.20.1 trap (§2.1) is exactly the kind of fact that belongs in
a resolver, not in a model's head.

---

## 4. The thesis: compiler and debugger

**Do not let a model do what a lookup table does.** Parsing `manifest.json`,
mapping MC 1.20.1 → Java 17, resolving `projectID`/`fileID` pairs, walking a
dependency graph, downloading by hash — all deterministic, all cheap, all already
mostly written. A model there adds cost, latency, and nondeterminism for nothing.

**The agent earns its keep exactly where there is no table:**

- Crash triage — reading a 3,000-line Forge crash report and finding the one line
  that matters.
- Client/server classification for Forge and NeoForge mods, where no reliable
  declaration exists.
- "Recommended settings for 5 players" — edits spread across `server.properties`,
  TOML, JSON5, SNBT, and mod-specific `.cfg` files with no schema.
- Structural surprises: the project is a mod not a modpack; this loader/MC pair
  lives under a different maven artifact; this mod needs a world preset set before
  first boot.

Fix the §3 gaps first. Measure what still fails. *That* residue is the agent's job.

---

## 5. The technical core: CurseForge client/server classification

This is the thing worth building a company on, because it cannot be solved by
reading an API.

CurseForge manifests carry **no** environment metadata. Modrinth's do. That
asymmetry is the entire reason Pelican's CurseForge plugin needs a server pack:
pack authors hand-strip client mods to produce one, and when they don't bother,
everyone downstream is stuck.

Build the classification ladder, cheapest layer first:

1. **Read the jar.** Fabric mods declare `"environment": "client"` in
   `fabric.mod.json`. Reliable and free.
2. **Cross-reference Modrinth.** Many CurseForge mods also exist on Modrinth,
   where `env.server` is declared. Match by file hash or slug, inherit the answer.
3. **Ask the agent.** Forge and NeoForge have no trustworthy side declaration —
   and Forge is most of CurseForge. Here we genuinely need judgment: the mod page,
   the description, the class names in the jar.
4. **Boot it and see.** The ground truth. Crash → parse report → identify the
   offending mod → strip → reboot.

Layer 4 is **unavoidable** for Forge packs. That is why a boot oracle is not
optional.

Every time layer 4 resolves something, write the answer back into a table keyed by
`(projectID, fileID)` so layers 1–3 get it for free forever.

**That table — CurseForge project → server-side compatibility, verified by actual
boots — is the asset.** Pelican doesn't have it. Modrinth only has it for
Modrinth. It compounds with every user. See §8.

---

## 6. Architecture: one core, many targets

The user-facing product has two halves and one core:

- **Half A:** existing modpack → deploy
- **Half B:** fully custom modpack authoring (progression, quests) → deploy
- **The core:** everything about actually running and fixing a server

Both halves produce the same thing — a `ServerBuild` (files, mods, configs, env) —
and hand it to the same core.

### 6.1 The `ServerRuntime` interface

Every deploy target needs the same five primitives:

```
ServerRuntime
  apply(build)                                  # put files, mods, configs
  set_env(java_version, memory_mb, jvm_args)
  start() -> log stream
  stop()
  status()
```

Implement it once per target:

- `PelicanRuntime` / `PterodactylRuntime` — the primary target
- `SandboxRuntime` — ephemeral container we own, for verification
- `AgentRuntime` — a small daemon the user installs on their own VPS
- `HostedRuntime` — we run it (see §10; defer)

**The agent only ever talks to `ServerRuntime`.** It never knows which one it is
driving. This means the same debugging loop works in our sandbox, on the user's
Pelican, and on a stranger's VPS. That is the "one core" made real.

### 6.2 Correction: the panel *is* the sandbox

An earlier version of this plan said "build the ephemeral sandbox first." The TFC
trace proves that wrong for our primary user.

For a bring-your-own-panel user, **we do not need a sandbox at all.** Their panel
is the execution environment and the real server is the oracle. Install, boot,
read the log, fix, reboot — all on infrastructure they already pay for. Our
compute cost is zero.

The sandbox is needed only for:

1. Users with no panel of their own.
2. Proactively building the classification table (§5) on our own schedule.
3. Avoiding destructive experiments on a **populated** server.

Note that the agent handled (3) by hand in the TFC trace, correctly, by checking
the volume was empty first. **That is a guardrail to encode, not a sandbox to
build.**

**Therefore: drive-the-user's-panel is v1. Sandbox is v2.**

### 6.3 We need the *client* API, not just the application API

The most actionable finding in the TFC trace, and easy to miss.

The agent hit a wall — *"Your application API key can't issue power actions
(that's the client API)"* — and worked around it by SSHing in as root, reading the
Wings config, extracting the daemon token, hitting the Wings daemon API directly,
and using `sudo` to write files into `/var/lib/pelican/volumes` (then `chown`ing
them to uid 999).

**That entire detour exists only because it had a `papp_` key and nothing else.**
Pterodactyl/Pelican split cleanly:

| API | Token | Can do |
|---|---|---|
| Application | `papp_…` | create/update servers, change egg, trigger reinstall, list nodes/eggs/allocations |
| Client | user token | power on/off, **write files**, **console websocket**, update startup variables |

With **both**, every single thing the agent did with sudo becomes a plain API
call, and the `chown 999:988` dance disappears entirely because Wings owns files
written through its own API.

**Hard boundary: if Hatchery ever needs sudo or a root password on a user's box,
the design is wrong.** No exceptions.

### 6.4 The egg may be the wrong deploy abstraction

Pterodactyl's Application API has no egg-import endpoint — eggs are imported
through the admin UI. (Verify whether Pelican added one.) If it hasn't, we cannot
push a custom egg per pack anyway.

The workaround is better than the original plan: **use a single generic Java egg
and push the fully-built server directory through the client API.** The generated
egg then becomes an *export artifact* for users who want one, not the deploy
mechanism. This decouples us from panel egg management completely.

---

## 7. The tool surface

Derived directly from where the TFC agent improvised with bash and stumbled. Every
one of its recoveries is a tool we should have shipped.

| What broke in the trace | The tool it was asking for |
|---|---|
| Guessed the wrong maven artifact for NeoForge 1.20.1 | `resolve_loader(loader, mc_version)` → correct artifact + version, with the 1.20.1 trap baked in |
| Hand-rolled CF queries, `classId` confusion | `resolve_curseforge_project(url_or_id)` → type, files, loaders, **dependencies** |
| `unzip`/`file` not installed, silently no-op'd | `inspect_jar(url)` → modid, version, deps, declared side, world presets, datapacks |
| `sudo` + Wings daemon token + heredoc/stdin collision | `panel_write_file` / `panel_power` / `panel_console` (client API) |
| Hand-written Minecraft protocol ping script | `mc_ping(host, port)` |
| Ad-hoc log tailing grepping for `Done (` | `boot_and_wait()` → `{booted, done_ms, crash_report, log_tail}` |

Plus:

- `resolve_modpack(url)` — existing, needs the §3 fixes
- `search_mods` / `get_mod_versions` / `get_mod_env_support`
- `parse_crash_report(text)` → structured (exception class, suspected mod, mod list
  from the report footer). **Never hand the model 3,000 raw lines.**
- `search_known_issues(mod, version, error_signature)` → our cache first, then web
- Format-aware `patch_config(path, key, value)` so the agent cannot corrupt SNBT
  or TOML by hand
- **Web search.** Not incidental — it is how the TFC agent recovered from every
  unknown it hit. Keep it.

Give the model these and the TFC task takes ~8 calls instead of ~25, with no
silent failures.

### 7.1 The verification ladder

The reason this domain suits agents is that it has a cheap, automatable oracle.
Coding agents work because tests exist; our equivalent is a server boot.

- **L0** — static: loader/Java match, all deps resolve, no client-only mods
- **L1** — boots to `Done (…)!`
- **L2** — survives 5 minutes idle without crashing, TPS sane
- **L3** — a headless client completes the handshake and joins (proves mod sync)

Nobody in this market says *"we don't just generate a config, we prove it boots."*
Modrinth Hosting doesn't. Pterodactyl doesn't. That is our claim, and it is only
credible because of this ladder.

---

## 8. The moat: the knowledge cache

Every resolved session produces a durable record:

```
(error signature | loader | mc_version | mod set) → (the patch that fixed it)
```

The TFC trace alone yields four entries:

- NeoForge has no 20.1.x line; MC 1.20.1 NeoForge is `net.neoforged:forge` 47.x.
- TerraFirmaCraft requires `level-type=tfc:overworld`, set **before** first boot.
- Patchouli is a required dependency of TFC; JEI is optional.
- `RuntimeDistCleaner ... invalid dist DEDICATED_SERVER` is **benign** — TFC itself
  annotates the next line "This is fine."

That last one matters as much as the others: a benign-signature table stops the
agent chasing ghosts.

After a thousand sessions, the next user hitting the same NeoForge mixin crash
gets a deterministic fix in two seconds for zero tokens. Our cost per resolution
decays toward zero while a competitor's stays at model prices, and our
deterministic core gets better for free.

**We are not building an AI wrapper. We are building a modded-Minecraft failure
database, and the agent is how we populate it.**

---

## 9. Boundaries and non-goals

### 9.1 Never require host access

Restated from §6.3 because it is the easiest boundary to erode. Scoped panel API
keys only. No sudo. No root SSH. No stored root passwords.

For the VPS-without-a-panel case, ship a small **Hatchery agent daemon** the user
installs, rather than asking for SSH credentials. It gives us the log stream and
file access we need anyway, and we never hold their root password.

### 9.2 Do not script around CurseForge's third-party download flag

Browser-automating downloads that mod authors have explicitly blocked will get our
API key revoked and is exactly the thing authors get litigious about. It is not on
the table.

The good news: **our current design is already in the right legal position.** The
generated egg passes `CF_API_KEY` as an env var and the download happens *on the
user's panel, with the user's key* (`modpack_service.py:601`). We never
redistribute. Keep it that way.

Legitimate handling for a blocked mod:

- The pack **zip** is usually downloadable even when individual mods are not.
- The user already has the jars — the CurseForge app caches every mod locally. A
  "point at your instance folder / upload the zip" path solves it completely and
  legally.
- Report the blocked mod clearly instead of hard-failing the install
  (fixes §3.6).

The one place we must pull jars onto our own infrastructure is the verification
sandbox. Keep those ephemeral, pull with the user's key, and cache classification
*results* — not the jars.

### 9.3 Trust and reviewability

Operators hate an opaque tool editing their server. Every agent action lands as a
reviewable diff with a stated reason, with approve/reject. That is also how we
harvest labels for the cache (§8).

### 9.4 Budget ceilings

Hard limits per session: max N boots, max M tool calls, then stop and hand the
human a good report. *"I couldn't fix it, here's exactly what I learned"* is a fine
outcome. A large token bill on a pack that never boots is not.

---

## 10. Business shape

### 10.1 Setup is the wedge; on-call is the business

"Set up this pack for 5 players" is a one-shot job, and one-shot jobs churn. The
subscription-shaped version of the identical capability is:

> **An on-call agent for modded servers.** It is connected to your panel console.
> Your server crashes at 3am after a mod update. It reads the crash, applies the
> known fix, restarts, and leaves you a diff and an explanation in the morning.

Same harness, same tools, same cache. Setup is the acquisition funnel for it.

### 10.2 Tokens are not the COGS — boots are

A 300-mod pack is ~6 GB of RAM for several minutes plus gigabytes of downloads.
BYOK does not make a user free; it just moves the token cost. **Meter the thing
that costs us money: verified boots and debug sessions.**

This maps cleanly onto the code we already have:

- **Free** — egg generation, metadata parsing, and **cached** fixes. Marginal cost
  ≈ zero. This is exactly what is already built.
- **Paid, BYOK** — live agent debug sessions. We supply compute, they bring the key.
- **Paid, credits** — same, but we supply the model too.
- **Deploy to your own panel** — costs us nothing; the panel does the work. Can
  stay cheap or free forever.
- **Hosted** — real hosting: DDoS, abuse, DMCA, support. **Defer as long as
  possible.** It is a different company.

### 10.3 On "MCP server / toolset" as the direction

An MCP server is **distribution, not a business.** It is an excellent on-ramp — a
self-hoster plugs it into their own Claude Code and it fixes their server — and an
excellent forcing function for clean tool design. It fits our AGPLv3 posture. Ship
it.

But tool schemas are copyable in a weekend. The things we own are the harness, the
verification ladder, the panel integrations, and above all the cache (§8). **Do not
mistake the wrapper for the product.**

---

## 11. Risks

- **CurseForge third-party download flag** (§9.2) — shapes onboarding permanently.
- **Arbitrary code execution.** We run untrusted mod jars. The sandbox must assume
  hostile, not merely buggy: no cloud metadata access, tight egress policy,
  memory/CPU/disk caps, hard timeouts.
- **Mod licensing.** Cache classification metadata, not jars.
- **Nondeterminism eroding trust** — mitigated by §9.3.
- **Cost blowout on unfixable packs** — mitigated by §9.4.
- **Competitive pressure from Modrinth Hosting**, which reduces the need for
  self-managed provisioning. Our counter-position remains control,
  bring-your-own-infrastructure, and panel interoperability — plus the one claim
  they do not make: *we prove it boots*.

---

## 12. Roadmap

Ordered by value-per-hour, not by excitement.

### Step 1 — Make Hatchery do the TFC job deterministically

No agent yet. This is days, not weeks, and it is the highest-leverage work in this
document.

1. **Mod-project support.** Drop the hardcoded `classId: 4471`, branch on the
   returned `classId` (6 = mod, 4471 = modpack). Extend `CURSEFORGE_PATTERNS` to
   match `/mc-mods/`.
2. **Transitive dependency resolution** from the CF `dependencies` field
   (`relationType` 3 = required, 2 = optional).
3. **Loader-version resolver** that knows the NeoForge 1.20.1 trap.
4. **Jar inspection** — modid, version, declared side, world presets, datapacks.
5. Fix `mod_count` (§3.4), the Java 21 boundary (§3.5), and null `downloadUrl`
   handling (§3.6).
6. **Open the pack.** Download the zip, parse the manifest, populate
   `ModpackInfo.mods`. Everything downstream depends on this.

### Step 2 — `ServerRuntime` + `PelicanRuntime` + the boot oracle

Wire the Pelican **client** API (file writes, power, console websocket) alongside
the existing application API. This turns us from "URL → egg JSON" into "URL →
running, verified server on the user's panel."

### Step 3 — The eval set

Build ~10 packs and mods, TFC among them, as case #1. Measure the baseline: **how
many boot clean with zero agent involvement after Step 1?** That number determines
how much agent we actually need, and which failure classes to encode next.

The eval set is itself a durable asset. Build it early, keep it forever.

### Step 4 — The agent

Put it on top of `ServerRuntime` with the §7 tool surface. Point it at TFC first.
**Success criterion: it solves the TFC task in ~8 calls, with no sudo.**

Start writing its verdicts into the cache (§8) from day one.

### Step 5 — Classification table + fix cache as first-class systems

### Step 6 — `SandboxRuntime`, for users with no panel

### Step 7 — Half B: authoring

Custom modpack creation with progression and quests, reusing the entire core.

**The trick that makes this work:** the reason AI-generated quests are usually
garbage is hallucinated item IDs — the model writes `thermal:copper_ingot` when
the registry says `thermal:ingot_copper`, and the quest book is broken. Once the
boot oracle exists we get the fix for free: **boot the pack, dump the item/recipe
registry, and hand the agent the real IDs.** It then cannot invent an item that
does not exist. Same for recipes and tags. That single trick is the difference
between a demo and a product, and it falls out of infrastructure built for Half A.

---

## 13. Superseded documents

| Document | Status |
|---|---|
| `PRODUCT_STRATEGY.md` (2026-04-04) | Superseded 2026-07-13. Historical only. |
| `MVP_PLAN.md` | Superseded 2026-07-13. Historical only. The MVP it describes is complete; its roadmap is void. |
| `AUDIT.md` (2026-07-06) | Still valid as a point-in-time verification record. Its findings are not superseded, but its scope predates this direction. |
| `README.md` | Still valid for the current shipped MVP. Will need rewriting as Step 1 lands. |
| `OPERATIONS.md` | Still valid. |
