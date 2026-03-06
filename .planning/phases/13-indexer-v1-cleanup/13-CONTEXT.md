# Phase 13: Indexer v1 Cleanup - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all v1 indexer code, Docker configs, and scripts. Promote v2 to be the canonical (and only) indexer. `packages/indexer-v2/` becomes `packages/indexer/`, `docker/v2/` promotes to `docker/`, and all "v2" suffixes are eliminated. The repo should read as if v1 never existed.

</domain>

<decisions>
## Implementation Decisions

### Docker directory restructuring

- Promote `docker/v2/` contents flat into `docker/` — remove the `v2/` subdirectory entirely
- Replace existing `docker/README.md` with simplified content documenting only the current Docker setup
- Drop "v2" from all Docker service names and image tags (e.g., `indexer-v2` → `indexer`)
- Update all internal references (build contexts, volume mounts, env file paths) in the same pass as the file promotion — no broken intermediate state

### Other v1-era packages

- `packages/abi` — KEEP, used by indexer-v2
- `packages/typeorm` — KEEP, used by indexer-v2
- `packages/comparison-tool` — remove v1-to-v2 comparison mode, keep v2-to-v2 for multi-instance consistency checks
- Remove all version terminology from comparison-tool (no "v1"/"v2" flags or labels — it's just "instance A vs instance B")
- Keep `comparison-tool` name as-is (already version-neutral)

### "v2" suffix elimination scope

- Rename npm package name: `@chillwhales/indexer-v2` → `@chillwhales/indexer` (package.json name matches directory)
- Promote ALL v2-suffixed root scripts (not just `start:v2` → `start`) — includes `dev:v2`, `build:v2`, `test:v2`, etc. Remove all v1 scripts
- Only update example env files (`.env.example` / `.env.sample`) to drop v2 references — do NOT rename actual env var names that deployments depend on
- Rename internal code references to drop v2: class names, logger labels, error messages, function names

### Cleanup boundary with Phase 14

- Fix v1/v2 structural comments in THIS phase — if a comment references a path or package that no longer exists, fix it now (broken references are bugs, not style issues)
- Update root `README.md` to reflect single-indexer reality — remove v1 sections, update paths/commands
- Sweep ALL docs for broken v1/v2 path references — fix factual inaccuracies, don't rewrite for style
- Leave `.planning/` docs as-is — they're historical records, not operational docs

### Claude's Discretion

- Ordering of cleanup operations (what gets renamed/deleted first)
- Exact git commit granularity (one big commit vs per-area commits)
- How to handle any edge cases with workspace resolution during the rename

</decisions>

<specifics>
## Specific Ideas

- The repo should read as if v1 never existed — no "v2" suffix anywhere in operational code/config
- comparison-tool is used for multi-instance indexer consistency verification (making sure parallel indexers produce the same data)
- Example env files get updated, but actual env var names stay untouched to avoid breaking deployments

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 13-indexer-v1-cleanup_
_Context gathered: 2026-03-06_
