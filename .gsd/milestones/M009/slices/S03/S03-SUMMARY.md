---
id: S03
parent: M009
milestone: M009
provides:
  - Docker infrastructure for dual-chain indexing (mainnet + testnet)
  - SKIP_MIGRATIONS entrypoint guard for follower services
  - indexer-testnet service definition with testnet-specific env vars
  - .env.example with testnet configuration documentation
requires:
  - slice: S01
    provides: Chain config registry and CHAIN_ID-parameterized processor
  - slice: S02
    provides: Backfill migration SQL files and network-prefixed ID scheme
affects:
  []
key_files:
  - docker/Dockerfile
  - docker/entrypoint.sh
  - docker/docker-compose.yml
  - .env.example
key_decisions:
  - D020: Leader/follower migration pattern — mainnet runs migrations, testnet sets SKIP_MIGRATIONS=true
  - Testnet service reuses same Docker image as mainnet, differing only in env vars
  - All SQL migration files (*.sql) copied into image for backfill support
patterns_established:
  - Leader/follower SKIP_MIGRATIONS pattern for multi-service Docker deployments sharing one database
  - Per-chain Docker service template: same image, chain-specific env vars (CHAIN_ID, RPC_URL, rate limits), depends_on leader service
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M009/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M009/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T07:26:13.793Z
blocker_discovered: false
---

# S03: Dual-Chain Docker + Testnet Proof

**Docker infrastructure supports dual-chain indexing with LUKSO mainnet (leader) and testnet (follower) services sharing one PostgreSQL, using SKIP_MIGRATIONS pattern to prevent migration races.**

## What Happened

This slice delivered the Docker infrastructure needed to run two chain-indexer instances simultaneously from the same image. Three Docker blockers from S02 were fixed first: postgresql-client was missing from the Alpine runner image (needed for psql backfill), SQL migration files weren't copied into the image, and there was no way to prevent the second service from racing on migrations.

The fix for the migration race established the **leader/follower pattern**: the mainnet `indexer` service acts as leader — it runs TypeORM migrations, applies the backfill SQL, waits for Hasura, and applies Hasura metadata. The testnet `indexer-testnet` service sets `SKIP_MIGRATIONS=true`, which causes entrypoint.sh to skip all migration and Hasura config steps. It depends on the mainnet service with `service_healthy` condition, ensuring schema is ready before it starts indexing.

The testnet service reuses the exact same Docker image with different env vars: `CHAIN_ID=lukso-testnet`, testnet RPC URL, no SQD gateway (RPC-only per decision D017), and its own log volume. Both services write to the shared PostgreSQL with network-prefixed IDs (from S01/S02 work), preventing ID collisions.

Docker Compose config validation confirms both services parse correctly with correct CHAIN_ID values. Docker image build could not be tested (no daemon in CI) but static Dockerfile validation confirms all changes are structurally correct.

## Verification

All 6 slice-level grep checks pass: postgresql-client in Dockerfile, backfill SQL files copied, SKIP_MIGRATIONS guard in entrypoint.sh, indexer-testnet service in docker-compose.yml, CHAIN_ID in compose, RPC_URL_TESTNET in .env.example. Docker Compose config parses cleanly — `docker compose config --services` shows both indexer and indexer-testnet. CHAIN_ID grep returns 2 matches with correct values (lukso, lukso-testnet).

## Requirements Advanced

- R034 — docker-compose.yml now defines separate indexer services per chain (mainnet + testnet) with chain-specific env vars, both writing to shared Postgres
- R035 — LUKSO testnet service configured as second processor alongside mainnet — infrastructure ready for dual-chain indexing proof

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Docker image build could not execute due to missing Docker daemon in CI environment. Static Dockerfile validation was used instead.

## Known Limitations

Full Docker image build must be verified in an environment with Docker socket access. End-to-end testnet indexing (actual block processing) requires live RPC access and is not tested here — this slice proves the infrastructure is correctly configured.

## Follow-ups

None.

## Files Created/Modified

- `docker/Dockerfile` — Added postgresql-client install and SQL migration file copy to runner stage
- `docker/entrypoint.sh` — Wrapped migrations+Hasura config in SKIP_MIGRATIONS guard for leader/follower pattern
- `docker/docker-compose.yml` — Added CHAIN_ID to mainnet service, added full indexer-testnet service with testnet env vars and leader dependency
- `.env.example` — Added testnet env vars: CHAIN_ID, RPC_URL_TESTNET, RPC_RATE_LIMIT_TESTNET, FINALITY_CONFIRMATION_TESTNET
