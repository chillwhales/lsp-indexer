---
id: T01
parent: S03
milestone: M009
provides: []
requires: []
affects: []
key_files: ["docker/Dockerfile", "docker/entrypoint.sh", "docker/docker-compose.yml", ".env.example"]
key_decisions: ["Testnet service reuses same image as mainnet, differing only in env vars", "Leader/follower pattern via SKIP_MIGRATIONS env var — mainnet runs migrations, testnet skips", "All SQL migration files (*.sql) copied into image, not just backfill-network.sql"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All seven grep checks pass (postgresql-client, backfill-network.sql, SKIP_MIGRATIONS, indexer-testnet, CHAIN_ID, RPC_URL_TESTNET). Docker Compose config validates with no YAML errors when required secrets are provided."
completed_at: 2026-04-02T07:23:27.964Z
blocker_discovered: false
---

# T01: Fixed three Docker blockers (missing psql, missing SQL files, migration race) and added LUKSO testnet indexer service with leader/follower SKIP_MIGRATIONS pattern

> Fixed three Docker blockers (missing psql, missing SQL files, migration race) and added LUKSO testnet indexer service with leader/follower SKIP_MIGRATIONS pattern

## What Happened
---
id: T01
parent: S03
milestone: M009
key_files:
  - docker/Dockerfile
  - docker/entrypoint.sh
  - docker/docker-compose.yml
  - .env.example
key_decisions:
  - Testnet service reuses same image as mainnet, differing only in env vars
  - Leader/follower pattern via SKIP_MIGRATIONS env var — mainnet runs migrations, testnet skips
  - All SQL migration files (*.sql) copied into image, not just backfill-network.sql
duration: ""
verification_result: passed
completed_at: 2026-04-02T07:23:27.964Z
blocker_discovered: false
---

# T01: Fixed three Docker blockers (missing psql, missing SQL files, migration race) and added LUKSO testnet indexer service with leader/follower SKIP_MIGRATIONS pattern

**Fixed three Docker blockers (missing psql, missing SQL files, migration race) and added LUKSO testnet indexer service with leader/follower SKIP_MIGRATIONS pattern**

## What Happened

Applied all seven task plan steps: installed postgresql-client in Dockerfile runner stage, copied SQL migration files into image, wrapped entrypoint.sh migrations+Hasura in SKIP_MIGRATIONS guard, added CHAIN_ID to mainnet indexer, added full indexer-testnet service with testnet-specific env vars and leader/follower dependency chain, added indexer-testnet-logs volume, and documented testnet env vars in .env.example.

## Verification

All seven grep checks pass (postgresql-client, backfill-network.sql, SKIP_MIGRATIONS, indexer-testnet, CHAIN_ID, RPC_URL_TESTNET). Docker Compose config validates with no YAML errors when required secrets are provided.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'postgresql-client' docker/Dockerfile` | 0 | ✅ pass | 50ms |
| 2 | `grep -q 'backfill-network.sql' docker/Dockerfile` | 0 | ✅ pass | 50ms |
| 3 | `grep -q 'SKIP_MIGRATIONS' docker/entrypoint.sh` | 0 | ✅ pass | 50ms |
| 4 | `grep -q 'indexer-testnet' docker/docker-compose.yml` | 0 | ✅ pass | 50ms |
| 5 | `grep -q 'CHAIN_ID' docker/docker-compose.yml` | 0 | ✅ pass | 50ms |
| 6 | `grep -q 'RPC_URL_TESTNET' .env.example` | 0 | ✅ pass | 50ms |
| 7 | `HASURA_GRAPHQL_ADMIN_SECRET=test docker compose --env-file ../.env.example config` | 0 | ✅ pass | 1000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docker/Dockerfile`
- `docker/entrypoint.sh`
- `docker/docker-compose.yml`
- `.env.example`


## Deviations
None.

## Known Issues
None.
