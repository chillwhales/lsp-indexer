---
estimated_steps: 37
estimated_files: 4
skills_used: []
---

# T01: Fix Docker infrastructure gaps and add testnet service

Fix three Docker blockers identified in S02 (missing psql, missing backfill SQL in image, migration race condition) and add the LUKSO testnet indexer service to docker-compose.yml.

## Steps

1. **Fix Dockerfile — install postgresql-client:** In the `runner` stage (after `FROM base AS runner`), add `RUN apk add --no-cache postgresql-client` BEFORE the `USER node` line. This is needed because entrypoint.sh runs `psql` for the backfill migration.

2. **Fix Dockerfile — copy backfill SQL files:** Add a COPY line to the runner stage: `COPY packages/typeorm/db/migrations/*.sql ./packages/typeorm/db/migrations/`. This must go after the builder stage copies but before `USER node`. Create the target directory first if needed.

3. **Fix entrypoint.sh — add SKIP_MIGRATIONS guard:** Wrap the migration + Hasura config section in an `if [ "$SKIP_MIGRATIONS" != "true" ]; then ... fi` block. The guarded section includes: migration:generate, migration:apply, psql backfill, Hasura wait + generate + apply. The indexer start (`cd /app/packages/indexer` + `exec pnpm start:simple`) stays OUTSIDE the guard — both leader and follower must start the indexer. Add a log line when skipping: `echo "⏭️  SKIP_MIGRATIONS=true — skipping migrations and Hasura config"`

4. **Add CHAIN_ID to mainnet indexer service:** In `docker/docker-compose.yml`, add `CHAIN_ID: ${CHAIN_ID:-lukso}` to the existing `indexer` service's environment block.

5. **Add indexer-testnet service to docker-compose.yml:** Add a new service `indexer-testnet` after the `indexer` service. Key differences from mainnet:
   - `container_name: ${COMPOSE_PROJECT_NAME:-lsp-indexer}-indexer-testnet`
   - `depends_on: postgres: condition: service_healthy` AND `indexer: condition: service_healthy`
   - `CHAIN_ID: lukso-testnet`
   - `RPC_URL: ${RPC_URL_TESTNET:-https://rpc.testnet.lukso.network}`
   - `RPC_RATE_LIMIT: ${RPC_RATE_LIMIT_TESTNET:-10}`
   - `FINALITY_CONFIRMATION: ${FINALITY_CONFIRMATION_TESTNET:-75}`
   - `SKIP_MIGRATIONS: "true"`
   - NO `SQD_GATEWAY` (testnet uses RPC-only per D017)
   - Same DB_URL, IPFS, logging, Hasura vars as mainnet
   - Own volume: `indexer-testnet-logs:/app/packages/indexer/logs`
   - Same health check, image, restart policy, resource limits as mainnet

6. **Add indexer-testnet-logs volume:** Add `indexer-testnet-logs: driver: local` to the volumes section.

7. **Update .env.example:** Add testnet env vars with comments: `CHAIN_ID`, `RPC_URL_TESTNET`, `RPC_RATE_LIMIT_TESTNET`, `FINALITY_CONFIRMATION_TESTNET`.

## Must-Haves

- [ ] Dockerfile runner stage has `apk add --no-cache postgresql-client` before `USER node`
- [ ] Dockerfile copies `packages/typeorm/db/migrations/*.sql` into image
- [ ] entrypoint.sh wraps migrations+Hasura in `SKIP_MIGRATIONS` guard
- [ ] docker-compose.yml mainnet service has `CHAIN_ID` env var
- [ ] docker-compose.yml has `indexer-testnet` service with correct env vars
- [ ] docker-compose.yml testnet depends_on indexer (service_healthy)
- [ ] docker-compose.yml has `indexer-testnet-logs` volume
- [ ] .env.example documents testnet env vars

## Verification

- `cd docker && docker compose --env-file ../.env.example config 2>&1 | head -5` — should not show YAML errors (may show warnings about unset required vars, that's OK)
- `grep -q 'postgresql-client' docker/Dockerfile` — exits 0
- `grep -q 'backfill-network.sql' docker/Dockerfile` — exits 0 (SQL files copied)
- `grep -q 'SKIP_MIGRATIONS' docker/entrypoint.sh` — exits 0
- `grep -q 'indexer-testnet' docker/docker-compose.yml` — exits 0
- `grep -q 'CHAIN_ID' docker/docker-compose.yml` — exits 0
- `grep -q 'RPC_URL_TESTNET' .env.example` — exits 0

## Inputs

- ``docker/Dockerfile` — current multi-stage Dockerfile (missing psql + backfill SQL)`
- ``docker/entrypoint.sh` — current entrypoint (no SKIP_MIGRATIONS guard)`
- ``docker/docker-compose.yml` — current compose with single indexer service`
- ``.env.example` — current env template (no testnet vars)`
- ``packages/typeorm/db/migrations/backfill-network.sql` — SQL migration that entrypoint runs via psql`

## Expected Output

- ``docker/Dockerfile` — fixed with postgresql-client install + SQL file copy`
- ``docker/entrypoint.sh` — updated with SKIP_MIGRATIONS guard`
- ``docker/docker-compose.yml` — updated with indexer-testnet service + CHAIN_ID on mainnet + new volume`
- ``.env.example` — updated with testnet env vars`

## Verification

grep -q 'postgresql-client' docker/Dockerfile && grep -q 'migrations.*sql' docker/Dockerfile && grep -q 'SKIP_MIGRATIONS' docker/entrypoint.sh && grep -q 'indexer-testnet' docker/docker-compose.yml && grep -q 'CHAIN_ID' docker/docker-compose.yml && grep -q 'RPC_URL_TESTNET' .env.example && echo 'All checks pass'
