---
id: T02
parent: S02
milestone: M009
provides: []
requires: []
affects: []
key_files: ["packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts", "docker/entrypoint.sh"]
key_decisions: ["Also prefixed potentialIds in resolve loop to match prefixed entity IDs", "Construct DB_URL from Subsquid env vars when not directly set"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "pnpm --filter=@chillwhales/indexer build exits 0. grep confirms prefixId in handler and backfill-network.sql in entrypoint. All 5 slice-level SQL verification checks pass."
completed_at: 2026-04-02T07:14:46.899Z
blocker_discovered: false
---

# T02: Fixed 3 missing prefixId() calls in LSP12IssuedAssets handler and added backfill migration step to docker/entrypoint.sh

> Fixed 3 missing prefixId() calls in LSP12IssuedAssets handler and added backfill migration step to docker/entrypoint.sh

## What Happened
---
id: T02
parent: S02
milestone: M009
key_files:
  - packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts
  - docker/entrypoint.sh
key_decisions:
  - Also prefixed potentialIds in resolve loop to match prefixed entity IDs
  - Construct DB_URL from Subsquid env vars when not directly set
duration: ""
verification_result: passed
completed_at: 2026-04-02T07:14:46.899Z
blocker_discovered: false
---

# T02: Fixed 3 missing prefixId() calls in LSP12IssuedAssets handler and added backfill migration step to docker/entrypoint.sh

**Fixed 3 missing prefixId() calls in LSP12IssuedAssets handler and added backfill migration step to docker/entrypoint.sh**

## What Happened

Fixed LSP12IssuedAssets handler bug where 3 ID-generation sites (potentialIds loop, extractFromIndex, extractFromMap) used bare address strings instead of prefixId(). Also updated docker/entrypoint.sh to run backfill-network.sql via psql after TypeORM migrations but before indexer start, constructing DB_URL from Subsquid env vars when not directly set.

## Verification

pnpm --filter=@chillwhales/indexer build exits 0. grep confirms prefixId in handler and backfill-network.sql in entrypoint. All 5 slice-level SQL verification checks pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pnpm --filter=@chillwhales/indexer build` | 0 | ✅ pass | 5500ms |
| 2 | `grep -q 'prefixId' packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts` | 0 | ✅ pass | 10ms |
| 3 | `grep -q 'backfill-network.sql' docker/entrypoint.sh` | 0 | ✅ pass | 10ms |
| 4 | `grep -c 'UPDATE' packages/typeorm/db/migrations/backfill-network.sql (137 >= 130)` | 0 | ✅ pass | 10ms |
| 5 | `grep -c 'DISABLE TRIGGER ALL' backfill-network.sql (71)` | 0 | ✅ pass | 10ms |
| 6 | `grep -c 'ENABLE TRIGGER ALL' backfill-network.sql (71)` | 0 | ✅ pass | 10ms |
| 7 | `grep -c 'ADD COLUMN IF NOT EXISTS network' backfill-network.sql (71)` | 0 | ✅ pass | 10ms |
| 8 | `test -f packages/typeorm/db/migrations/verify-backfill.sql` | 0 | ✅ pass | 10ms |


## Deviations

Also fixed potentialIds in handle() method — task plan only mentioned extractFromIndex/extractFromMap but the resolveEntities lookup needed matching prefixed IDs too.

## Known Issues

None.

## Files Created/Modified

- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`
- `docker/entrypoint.sh`


## Deviations
Also fixed potentialIds in handle() method — task plan only mentioned extractFromIndex/extractFromMap but the resolveEntities lookup needed matching prefixed IDs too.

## Known Issues
None.
