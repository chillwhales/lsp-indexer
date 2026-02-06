# External Integrations

**Analysis Date:** 2026-02-06

## APIs & External Services

**Blockchain Data (LUKSO L1):**

- Subsquid Archive Gateway - Historical blockchain data source

  - SDK/Client: `@subsquid/evm-processor` (`EvmBatchProcessor`)
  - Config: `packages/indexer/src/app/processor.ts` via `setGateway()`
  - Auth: None (public gateway)
  - Default URL: `https://v2.archive.subsquid.io/network/lukso-mainnet`
  - Env var: `SQD_GATEWAY`

- LUKSO RPC Node - Live blockchain queries (supportsInterface checks, eth_call, eth_blockNumber)
  - SDK/Client: `@subsquid/evm-processor` RPC endpoint + direct `context._chain.client.call()`
  - Config: `packages/indexer/src/app/processor.ts` via `setRpcEndpoint()`
  - Auth: None (public RPC)
  - Default URL: `https://rpc.lukso.sigmacore.io`
  - Env var: `RPC_URL`
  - Rate limit: Configurable via `RPC_RATE_LIMIT` (default: 10 req/s)

**IPFS / Metadata Resolution:**

- IPFS Gateway - Fetches off-chain JSON metadata (LSP3 profiles, LSP4 token metadata, LSP29 encrypted assets)
  - SDK/Client: `axios` HTTP client (`packages/indexer/src/utils/index.ts` → `getDataFromURL()`)
  - Auth: None
  - Default URL: `https://api.universalprofile.cloud/ipfs/`
  - Env var: `IPFS_GATEWAY`
  - Usage: `ipfs://` prefixed URLs are rewritten to gateway URLs via `parseIpfsUrl()`
  - Also handles `data:` URIs for inline base64 JSON metadata via `data-urls` package

**Smart Contracts Interacted With (on-chain reads):**

- Multicall3 at `0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869` - Batched `supportsInterface` calls for entity verification
  - Used in: `packages/indexer/src/utils/multicall3.ts`
  - Two modes: historical block queries (`aggregate3Static`) and latest state queries (`aggregate3StaticLatest`)
- LSP0 (ERC725Account) contracts - `supportsInterface` checks to verify Universal Profiles
  - Used in: `packages/indexer/src/utils/universalProfile.ts`
- LSP7/LSP8 contracts - `supportsInterface` checks to verify Digital Assets (multiple version interface IDs)
  - Used in: `packages/indexer/src/utils/digitalAsset.ts`

**Smart Contract Events Indexed (log subscriptions):**

- ERC725X `Executed` - Transaction execution events from Universal Profiles
- ERC725Y `DataChanged` - ERC725Y data key updates (LSP3-LSP12, LSP29 data keys)
- LSP0 `UniversalReceiver` - Universal receiver notifications
- LSP7 `Transfer` - Fungible token transfers
- LSP8 `Transfer` - NFT transfers
- LSP8 `TokenIdDataChanged` - Per-token metadata changes
- LSP14 `OwnershipTransferred` - Ownership change events
- LSP23 `DeployedContracts` / `DeployedERC1167Proxies` - Contract deployment events (from address `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`, block 1143651+)
- LSP26 `Follow` / `Unfollow` - Social graph events (from address `0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA`, block 3179471+)
- Marketplace events: `ListingCreated`, `ListingClosed`, `ListingPaused`, `ListingUnpaused`, `ListingPriceUpdated`, `TokensWithdrawn`, `PurchaseCompleted`, `PlatformProceedsWithdrawn`, `SellerProceedsWithdrawn`
  - Custom ABI definitions: `packages/abi/custom/extensions/*.json`

**ChillWhales-Specific Contracts:**

- ChillWhales NFT: `0x86e817172b5c07f7036bf8aa46e2db9063743a83` (`packages/indexer/src/constants/chillwhales.ts`)
- CHILL Token: `0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14`
- ORBS Token: `0x4200690033c5Ea89c936d247876f89f40A588b4D`
- Custom ABIs: `packages/abi/custom/CHILL.json`, `packages/abi/custom/ORBS.json`, `packages/abi/custom/Multicall3.json`

## Data Storage

**Databases:**

- PostgreSQL 17 (Alpine)
  - Connection: `DB_URL` env var (format: `postgresql://user:pass@host:5432/db`)
  - Client: TypeORM via `@subsquid/typeorm-store` (`TypeormDatabase` adapter)
  - Schema: Auto-generated from `packages/typeorm/schema.graphql` (1153 lines, 70+ entity types)
  - Migrations: `@subsquid/typeorm-migration` (generate + apply via `start.sh`)
  - SQL Views: 3 custom views in `sql-views/`:
    - `sql-views/DataChangedLatest.sql` - Latest value per data key per address
    - `sql-views/FollowedSellersListings.sql` - Active listings from followed sellers
    - `sql-views/TopSellingContentBySeller.sql` - Marketplace analytics aggregation

**File Storage:**

- Local filesystem only (no cloud storage)
- PostgreSQL volume: `${POSTGRES_VOLUME_PATH-/mnt/lsp-indexer/postgres}` (configurable via `docker-compose.yaml`)

**Caching:**

- None (no Redis or in-memory cache layer)
- Subsquid processor maintains its own internal state for chain head tracking

## GraphQL API Layer

**Hasura GraphQL Engine v2.46.0:**

- Purpose: Auto-generates GraphQL API from PostgreSQL schema
- Config: `@subsquid/hasura-configuration` generates and applies metadata
- Endpoint: `HASURA_GRAPHQL_ENDPOINT` (default: `http://hasura:8080`)
- Auth: `HASURA_GRAPHQL_ADMIN_SECRET` for admin access
- Public access: `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public` (unauthenticated queries allowed)
- Console: `HASURA_GRAPHQL_ENABLE_CONSOLE=true` (enabled in dev)
- Data connector agent: `hasura/graphql-data-connector:v2.46.0` for multi-database support

## Authentication & Identity

**Auth Provider:**

- No application-level authentication
- Hasura admin secret for GraphQL admin access
- Public role for unauthenticated GraphQL queries
- No user authentication - this is a read-only data indexer

## Monitoring & Observability

**Error Tracking:**

- None (no Sentry, Datadog, etc.)

**Logs:**

- Structured JSON logging via Subsquid `context.log.info()` throughout handlers
- Pattern: `context.log.info(JSON.stringify({ message: "...", count: N }))`
- Hasura log types: startup, http-log, webhook-log, websocket-log, query-log
- No external log aggregation configured

## CI/CD & Deployment

**Hosting:**

- Docker-based deployment via `docker-compose.yaml`
- Single-stage Dockerfile builds all packages
- Startup sequence in `start.sh`: migration:generate → migration:apply → hasura:generate → hasura:apply → pnpm start

**CI Pipeline:**

- No CI/CD pipeline configured (no GitHub Actions workflows found)
- GitHub templates present for issues and PRs (`.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE/`)

## Environment Configuration

**Required env vars (for docker-compose):**

- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name
- `DB_URL` - Full PostgreSQL connection string
- `RPC_URL` - LUKSO RPC endpoint
- `HASURA_GRAPHQL_ENDPOINT` - Hasura GraphQL endpoint
- `HASURA_GRAPHQL_ADMIN_SECRET` - Hasura admin secret

**Optional env vars:**

- `SQD_GATEWAY` - Subsquid archive URL (has default)
- `RPC_RATE_LIMIT` - RPC request rate (has default: 10)
- `FINALITY_CONFIRMATION` - Block finality depth (has default: 75)
- `IPFS_GATEWAY` - IPFS gateway URL (has default)
- `FETCH_LIMIT` - Metadata fetch limit (has default: 10,000)
- `FETCH_BATCH_SIZE` - Metadata fetch batch size (has default: 1,000)
- `FETCH_RETRY_COUNT` - Metadata fetch retries (has default: 5)
- `POSTGRES_VOLUME_PATH` - PostgreSQL data volume path (has default: `/mnt/lsp-indexer/postgres`)

**Secrets location:**

- `.env` file (gitignored)
- `.env.example` contains template with placeholder values
- Docker Compose passes env vars from host environment

## Webhooks & Callbacks

**Incoming:**

- None (indexer is a data ingestion service, not an API server)

**Outgoing:**

- None (no webhook dispatch; metadata fetching is pull-based via axios)

---

_Integration audit: 2026-02-06_
