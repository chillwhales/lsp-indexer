# Architecture

**Analysis Date:** 2026-02-06

## Pattern Overview

**Overall:** Event-Driven Batch Processor (Subsquid EVM Indexer)

**Key Characteristics:**

- Blockchain event log scanner that processes EVM logs in batches via `@subsquid/evm-processor`
- Three-phase pipeline per batch: **Scan → Verify/Populate → Handle/Persist**
- Monorepo with three packages: `abi` (contract types), `typeorm` (schema/models), `indexer` (core logic)
- GraphQL API served by Hasura on top of PostgreSQL, auto-configured from the TypeORM schema
- Entity model maps 1:1 to LUKSO LSP standards (LSP0, LSP3, LSP4, LSP5, LSP6, LSP7, LSP8, LSP12, LSP26, LSP29) plus marketplace extensions

## Layers

**ABI Layer (`packages/abi`):**

- Purpose: Provide typed ABI definitions for all smart contracts the indexer listens to
- Location: `packages/abi/`
- Contains: Generated TypeScript ABI bindings from Solidity contract artifacts and custom JSON ABIs
- Depends on: `@subsquid/evm-abi`, `@subsquid/evm-codec`, LUKSO contract packages (`@lukso/lsp*-contracts`)
- Used by: `packages/indexer` (imports as `@chillwhales/abi`)
- Code generation: `packages/abi/scripts/codegen.sh` runs `squid-evm-typegen` on all JSON artifacts and generates `src/index.ts` barrel file

**Data Model Layer (`packages/typeorm`):**

- Purpose: Define the database schema and generate TypeORM entity classes
- Location: `packages/typeorm/`
- Contains: GraphQL schema (`schema.graphql`) that drives TypeORM entity code generation via `squid-typeorm-codegen`
- Depends on: `@subsquid/typeorm-store`, `@subsquid/typeorm-codegen`
- Used by: `packages/indexer` (imports as `@chillwhales/typeorm`)
- Code generation: `pnpm codegen` generates TypeORM entities from `schema.graphql`
- Also handles: Hasura metadata generation (`squid-hasura-configuration`) and DB migrations (`squid-typeorm-migration`)

**Indexer Core Layer (`packages/indexer`):**

- Purpose: Listen to LUKSO blockchain events, process them, and persist structured data
- Location: `packages/indexer/`
- Contains: Processor setup, event scanner, entity utilities, and post-processing handlers
- Depends on: `@chillwhales/abi`, `@chillwhales/typeorm`, `@subsquid/evm-processor`, `viem`, `axios`
- Used by: Runtime entry point; no downstream packages

**Infrastructure Layer:**

- Purpose: Deployment and data serving
- Location: Root-level `docker-compose.yaml`, `Dockerfile`, `start.sh`
- Contains: PostgreSQL database, Hasura GraphQL Engine, data-connector-agent
- Hasura auto-exposes TypeORM entities as a GraphQL API with `public` unauthorized role

## Data Flow

**Batch Processing Pipeline (per block batch):**

1. **Processor Setup** (`packages/indexer/src/app/processor.ts`): `EvmBatchProcessor` subscribes to event topics from ERC725X, ERC725Y, LSP0, LSP7, LSP8, LSP14, LSP23, LSP26, and marketplace extension contracts. Connects to Subsquid gateway + LUKSO RPC.

2. **Log Scanning** (`packages/indexer/src/app/scanner.ts` → `scanLogs()`): Iterates all logs in the batch. Decodes each log by matching `log.topics[0]` against known event signatures. For `DataChanged` events, further routes by `dataKey` to extract standardized ERC725Y data key entities (LSP3 through LSP29). Collects sets of addresses for UniversalProfiles, DigitalAssets, and NFTs.

3. **Entity Verification** (`packages/indexer/src/utils/entityVerification.ts` → `verifyEntities()`): For each address set, checks if entities already exist in the DB. For unknown addresses, uses `Multicall3.aggregate3Static` to call `supportsInterface()` on-chain and verify LSP0/LSP7/LSP8 support. Produces `new`, `valid`, and `invalid` maps.

4. **Entity Population** (`packages/indexer/src/utils/entityPopulation.ts` → `populateEntities()`): Associates each extracted entity with its verified parent (e.g., a `DataChanged` event gets linked to its `UniversalProfile` or `DigitalAsset`). Filters out entities whose parent addresses are invalid.

5. **Persistence** (`packages/indexer/src/app/index.ts`): Upserts new core entities (UniversalProfile, DigitalAsset, NFT), then inserts event entities and upserts data key entities in parallel via `context.store`.

6. **Post-Processing Handlers** (`packages/indexer/src/app/handlers/`): Run sequentially after persistence to compute derived data:
   - `permissionsUpdateHandler`: Resolves individual permission/allowed-call sub-entities
   - `removeEmptyEntities`: Cleans null-valued array items from LSP4/LSP5/LSP12
   - `decimalsHandler`: Fetches `decimals()` for new DigitalAssets
   - `totalSupplyHandler`: Computes total supply from mint/burn transfers
   - `ownedAssetsHandler`: Maintains `OwnedAsset` and `OwnedToken` balance tables
   - `followerSystemHandler`: Manages Follow/Unfollow identity entities
   - `lsp3ProfileHandler`: Fetches JSON metadata from IPFS/URLs for profiles
   - `lsp4MetadataHandler`: Fetches JSON metadata for digital assets
   - `lsp29EncryptedAssetHandler`: Fetches encrypted asset metadata
   - `orbsLevelHandler`, `orbsClaimedHandler`, `chillClaimedHandler`: Chillwhales-specific NFT properties
   - `ownershipTransferredHandler`: Updates owner tracking entities
   - `marketplaceHandler`: Maintains Listing aggregate entities from marketplace events

**Metadata Fetching (deferred, head-only):**

When `context.isHead` is true (indexer is caught up to chain tip), handlers like `lsp3ProfileHandler` and `lsp4MetadataHandler` query the DB for unfetched metadata entities, fetch JSON from IPFS/HTTP URLs in configurable batches (`FETCH_BATCH_SIZE`, `FETCH_LIMIT`), and persist parsed sub-entities (e.g., `LSP3ProfileName`, `LSP3ProfileImage`, `LSP4MetadataAttribute`). Retry logic respects `FETCH_RETRY_COUNT` for transient HTTP errors.

**State Management:**

- All state is in PostgreSQL, accessed via `context.store` (Subsquid's TypeORM store adapter)
- In-memory Maps are used within a single batch for deduplication and cross-referencing, then discarded
- No external cache or message queue

## Key Abstractions

**Extract/Populate Pattern:**

- Purpose: Every event type follows a two-step pattern: `extract()` creates a bare entity from log data, `populate()` links it to verified parent entities
- Examples: `packages/indexer/src/utils/dataChanged/index.ts` (extract + populate for DataChanged), `packages/indexer/src/utils/dataChanged/lsp3Profile.ts` (extract + populate + extractSubEntities for LSP3Profile)
- Pattern: Each utility module in `src/utils/` exports `extract(params: ExtractParams)` and `populate({ entities, validParents })`. Some also export `extractSubEntities()` (async JSON fetching) and `clearSubEntities()` (cleanup before re-fetch).

**Entity Verification:**

- Purpose: Determine if a blockchain address is a valid UniversalProfile, DigitalAsset, or NFT before linking events to it
- Examples: `packages/indexer/src/utils/universalProfile.ts`, `packages/indexer/src/utils/digitalAsset.ts`, `packages/indexer/src/utils/nft.ts`
- Pattern: `verify({ context, addresses })` → uses Multicall3 batched `supportsInterface()` calls → returns `{ new, valid, invalid }` Maps

**Handler Pattern:**

- Purpose: Post-processing functions that derive aggregate/computed entities from raw event data
- Examples: `packages/indexer/src/app/handlers/totalSupplyHandler.ts`, `packages/indexer/src/app/handlers/ownedAssetsHandler.ts`, `packages/indexer/src/app/handlers/marketplaceHandler.ts`
- Pattern: `async function handler({ context, populatedEntities, ... })` → queries existing DB state → merges with new data → upserts/removes

**TypeORM Entity Generation:**

- Purpose: Single-source-of-truth schema defined in GraphQL, auto-generated into TypeORM entities
- Examples: `packages/typeorm/schema.graphql` defines ~80+ entity types → generated to `packages/typeorm/src/model/generated/`
- Pattern: `schema.graphql` → `squid-typeorm-codegen` → TypeScript entity classes. Never edit generated code; edit `schema.graphql` then regenerate.

## Entry Points

**Indexer Runtime:**

- Location: `packages/indexer/src/app/index.ts` (compiled: `packages/indexer/lib/app/index.js`)
- Triggers: `pnpm start` from root (runs via `ts-node` + `tsconfig-paths`)
- Responsibilities: Initializes `EvmBatchProcessor`, registers the main batch handler callback, starts continuous block processing

**Startup Script:**

- Location: `start.sh`
- Triggers: Docker container CMD
- Responsibilities: Runs migrations, configures Hasura, then starts the indexer

**Processor Configuration:**

- Location: `packages/indexer/src/app/processor.ts`
- Triggers: Imported by `index.ts`
- Responsibilities: Configures which event topics and contract addresses to subscribe to, RPC endpoint, gateway, finality confirmation

## Error Handling

**Strategy:** Defensive with retry for transient failures; log-and-continue for data issues

**Patterns:**

- **Multicall verification**: Triple-fallback — batch all → batch individually on failure → single calls per address. Silent catch on irrecoverable failures (address treated as invalid)
- **Metadata fetching**: Track `fetchErrorMessage`, `fetchErrorCode`, `fetchErrorStatus`, and `retryCount` on entities. Retryable HTTP errors (408, 429, 5xx, ETIMEDOUT, ECONNRESET) are retried up to `FETCH_RETRY_COUNT` times. Non-retryable errors permanently mark the entity.
- **Event decoding**: No explicit try/catch around `decode()`; if an event can't be decoded, the process crashes (by design — indicates ABI mismatch)
- **Data URL parsing**: Returns structured error objects with `fetchErrorMessage` rather than throwing
- **VerifiableURI decoding** (`decodeVerifiableUri` in `packages/indexer/src/utils/index.ts`): Returns `{ value: null, decodeError: string }` on failure; does not throw

## Cross-Cutting Concerns

**Logging:**

- Uses `context.log.info()` (Subsquid logger) with JSON-stringified structured messages
- Pattern: `context.log.info(JSON.stringify({ message: "...", entityCount: N }))`
- No external logging service; stdout-based

**Validation:**

- On-chain interface verification via `supportsInterface()` + Multicall3 for UniversalProfiles and DigitalAssets
- Data key routing by exact match or prefix match in the scanner's `switch/if` chain
- URL validation: checks for non-printable characters in decoded VerifiableURIs
- No input validation middleware (not an API server)

**Authentication:**

- Not applicable for the indexer itself (reads public blockchain data)
- Hasura has `HASURA_GRAPHQL_ADMIN_SECRET` for admin access and `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public` for public queries

**ID Generation:**

- Most event entities use `uuid v4` for unique IDs
- Core entities (UniversalProfile, DigitalAsset) use the blockchain address as ID
- Data key entities use the address as ID (single latest value per address)
- Composite entities (OwnedAsset, OwnedToken, Follow) use deterministic composite IDs like `${owner} - ${address}`
- Marketplace listings use deterministic `${address}-${listingId}` IDs

---

_Architecture analysis: 2026-02-06_
