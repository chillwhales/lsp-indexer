# S03: Dual-Chain Docker + Testnet Proof — UAT

**Milestone:** M009
**Written:** 2026-04-02T07:26:13.793Z

# S03 UAT: Dual-Chain Docker + Testnet Proof

## Preconditions
- Docker and Docker Compose installed with daemon access
- Repository cloned with S01 (chain config) and S02 (backfill migration) changes applied
- `.env` file with valid `HASURA_GRAPHQL_ADMIN_SECRET` and optional testnet RPC URL

---

## Test 1: Dockerfile installs postgresql-client

**Steps:**
1. Run `grep 'postgresql-client' docker/Dockerfile`

**Expected:** Line containing `apk add --no-cache postgresql-client` appears in the runner stage, before `USER node`.

---

## Test 2: SQL migration files are copied into Docker image

**Steps:**
1. Run `grep 'migrations.*sql' docker/Dockerfile`

**Expected:** A COPY line copies `packages/typeorm/db/migrations/*.sql` into the image.

---

## Test 3: SKIP_MIGRATIONS guard in entrypoint

**Steps:**
1. Run `grep -A2 'SKIP_MIGRATIONS' docker/entrypoint.sh`

**Expected:** entrypoint.sh contains an `if [ "$SKIP_MIGRATIONS" != "true" ]` block wrapping migration and Hasura config steps. The indexer start command (`exec pnpm start:simple`) is OUTSIDE the guard.

---

## Test 4: Docker Compose config parses cleanly

**Steps:**
1. Create `.env.build` with `HASURA_GRAPHQL_ADMIN_SECRET=test`
2. Run `cd docker && docker compose --env-file ../.env.build config > /dev/null`

**Expected:** Exit code 0. No YAML parse errors.

---

## Test 5: Both indexer services present

**Steps:**
1. Run `cd docker && docker compose --env-file ../.env.build config --services | sort`

**Expected:** Output includes both `indexer` and `indexer-testnet` (among other services).

---

## Test 6: CHAIN_ID values correct for both services

**Steps:**
1. Run `cd docker && docker compose --env-file ../.env.build config | grep 'CHAIN_ID'`

**Expected:** Two CHAIN_ID entries: one with value `lukso` (mainnet) and one with `lukso-testnet` (testnet).

---

## Test 7: Testnet service depends on mainnet leader

**Steps:**
1. Open `docker/docker-compose.yml` and inspect `indexer-testnet.depends_on`

**Expected:** `indexer-testnet` depends on both `postgres: condition: service_healthy` and `indexer: condition: service_healthy`.

---

## Test 8: Testnet service has SKIP_MIGRATIONS=true

**Steps:**
1. Run `grep -A30 'indexer-testnet:' docker/docker-compose.yml | grep 'SKIP_MIGRATIONS'`

**Expected:** `SKIP_MIGRATIONS: "true"` appears in the testnet service environment.

---

## Test 9: Testnet env vars documented

**Steps:**
1. Run `grep -E 'RPC_URL_TESTNET|RPC_RATE_LIMIT_TESTNET|FINALITY_CONFIRMATION_TESTNET|CHAIN_ID' .env.example`

**Expected:** All four testnet-related env vars are documented with comments.

---

## Test 10: Docker image builds (requires daemon)

**Steps:**
1. Run `cd docker && docker compose --env-file ../.env.build build indexer`

**Expected:** Build completes with exit code 0. postgresql-client is installed. SQL files are present at `/app/packages/typeorm/db/migrations/`.

**Note:** This test requires Docker daemon access. In CI without daemon, verify via static Dockerfile inspection (Tests 1-2).

---

## Edge Cases

### EC1: Follower starts before leader is healthy
The `depends_on: indexer: condition: service_healthy` prevents the testnet service from starting until mainnet has passed its health check. Verify by inspecting docker-compose.yml dependency chain.

### EC2: SKIP_MIGRATIONS with no migrations to skip
When SKIP_MIGRATIONS=true, the entrypoint should log the skip message and proceed directly to `exec pnpm start:simple`. No error should occur even if no migrations exist.
