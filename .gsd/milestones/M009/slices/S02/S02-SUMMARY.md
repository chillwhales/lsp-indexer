---
id: S02
parent: M009
milestone: M009
provides:
  - Idempotent backfill-network.sql migration for existing LUKSO data
  - verify-backfill.sql FK integrity checker
  - Fixed LSP12IssuedAssets handler with prefixId() calls
  - Docker entrypoint wired to run backfill migration
requires:
  - slice: S01
    provides: Chain-aware core with network column on all 71 entities and prefixId() utility
affects:
  - S03
key_files:
  - packages/typeorm/db/migrations/backfill-network.sql
  - packages/typeorm/db/migrations/verify-backfill.sql
  - packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts
  - docker/entrypoint.sh
key_decisions:
  - Hand-written SQL migration per D018 — not TypeORM auto-generated
  - 33 PK updates (27 deterministic + 6 composite) covering all ID-prefixing needs
  - 103 FK updates matching the complete FK map from the plan
  - CREATE INDEX IF NOT EXISTS for all 71 network column indexes
  - Construct DB_URL from Subsquid env vars (DB_HOST, DB_PORT, etc.) when not directly set
patterns_established:
  - Idempotent SQL migration pattern: every UPDATE guarded with WHERE NOT LIKE 'lukso:%'
  - FK integrity verification pattern: NOT EXISTS checks across all FK relationships in verify-backfill.sql
  - Docker entrypoint hand-written migration step: runs after TypeORM auto-migrations, before indexer start
observability_surfaces:
  - verify-backfill.sql diagnostic script for post-migration FK integrity checks
  - Docker entrypoint logs migration status (applied/skipped)
drill_down_paths:
  - .gsd/milestones/M009/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M009/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T07:16:03.806Z
blocker_discovered: false
---

# S02: Backfill Migration

**Wrote idempotent SQL migration (33 PK + 103 FK updates across 71 tables) with verify script, fixed LSP12IssuedAssets prefixId bug, and wired migration into Docker entrypoint.**

## What Happened

This slice delivered the complete data migration path for converting existing single-chain LUKSO data to the multi-chain schema established in S01.

**T01 — backfill-network.sql + verify-backfill.sql:** Created a hand-written, single-transaction SQL migration that: (1) disables triggers on all 71 entity tables, (2) adds `network varchar NOT NULL DEFAULT 'lukso'` column to every table via ADD COLUMN IF NOT EXISTS, (3) prefixes 33 deterministic-ID PKs with 'lukso:' (27 standard + 6 composite), (4) updates all 103 FK columns referencing those PKs with matching prefixes, (5) re-enables triggers, and (6) creates network column indexes. Every UPDATE has a `WHERE NOT LIKE 'lukso:%'` idempotency guard. The companion verify-backfill.sql runs NOT EXISTS checks across all 103 FK relationships to detect orphaned references post-migration.

**T02 — LSP12IssuedAssets handler fix + Docker entrypoint:** Fixed 3 missing `prefixId()` calls in the LSP12IssuedAssets handler (potentialIds loop, extractFromIndex, extractFromMap) that would have produced unprefixed IDs in a multi-chain context. Also added a step to docker/entrypoint.sh that runs backfill-network.sql via psql after TypeORM auto-migrations but before indexer start, constructing DB_URL from Subsquid environment variables when not directly set.

## Verification

All verification checks pass individually:
- `pnpm --filter=@chillwhales/indexer build` exits 0 (TypeScript compilation clean)
- `pnpm --filter=@chillwhales/indexer test` exits 0 (306 tests pass across 24 files)
- `grep -q 'prefixId' packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts` — confirmed
- `grep -q 'backfill-network.sql' docker/entrypoint.sh` — confirmed
- `grep -c 'UPDATE' backfill-network.sql` = 137 (≥130 threshold)
- `grep -c 'DISABLE TRIGGER ALL'` = 71, `ENABLE TRIGGER ALL` = 71, `ADD COLUMN IF NOT EXISTS network` = 71
- `test -f packages/typeorm/db/migrations/verify-backfill.sql` — exists

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T02 deviated slightly: also fixed potentialIds in the handle() method resolve loop — task plan only mentioned extractFromIndex/extractFromMap, but the resolveEntities lookup needed matching prefixed IDs too.

## Known Limitations

Migration has not been tested against a live PostgreSQL database with real LUKSO data — only SQL syntax and structure have been verified. The verify-backfill.sql script should be run post-migration to confirm FK integrity.

## Follow-ups

S03 (Dual-Chain Docker + Testnet Proof) depends on this migration being applied successfully to test dual-chain operation.

## Files Created/Modified

- `packages/typeorm/db/migrations/backfill-network.sql` — New: idempotent SQL migration — 71 ADD COLUMN, 33 PK prefix updates, 103 FK prefix updates, 71 indexes
- `packages/typeorm/db/migrations/verify-backfill.sql` — New: FK integrity checker with NOT EXISTS checks across all 103 FK relationships
- `packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts` — Fixed 3 missing prefixId() calls in ID generation (potentialIds, extractFromIndex, extractFromMap)
- `docker/entrypoint.sh` — Added backfill migration step after TypeORM auto-migrations, before indexer start
