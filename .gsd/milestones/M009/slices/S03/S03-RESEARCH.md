# S03: Dual-Chain Docker + Testnet Proof — Research

**Date:** 2026-04-02
**Status:** Complete
**Depth:** Targeted — known technology (Docker Compose, Subsquid), known codebase after S01/S02

## Summary

S03 adds a second Docker Compose service for LUKSO testnet alongside mainnet, fixes several gaps in the Docker build/entrypoint that S02 introduced, and proves dual-chain operation via Hasura queries. The work is mostly configuration and Docker plumbing — no new TypeScript application code. Three critical blockers exist in the current Docker setup that must be fixed first.

## Recommendation

Fix Docker infrastructure gaps first (Dockerfile + entrypoint), then add the testnet service, then verify. The three blockers are: (1) `psql` isn't installed in the Docker image but entrypoint.sh uses it, (2) the backfill SQL file isn't copied into the Docker image, (3) only one indexer should run migrations/Hasura config. Testnet proof uses RPC-only mode per D017.

## Implementation Landscape

### Critical Gaps in Current Docker Setup

**Gap 1: `psql` not installed in Docker image.** The `docker/entrypoint.sh` (added by S02) runs `psql "$DB_URL" -f backfill-network.sql`, but the Dockerfile's runtime stage is `node:22-alpine` with only `git` added. `psql` (from `postgresql-client`) is not installed. **Fix:** Add `RUN apk add --no-cache postgresql-client` to the runner stage.

**Gap 2: Backfill SQL not copied into Docker image.** The Dockerfile explicitly says `packages/typeorm/db is NOT copied` (line 86-87). But `entrypoint.sh` references `/app/packages/typeorm/db/migrations/backfill-network.sql`. The file will never exist in the container. **Fix:** Add a COPY line for the migration files: `COPY packages/typeorm/db/migrations/*.sql ./packages/typeorm/db/migrations/`

**Gap 3: Dual indexer entrypoint conflict.** The current `entrypoint.sh` runs: (1) TypeORM migrations, (2) backfill migration, (3) Hasura wait + generate + apply, (4) start indexer. With two indexer services, both would race to run migrations and Hasura config simultaneously. **Fix:** Split into leader/follower pattern: the mainnet indexer runs migrations + Hasura config; the testnet indexer skips them (controlled by env var like `SKIP_MIGRATIONS=true`).

### Key Files to Modify

| File | What Changes |
|------|-------------|
| `docker/Dockerfile` | Add `postgresql-client`, copy backfill SQL files |
| `docker/entrypoint.sh` | Add `SKIP_MIGRATIONS` guard, add `CHAIN_ID` passthrough |
| `docker/docker-compose.yml` | Add `indexer-testnet` service, add `CHAIN_ID` to both services |
| `.env.example` | Add testnet env vars (`RPC_URL_TESTNET`, `CHAIN_ID`) |

### Docker Compose — Testnet Service Design

The testnet service is a near-clone of the mainnet `indexer` service with these differences:

```yaml
indexer-testnet:
  container_name: ${COMPOSE_PROJECT_NAME:-lsp-indexer}-indexer-testnet
  build:
    context: ..
    dockerfile: ./docker/Dockerfile
  image: lsp-indexer:latest
  restart: unless-stopped
  depends_on:
    postgres:
      condition: service_healthy
    indexer:
      condition: service_healthy  # Wait for mainnet to finish migrations
  environment:
    CHAIN_ID: lukso-testnet
    DB_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-postgres}
    RPC_URL: ${RPC_URL_TESTNET:-https://rpc.testnet.lukso.network}
    RPC_RATE_LIMIT: ${RPC_RATE_LIMIT_TESTNET:-10}
    FINALITY_CONFIRMATION: ${FINALITY_CONFIRMATION_TESTNET:-75}
    SKIP_MIGRATIONS: "true"  # Mainnet runs migrations
    # No SQD_GATEWAY — testnet uses RPC-only (D017)
    ...same IPFS, logging vars...
```

Key design points:
- **`depends_on: indexer: service_healthy`** — ensures mainnet has finished migrations before testnet starts
- **`CHAIN_ID: lukso-testnet`** — picked up by `packages/indexer/src/app/index.ts` → `getChainConfig('lukso-testnet')`
- **No `SQD_GATEWAY`** — the ChainConfig for `lukso-testnet` already has `gateway: undefined` (D017), and `processorFactory.ts` skips `setGateway()` when undefined
- **`SKIP_MIGRATIONS: "true"`** — entrypoint skips TypeORM migrations, backfill SQL, and Hasura config
- **Same Docker image** — both services use the same built image, differentiated only by env vars

### Entrypoint Changes

Current entrypoint flow:
```
1. cd /app/packages/typeorm
2. pnpm migration:generate
3. pnpm migration:apply
4. psql backfill-network.sql
5. Wait for Hasura
6. pnpm hasura:generate + hasura:apply
7. cd /app/packages/indexer
8. exec pnpm start:simple
```

New flow with SKIP_MIGRATIONS guard:
```
if [ "$SKIP_MIGRATIONS" != "true" ]; then
  1. cd /app/packages/typeorm
  2. pnpm migration:generate
  3. pnpm migration:apply
  4. psql backfill-network.sql
  5. Wait for Hasura
  6. pnpm hasura:generate + hasura:apply
fi
7. cd /app/packages/indexer
8. exec pnpm start:simple
```

The mainnet service (SKIP_MIGRATIONS unset) runs the full entrypoint. The testnet service (SKIP_MIGRATIONS=true) skips straight to starting the indexer.

### CHAIN_ID Passthrough

The mainnet indexer service needs `CHAIN_ID: lukso` (or omit it — defaults to 'lukso' in `src/app/index.ts`). The testnet service needs `CHAIN_ID: lukso-testnet`. This is already wired in the application code:

```typescript
// packages/indexer/src/app/index.ts
const chainId = process.env.CHAIN_ID || 'lukso';
const chainConfig = getChainConfig(chainId);
```

And the stateSchema is already per-chain (D016):
```typescript
new TypeormDatabase({ stateSchema: `squid_processor_${chainConfig.network}` })
```

### Hasura Network Filter Verification

After both processors start, Hasura auto-exposes the `network` column (added to all 71 entities in S01). Verification queries:

```graphql
# Chain-specific query
query { universal_profile(where: { network: { _eq: "lukso" } }, limit: 5) { id network } }

# Cross-chain query (both chains)
query { universal_profile(limit: 10) { id network } }
```

Note: Since this is a Docker Compose proof, actual data depends on real blockchain indexing. The testnet processor in RPC-only mode will be slow to sync. The proof is that **both processors start, connect to the same DB, and write with different network values** — not that they fully sync.

### Health Check for Testnet

The current health check uses `pgrep -f "ts-node.*lib/app/index.js"` which works for both services since they run the same binary. No changes needed.

### Per-Chain Volumes

The testnet indexer should have its own log volume:
```yaml
volumes:
  - indexer-testnet-logs:/app/packages/indexer/logs
```

Add `indexer-testnet-logs` to the volumes section.

## Constraints

- **entrypoint.sh runs as `node` user** (line 107 of Dockerfile: `USER node`). The `postgresql-client` install must happen before the USER switch.
- **Hasura configuration runs from `packages/typeorm/`** — it uses `squid-hasura-configuration` which reads from the typeorm package's schema. Both indexers share the same Hasura config since they write to the same tables.
- **backfill-network.sql is in `packages/typeorm/db/migrations/`** — this path must be mounted/copied correctly in the Docker image. The `db/` directory is currently gitignored and not copied.
- **RPC-only mode for testnet is slow** — historical sync without SQD gateway can take hours/days. For proof purposes, we only need to verify the processor starts and begins writing. We do NOT need a full sync.

## Pitfalls

- **Race condition on Hasura config:** If both indexers try to run `squid-hasura-configuration` simultaneously, metadata could corrupt. The `SKIP_MIGRATIONS` pattern prevents this.
- **Missing `psql` in container:** The S02 entrypoint added `psql` usage but didn't update the Dockerfile. This will cause a runtime crash. Must fix.
- **Backfill SQL not in image:** The `packages/typeorm/db/` directory is explicitly not copied into the Docker image. Must add a COPY line for the SQL migration files.
- **Testnet contract addresses may differ from mainnet:** The current `LUKSO_TESTNET` config in `chainConfig.ts` uses the same `multicallAddress`, `lsp26Address`, and `lsp23Address` as mainnet. These may be different on testnet. For the proof, this is acceptable — if contracts don't exist, supportsInterface calls will return false and entities will have null FKs (which is correct behavior for addresses that aren't valid on that chain).

## Verification Strategy

1. `docker compose config` — validates the YAML is syntactically correct with all env var interpolation
2. `docker compose build` — verifies Dockerfile changes compile
3. `docker compose up -d postgres` → `docker compose up -d indexer` → wait for healthy → `docker compose up -d indexer-testnet` — staged startup
4. `docker compose logs indexer` — shows `Starting indexer for chain 'lukso'`
5. `docker compose logs indexer-testnet` — shows `Starting indexer for chain 'lukso-testnet'`
6. Both processors running without crashes for >60 seconds
7. Hasura console shows `network` column on all tables

**Note:** Full Hasura query verification with actual chain data requires real RPC endpoints and time for indexing. The structural proof is: both services start, both connect to the same DB with different stateSchemas, both begin processing.

## Task Decomposition Guidance

This is a 2-task slice:

**T01 — Fix Docker Infrastructure + Add Testnet Service** (~45 min)
- Fix Dockerfile: add `postgresql-client`, copy backfill SQL files
- Fix entrypoint.sh: add `SKIP_MIGRATIONS` guard
- Add `indexer-testnet` service to docker-compose.yml
- Add `CHAIN_ID` env var to both indexer services
- Add testnet env vars to `.env.example`
- Add `indexer-testnet-logs` volume
- Verify: `docker compose config` parses cleanly

**T02 — Verify Build & Document** (~15 min)
- Run `docker compose --env-file ../.env build` to verify Dockerfile changes
- Update any relevant documentation
- Write final verification notes

Both tasks are sequential (T02 depends on T01).
