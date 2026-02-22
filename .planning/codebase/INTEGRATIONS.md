# External Integrations

**Analysis Date:** 2026-02-12

## APIs & External Services

### Blockchain Data Sources

**Subsquid Archive Gateway:**

- Purpose: Historical blockchain data (batch-processed EVM logs)
- SDK/Client: `@subsquid/evm-processor` (`EvmBatchProcessor.setGateway()`)
- Config: `packages/indexer-v2/src/app/processor.ts`
- Auth: None (public gateway)
- Default URL: `https://v2.archive.subsquid.io/network/lukso-mainnet`
- Env var: `SQD_GATEWAY`
- Usage: Provides bulk historical log data; processor catches up to chain head via gateway then switches to RPC for real-time

**LUKSO RPC Node:**

- Purpose: Live blockchain queries (supportsInterface checks, eth_call for contract reads)
- SDK/Client: `@subsquid/evm-processor` RPC endpoint + direct `context._chain.client.call()`
- Config: `packages/indexer-v2/src/app/processor.ts` via `setRpcEndpoint()`
- Auth: None (public RPC)
- Default URL: `https://rpc.lukso.sigmacore.io`
- Env var: `RPC_URL`
- Rate limit: `RPC_RATE_LIMIT` (default: 10 req/s)
- Finality: `FINALITY_CONFIRMATION` (default: 75 blocks, ~15 min)

### Metadata Resolution

**IPFS Gateway:**

- Purpose: Fetches off-chain JSON metadata (LSP3 profiles, LSP4 token metadata, LSP29 encrypted assets)
- SDK/Client: `axios` HTTP client in worker threads (`packages/indexer-v2/src/core/metadataWorker.ts`)
- Auth: None
- Default URL: `https://api.universalprofile.cloud/ipfs/`
- Env var: `IPFS_GATEWAY`
- URL rewriting: `ipfs://` prefixed URLs are rewritten to `${IPFS_GATEWAY}${hash}` in `metadataWorker.ts` `resolveUrl()`
- Also handles `data:` URIs for inline base64 JSON metadata via `data-urls` package
- Worker pool: `MetadataWorkerPool` in `packages/indexer-v2/src/core/metadataWorkerPool.ts` manages parallel fetching via `worker_threads`
- Concurrency: `METADATA_WORKER_POOL_SIZE` workers (default: 4), each pulling `WORKER_BATCH_SIZE` requests (default: 250) from shared queue
- Retry: exponential backoff with `FETCH_RETRY_COUNT` (default: 5) for retryable HTTP errors (408, 429, 5xx) and network errors (ECONNRESET, ETIMEDOUT, EPROTO)
- Timeout: `FETCH_BATCH_TIMEOUT_MS` (default: 300,000ms / 5 min) per batch

## Smart Contracts (On-Chain Reads)

**Multicall3:**

- Address: `0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869` (defined in `packages/indexer-v2/src/constants/index.ts`)
- Purpose: Batched `supportsInterface()` calls for entity verification; batched contract reads (decimals, totalSupply)
- Implementation: `packages/indexer-v2/src/core/multicall.ts` (`aggregate3StaticLatest()`)
- Uses raw `eth_call` via `context._chain.client.call('eth_call', [...])`
- Batch size: 100 addresses per multicall (configurable in `VerificationConfig`)
- 3-level error fallback: parallel all batches -> per-batch sequential -> per-address individual

**LSP0 (ERC725Account) Contracts:**

- Purpose: `supportsInterface(INTERFACE_ID_LSP0)` to verify Universal Profiles
- Implementation: `packages/indexer-v2/src/core/verification.ts`
- Interface: `INTERFACE_ID_LSP0` from `@lukso/lsp0-contracts`

**LSP7/LSP8 Digital Asset Contracts:**

- Purpose: `supportsInterface()` with multiple version IDs to verify Digital Assets
- Implementation: `packages/indexer-v2/src/core/verification.ts`
- Versions checked (in order): LSP7 current, LSP8 current, LSP7 v0.14.0, LSP8 v0.14.0, LSP7 v0.12.0, LSP8 v0.12.0
- Interface IDs from `@lukso/lsp7-contracts` and `@lukso/lsp8-contracts`

**Verification Cache (LRU):**

- Implementation: `VerificationCache` class in `packages/indexer-v2/src/core/verification.ts`
- Max size: 50,000 entries (configurable)
- Key format: `${category}:${address}` (e.g., `UniversalProfile:0xabc...`)
- 3-tier lookup: LRU cache -> DB query -> on-chain multicall

## Smart Contract Events Indexed

**Global Events (all addresses):**

| Event                                                    | Source ABI                     | Entity Created         |
| -------------------------------------------------------- | ------------------------------ | ---------------------- |
| `DataChanged(bytes32,bytes)`                             | `ERC725Y`                      | `DataChanged`          |
| `Executed(uint256,address,uint256,bytes4)`               | `LSP0ERC725Account`            | `Executed`             |
| `UniversalReceiver(address,uint256,bytes32,bytes,bytes)` | `LSP0ERC725Account`            | `UniversalReceiver`    |
| `OwnershipTransferred(address,address)`                  | `LSP14Ownable2Step`            | `OwnershipTransferred` |
| `Transfer(address,address,address,uint256,bool,bytes)`   | `LSP7DigitalAsset`             | `Transfer` (LSP7)      |
| `Transfer(address,address,address,bytes32,bool,bytes)`   | `LSP8IdentifiableDigitalAsset` | `Transfer` (LSP8)      |
| `TokenIdDataChanged(bytes32,bytes32,bytes)`              | `LSP8IdentifiableDigitalAsset` | `TokenIdDataChanged`   |

**Contract-Scoped Events:**

| Event                         | Contract Address                                     | Entity Created           |
| ----------------------------- | ---------------------------------------------------- | ------------------------ |
| `DeployedContracts(...)`      | `0x2300000A84D25dF63081feAa37ba6b62C4c89a30` (LSP23) | `DeployedContracts`      |
| `DeployedERC1167Proxies(...)` | `0x2300000A84D25dF63081feAa37ba6b62C4c89a30` (LSP23) | `DeployedERC1167Proxies` |
| `Follow(address,address)`     | `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA` (LSP26) | `Follow`                 |
| `Unfollow(address,address)`   | `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA` (LSP26) | `Unfollow`               |

**Plugin Implementations (indexer-v2):**

- `packages/indexer-v2/src/plugins/events/dataChanged.plugin.ts`
- `packages/indexer-v2/src/plugins/events/executed.plugin.ts`
- `packages/indexer-v2/src/plugins/events/universalReceiver.plugin.ts`
- `packages/indexer-v2/src/plugins/events/ownershipTransferred.plugin.ts`
- `packages/indexer-v2/src/plugins/events/lsp7Transfer.plugin.ts`
- `packages/indexer-v2/src/plugins/events/lsp8Transfer.plugin.ts`
- `packages/indexer-v2/src/plugins/events/tokenIdDataChanged.plugin.ts`
- `packages/indexer-v2/src/plugins/events/deployedContracts.plugin.ts`
- `packages/indexer-v2/src/plugins/events/deployedProxies.plugin.ts`
- `packages/indexer-v2/src/plugins/events/follow.plugin.ts`
- `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts`

## ChillWhales-Specific Contracts

Defined in `packages/indexer-v2/src/constants/chillwhales.ts`:

| Contract        | Address                                      | Purpose        |
| --------------- | -------------------------------------------- | -------------- |
| ChillWhales NFT | `0x86e817172b5c07f7036bf8aa46e2db9063743a83` | NFT collection |
| CHILL Token     | `0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14` | Fungible token |
| ORBS Token      | `0x4200690033c5Ea89c936d247876f89f40A588b4D` | Fungible token |

Custom data keys:

- `ORB_LEVEL_KEY` — `0x320b2edb97fdba80946ca674d317cb119437f62de6cdc9765386530eee6bba78`
- `ORB_FACTION_KEY` — `0xffe90f868aacc849380bc19e2906230e857a2309570013576c67c7b7f26cf1f7`

Custom handlers:

- `packages/indexer-v2/src/handlers/chillwhales/orbFaction.handler.ts`
- `packages/indexer-v2/src/handlers/chillwhales/orbLevel.handler.ts`

## Data Storage

**PostgreSQL 17 (Alpine):**

- Connection: `DB_URL` env var (format: `postgresql://user:pass@host:5432/db`)
- Client: TypeORM via `@subsquid/typeorm-store` (`TypeormDatabase` adapter)
- Schema: Auto-generated from `packages/typeorm/schema.graphql` (925 lines, 70+ entity types)
- Migrations: `@subsquid/typeorm-migration` (generate + apply)
- SQL Views: `sql/views/DataChangedLatest.sql`
- Docker resource limit: 2GB RAM, 512MB reserved
- Tuning: max_wal_size=2GB, shared_buffers=512MB, checkpoint_timeout=15min, work_mem=64MB

**Core Entity Types:**

- `UniversalProfile` — Verified LSP0 accounts
- `DigitalAsset` — Verified LSP7/LSP8 tokens
- `NFT` — Individual LSP8 token IDs
- `OwnedAsset` / `OwnedToken` — Ownership tracking
- `LSP3Profile` / `LSP4Metadata` / `LSP29EncryptedAsset` — Off-chain metadata with fetch tracking
- `LSP6Controller` / `LSP6Permission` / `LSP6AllowedCall` — Key Manager permissions
- `Follow` / `Unfollow` / `Follower` — Social graph
- `Transfer` / `Executed` / `DataChanged` — Event logs

**File Storage:**

- Local filesystem only (no cloud storage)
- Docker volumes: `postgres-data` (DB), `indexer-logs` (log files)

**Caching:**

- In-process LRU cache for address verification (`VerificationCache`, 50K entries)
- No external cache layer (no Redis)

## GraphQL API Layer (Hasura)

**Hasura GraphQL Engine v2.46.0:**

- Purpose: Auto-generates GraphQL API from PostgreSQL schema
- Config generation: `@subsquid/hasura-configuration` regenerate + apply
- Docker image: `hasura/graphql-engine:v2.46.0`
- Endpoint: `HASURA_GRAPHQL_ENDPOINT` (default: `http://hasura:8080`)
- Auth: `HASURA_GRAPHQL_ADMIN_SECRET` (required, no default)
- Public access: `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public`
- Console: `HASURA_GRAPHQL_ENABLE_CONSOLE=true`
- Dev mode: `HASURA_GRAPHQL_DEV_MODE=true`
- Log types: `startup,http-log,webhook-log,websocket-log,query-log`
- Resource limit: 1GB RAM, 256MB reserved

**Hasura Data Connector Agent v2.46.0:**

- Docker image: `hasura/graphql-data-connector:v2.46.0`
- Purpose: Required dependency for Hasura multi-database support
- Health check: `http://localhost:8081/api/v1/athena/health`
- Resource limit: 512MB RAM, 128MB reserved

## Authentication & Identity

**Auth Provider:**

- No application-level authentication
- Hasura admin secret for GraphQL admin access
- Public role for unauthenticated GraphQL queries
- No user authentication — this is a read-only data indexer

## Monitoring & Observability

**Logging (indexer-v2):**

- Dual-output logging via `packages/indexer-v2/src/core/logger.ts`:
  - Console: `@subsquid/logger` (structured, via `context.log`)
  - File: pino with daily rotation via `pino-roll` (JSON format)
- Log dir: `LOG_DIR` (default: `./logs`)
- Log level: `LOG_LEVEL` (default: `debug` dev, `info` production)
- Pipeline step tagging: `BOOTSTRAP`, `EXTRACT`, `PERSIST_RAW`, `HANDLE`, `CLEAR_SUB_ENTITIES`, `DELETE_ENTITIES`, `PERSIST_DERIVED`, `VERIFY`, `ENRICH`
- Component tagging: `worker_pool`, `metadata_fetch`
- Docker log rotation: json-file driver, max 100MB, 10 files, compressed

**Error Tracking:**

- None (no Sentry, Datadog, etc.)

**Health Checks:**

- Indexer: `pgrep -f "ts-node.*lib/app/index.js"` (30s interval, 60s start period)
- PostgreSQL: `pg_isready` (5s interval)
- Hasura: `curl -f http://localhost:8080/healthz` (5s interval)
- Data connector: `curl -f http://localhost:8081/api/v1/athena/health` (5s interval)

## CI/CD & Deployment

**GitHub Actions (`.github/workflows/ci.yml`):**

- 3 jobs: Prettier, ESLint, Build (Node 20+22 matrix)
- No automated deployment pipeline

**Docker Deployment:**

- `docker compose up -d` — starts all 4 services
- Entrypoint (`docker/v2/entrypoint.sh`):
  1. Generate DB migrations from `schema.graphql`
  2. Apply DB migrations
  3. Wait for Hasura health (up to 60s)
  4. Generate + apply Hasura metadata
  5. Start indexer via `pnpm start:simple`

## Environment Configuration

**Required env vars (for docker-compose):**

- `HASURA_GRAPHQL_ADMIN_SECRET` — Hasura admin secret (required, no default)

**Env vars with defaults (all optional):**

- `POSTGRES_USER` — PostgreSQL username (default: `postgres`)
- `POSTGRES_PASSWORD` — PostgreSQL password (default: `postgres`)
- `POSTGRES_DB` — PostgreSQL database name (default: `postgres`)
- `POSTGRES_PORT` — Exposed port (default: `5432`)
- `DB_URL` — Full connection string (constructed from above)
- `SQD_GATEWAY` — Subsquid archive URL (default: `https://v2.archive.subsquid.io/network/lukso-mainnet`)
- `RPC_URL` — LUKSO RPC endpoint (default: `https://rpc.lukso.sigmacore.io`)
- `RPC_RATE_LIMIT` — RPC requests/second (default: `10`)
- `FINALITY_CONFIRMATION` — Block finality depth (default: `75`)
- `IPFS_GATEWAY` — IPFS gateway URL (default: `https://api.universalprofile.cloud/ipfs/`)
- `FETCH_LIMIT` — Max metadata items to query per handler (default: `10000`)
- `FETCH_BATCH_SIZE` — Items per worker pool batch (default: `100`)
- `FETCH_RETRY_COUNT` — Max retries for failed metadata fetches (default: `5`)
- `FETCH_BATCH_TIMEOUT_MS` — Timeout per worker pool batch (default: `300000`)
- `WORKER_BATCH_SIZE` — Requests per worker dispatch (default: `250`)
- `METADATA_WORKER_POOL_SIZE` — Number of worker threads (default: `4`)
- `NODE_ENV` — Environment (default: `development`, set to `production` in Docker)
- `LOG_LEVEL` — Log level (default: `debug` dev, `info` production)
- `LOG_DIR` — Log file directory (default: `./logs`)
- `INDEXER_ENABLE_FILE_LOGGER` — Enable pino file logging (default: `true`)
- `HASURA_GRAPHQL_PORT` — Hasura port (default: `8080`)
- `HASURA_GRAPHQL_ENABLE_CONSOLE` — Enable Hasura console (default: `true`)
- `HASURA_GRAPHQL_DEV_MODE` — Enable dev mode (default: `true`)

**Secrets location:**

- `.env` file at repository root (gitignored via `.gitignore`)
- `.env.example` contains template with documentation
- Docker Compose interpolates env vars from host environment

## Webhooks & Callbacks

**Incoming:**

- None (indexer is a data ingestion service, not an API server)

**Outgoing:**

- None (no webhook dispatch; metadata fetching is pull-based via axios in worker threads)

---

_Integration audit: 2026-02-12_
