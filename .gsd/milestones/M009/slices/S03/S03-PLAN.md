# S03: Dual-Chain Docker + Testnet Proof

**Goal:** Docker infrastructure supports dual-chain indexing — LUKSO mainnet and testnet run as separate services from the same image, writing to shared PostgreSQL with no ID collisions.
**Demo:** After this: docker compose up starts LUKSO mainnet + testnet processors simultaneously. Both write to shared PostgreSQL. Hasura query with network filter returns chain-specific data. Query without filter returns both chains. No ID collisions.

## Tasks
- [x] **T01: Fixed three Docker blockers (missing psql, missing SQL files, migration race) and added LUKSO testnet indexer service with leader/follower SKIP_MIGRATIONS pattern** — Fix three Docker blockers identified in S02 (missing psql, missing backfill SQL in image, migration race condition) and add the LUKSO testnet indexer service to docker-compose.yml.

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
  - Estimate: 30m
  - Files: docker/Dockerfile, docker/entrypoint.sh, docker/docker-compose.yml, .env.example
  - Verify: grep -q 'postgresql-client' docker/Dockerfile && grep -q 'migrations.*sql' docker/Dockerfile && grep -q 'SKIP_MIGRATIONS' docker/entrypoint.sh && grep -q 'indexer-testnet' docker/docker-compose.yml && grep -q 'CHAIN_ID' docker/docker-compose.yml && grep -q 'RPC_URL_TESTNET' .env.example && echo 'All checks pass'
- [x] **T02: Validated Docker Compose config parses cleanly with both indexer and indexer-testnet services and correct CHAIN_ID values; all 7 slice checks pass** — Build the Docker image to prove all Dockerfile changes compile, and validate the full docker-compose config resolves correctly.

## Steps

1. **Validate compose config:** Run `cd docker && docker compose --env-file ../.env.example config` to verify YAML syntax and env interpolation. The command may warn about required vars like HASURA_GRAPHQL_ADMIN_SECRET being unset — that's expected. The key check is no YAML parse errors.

2. **Create a minimal .env for build:** Create a temporary `.env.build` with just the required vars for config validation: `HASURA_GRAPHQL_ADMIN_SECRET=test-secret-for-build`. Run `cd docker && docker compose --env-file ../.env.build config > /dev/null` to verify clean parse.

3. **Build the Docker image:** Run `cd docker && docker compose --env-file ../.env.build build indexer` to verify the Dockerfile compiles. This confirms postgresql-client installs and SQL files copy correctly. If the build environment lacks Docker daemon access, verify with `docker build -f docker/Dockerfile .` or document the limitation.

4. **Verify both services exist in config:** Run `cd docker && docker compose --env-file ../.env.build config --services` and confirm both `indexer` and `indexer-testnet` appear.

5. **Verify CHAIN_ID in rendered config:** Run `cd docker && docker compose --env-file ../.env.build config` and grep for `CHAIN_ID: lukso` (mainnet) and `CHAIN_ID: lukso-testnet` (testnet) in the output.

6. **Clean up:** Remove the temporary `.env.build` file.

## Must-Haves

- [ ] `docker compose config` parses without YAML errors
- [ ] Both `indexer` and `indexer-testnet` services appear in `--services` output
- [ ] CHAIN_ID values are correct for both services in rendered config
- [ ] Docker build completes (or is documented as requiring Docker daemon)

## Verification

- `cd docker && docker compose --env-file ../.env.build config --services | sort` outputs `indexer` and `indexer-testnet` (among others)
- `cd docker && docker compose --env-file ../.env.build config | grep -c 'CHAIN_ID'` returns >= 2
- Docker build exit code 0 (or documented limitation)
  - Estimate: 15m
  - Files: docker/docker-compose.yml, docker/Dockerfile
  - Verify: cd docker && echo 'HASURA_GRAPHQL_ADMIN_SECRET=test' > ../.env.build && docker compose --env-file ../.env.build config --services | grep -q 'indexer-testnet' && docker compose --env-file ../.env.build config | grep -c 'CHAIN_ID' | grep -q '[2-9]' && rm -f ../.env.build && echo 'Config validation passed'
