---
id: T03
parent: S01
milestone: M008
provides: []
requires: []
affects: []
key_files: ["docker/Dockerfile", "docker/entrypoint.sh", "package.json"]
key_decisions: ["Cleaned stale comment referencing packages/typeorm/db to fully eliminate old paths"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@chillwhales/indexer build exits 0. rg scan of docker/ and package.json finds zero references to @chillwhales/typeorm, packages/typeorm, @chillwhales/abi, or packages/abi. Combined slice verification command passes clean."
completed_at: 2026-04-01T08:24:44.815Z
blocker_discovered: false
---

# T03: Removed all packages/abi and packages/typeorm references from Dockerfile, entrypoint.sh, and root package.json — only packages/indexer remains

> Removed all packages/abi and packages/typeorm references from Dockerfile, entrypoint.sh, and root package.json — only packages/indexer remains

## What Happened
---
id: T03
parent: S01
milestone: M008
key_files:
  - docker/Dockerfile
  - docker/entrypoint.sh
  - package.json
key_decisions:
  - Cleaned stale comment referencing packages/typeorm/db to fully eliminate old paths
duration: ""
verification_result: passed
completed_at: 2026-04-01T08:24:44.816Z
blocker_discovered: false
---

# T03: Removed all packages/abi and packages/typeorm references from Dockerfile, entrypoint.sh, and root package.json — only packages/indexer remains

**Removed all packages/abi and packages/typeorm references from Dockerfile, entrypoint.sh, and root package.json — only packages/indexer remains**

## What Happened

Updated three infrastructure files: Dockerfile (removed all COPY/build lines for packages/abi and packages/typeorm across deps/builder/runner stages), entrypoint.sh (changed migration cd to packages/indexer), and root package.json (updated 4 Hasura/migration scripts from @chillwhales/typeorm to @chillwhales/indexer). Also cleaned a stale comment referencing packages/typeorm/db.

## Verification

pnpm --filter=@chillwhales/indexer build exits 0. rg scan of docker/ and package.json finds zero references to @chillwhales/typeorm, packages/typeorm, @chillwhales/abi, or packages/abi. Combined slice verification command passes clean.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 3200ms |
| 2 | `rg '@chillwhales/typeorm|packages/typeorm|@chillwhales/abi|packages/abi' docker/ package.json --type-not yaml -q` | 1 | ✅ pass (no matches) | 50ms |
| 3 | `pnpm --filter=@chillwhales/indexer build && ! rg ... -q` | 0 | ✅ pass | 3300ms |


## Deviations

Cleaned one stale comment (packages/typeorm/db → db/) not mentioned in the plan — trivial addition to eliminate all old-path traces.

## Known Issues

None.

## Files Created/Modified

- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `package.json`


## Deviations
Cleaned one stale comment (packages/typeorm/db → db/) not mentioned in the plan — trivial addition to eliminate all old-path traces.

## Known Issues
None.
