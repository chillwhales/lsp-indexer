# S02: Backfill Migration — UAT

**Milestone:** M009
**Written:** 2026-04-02T07:16:03.806Z

# S02 UAT: Backfill Migration

## Preconditions
- PostgreSQL database with existing LUKSO indexer data (pre-multi-chain schema)
- Docker environment with Subsquid env vars configured (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS)
- S01 (Chain-Aware Indexer Core) merged and TypeORM schema applied

---

## Test 1: SQL Migration Syntax Validation
**Steps:**
1. Run `grep -c 'UPDATE' packages/typeorm/db/migrations/backfill-network.sql`
2. Run `grep -c 'DISABLE TRIGGER ALL' packages/typeorm/db/migrations/backfill-network.sql`
3. Run `grep -c 'ENABLE TRIGGER ALL' packages/typeorm/db/migrations/backfill-network.sql`
4. Run `grep -c 'ADD COLUMN IF NOT EXISTS network' packages/typeorm/db/migrations/backfill-network.sql`

**Expected:** UPDATE ≥ 130, DISABLE = 71, ENABLE = 71, ADD COLUMN = 71

## Test 2: Migration Idempotency Guards
**Steps:**
1. Run `grep -c "NOT LIKE 'lukso:%'" packages/typeorm/db/migrations/backfill-network.sql`

**Expected:** Count ≥ 130 (every UPDATE has a guard)

## Test 3: Verify-Backfill Script Exists and Covers All FKs
**Steps:**
1. Run `test -f packages/typeorm/db/migrations/verify-backfill.sql`
2. Run `grep -c 'NOT EXISTS' packages/typeorm/db/migrations/verify-backfill.sql`

**Expected:** File exists. NOT EXISTS count ≥ 100 (covers all 103 FK relationships)

## Test 4: LSP12IssuedAssets Handler Fix
**Steps:**
1. Run `grep -c 'prefixId' packages/indexer/src/handlers/lsp12IssuedAssets.handler.ts`

**Expected:** Count ≥ 3 (potentialIds, extractFromIndex, extractFromMap)

## Test 5: Docker Entrypoint Wiring
**Steps:**
1. Run `grep -q 'backfill-network.sql' docker/entrypoint.sh`
2. Verify the backfill step comes AFTER TypeORM migration and BEFORE indexer start by checking line order

**Expected:** backfill-network.sql reference exists. Migration step is positioned between TypeORM migrations and sqd process start.

## Test 6: Build and Test Pass
**Steps:**
1. Run `pnpm --filter=@chillwhales/indexer build`
2. Run `pnpm --filter=@chillwhales/indexer test`

**Expected:** Both exit 0. All 306 tests pass.

## Test 7: Live Migration (Manual — requires database)
**Steps:**
1. Take a database backup
2. Run `psql $DB_URL -f packages/typeorm/db/migrations/backfill-network.sql`
3. Run `psql $DB_URL -f packages/typeorm/db/migrations/verify-backfill.sql`
4. Check output for any orphaned FK rows

**Expected:** Migration applies without errors. Verify script reports 0 orphaned references. All rows have network='lukso'. All deterministic IDs start with 'lukso:'. Row counts match pre-migration counts.

## Test 8: Migration Re-Run (Idempotency)
**Steps:**
1. Run backfill-network.sql a second time on the same database

**Expected:** No errors. No data changes (all WHERE guards skip already-prefixed rows).

## Edge Cases
- **Empty database:** Migration should succeed (no rows to update, columns still added)
- **Partially migrated database:** If previous run was interrupted, re-running should complete remaining updates without duplicating prefixes
- **DB_URL not set:** Docker entrypoint should construct URL from DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS
