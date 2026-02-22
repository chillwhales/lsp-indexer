# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
lsp-indexer/
├── packages/
│   ├── abi/                          # Smart contract ABI type bindings
│   │   ├── custom/                   # Custom JSON ABI files (Multicall3, ORBS, CHILL)
│   │   ├── scripts/                  # Code generation script (codegen.sh)
│   │   ├── src/abi/                  # Generated TS ABI bindings — DO NOT EDIT
│   │   ├── lib/                      # Compiled JS output
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── indexer/                      # V1 blockchain indexer (LEGACY)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── index.ts          # V1 main entry (monolithic pipeline)
│   │   │   │   ├── processor.ts      # V1 processor config
│   │   │   │   ├── scanner.ts        # V1 event log parsing
│   │   │   │   └── handlers/         # V1 post-processing handlers
│   │   │   ├── constants/            # Shared constants
│   │   │   ├── types/                # V1 type definitions
│   │   │   └── utils/                # V1 extract/populate utilities
│   │   │       ├── dataChanged/      # One file per ERC725Y data key
│   │   │       ├── transfer/         # Transfer + OwnedAsset/OwnedToken
│   │   │       ├── executed/         # Executed event
│   │   │       ├── follow/           # Follow event
│   │   │       ├── unfollow/         # Unfollow event
│   │   │       ├── universalReceiver/ # UniversalReceiver event
│   │   │       ├── ownershipTransferred/
│   │   │       ├── tokenIdDataChanged/
│   │   │       ├── marketplace/      # Marketplace events
│   │   │       ├── orbsClaimed/      # ORBS claimed tracking
│   │   │       └── chillClaimed/     # CHILL claimed tracking
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── indexer-v2/                   # V2 blockchain indexer (ACTIVE)
│   │   ├── src/
│   │   │   ├── app/                  # Application bootstrap and entry
│   │   │   │   ├── index.ts          # V2 main entry (pipeline runner)
│   │   │   │   ├── bootstrap.ts      # Registry creation + plugin/handler discovery
│   │   │   │   ├── config.ts         # PipelineConfig assembly
│   │   │   │   └── processor.ts      # EvmBatchProcessor configuration
│   │   │   ├── core/                 # Core pipeline framework
│   │   │   │   ├── pipeline.ts       # 6-step enrichment queue pipeline
│   │   │   │   ├── registry.ts       # PluginRegistry (discovery + routing)
│   │   │   │   ├── batchContext.ts    # BatchContext (shared entity bag)
│   │   │   │   ├── verification.ts   # Address verification + LRU cache
│   │   │   │   ├── multicall.ts      # Multicall3 batched RPC calls
│   │   │   │   ├── metadataWorkerPool.ts # Queue-based worker pool manager
│   │   │   │   ├── metadataWorker.ts # Worker thread (IPFS/HTTP fetch)
│   │   │   │   ├── handlerHelpers.ts # Entity merge utilities
│   │   │   │   ├── logger.ts         # Dual-output structured logging
│   │   │   │   ├── index.ts          # Barrel export
│   │   │   │   ├── types/            # Core type system
│   │   │   │   │   ├── handler.ts    # EntityHandler interface
│   │   │   │   │   ├── plugins.ts    # EventPlugin + IPluginRegistry interfaces
│   │   │   │   │   ├── batchContext.ts # IBatchContext + queue types
│   │   │   │   │   ├── entity.ts     # Entity, FKFields<T>, WritableFields<T>
│   │   │   │   │   ├── metadata.ts   # FetchRequest, FetchResult, IMetadataWorkerPool
│   │   │   │   │   ├── verification.ts # EntityCategory, VerificationResult, EnrichmentRequest
│   │   │   │   │   ├── subsquid.ts   # Subsquid type re-exports
│   │   │   │   │   └── index.ts      # Barrel export
│   │   │   │   └── __tests__/        # Core unit tests
│   │   │   │       ├── pipeline.test.ts
│   │   │   │       ├── batchContext.test.ts
│   │   │   │       ├── metadataWorkerPool.test.ts
│   │   │   │       └── logger.test.ts
│   │   │   ├── plugins/events/       # EventPlugin implementations (1 file per event)
│   │   │   │   ├── dataChanged.plugin.ts
│   │   │   │   ├── executed.plugin.ts
│   │   │   │   ├── lsp7Transfer.plugin.ts
│   │   │   │   ├── lsp8Transfer.plugin.ts
│   │   │   │   ├── follow.plugin.ts
│   │   │   │   ├── unfollow.plugin.ts
│   │   │   │   ├── universalReceiver.plugin.ts
│   │   │   │   ├── ownershipTransferred.plugin.ts
│   │   │   │   ├── tokenIdDataChanged.plugin.ts
│   │   │   │   ├── deployedContracts.plugin.ts
│   │   │   │   └── deployedProxies.plugin.ts
│   │   │   ├── handlers/             # EntityHandler implementations (1 file per handler)
│   │   │   │   ├── totalSupply.handler.ts
│   │   │   │   ├── ownedAssets.handler.ts
│   │   │   │   ├── decimals.handler.ts
│   │   │   │   ├── follower.handler.ts
│   │   │   │   ├── nft.handler.ts
│   │   │   │   ├── formattedTokenId.handler.ts
│   │   │   │   ├── lsp3Profile.handler.ts
│   │   │   │   ├── lsp3ProfileFetch.handler.ts
│   │   │   │   ├── lsp4Metadata.handler.ts
│   │   │   │   ├── lsp4MetadataFetch.handler.ts
│   │   │   │   ├── lsp4TokenName.handler.ts
│   │   │   │   ├── lsp4TokenSymbol.handler.ts
│   │   │   │   ├── lsp4TokenType.handler.ts
│   │   │   │   ├── lsp4Creators.handler.ts
│   │   │   │   ├── lsp5ReceivedAssets.handler.ts
│   │   │   │   ├── lsp6Controllers.handler.ts
│   │   │   │   ├── lsp8TokenIdFormat.handler.ts
│   │   │   │   ├── lsp8ReferenceContract.handler.ts
│   │   │   │   ├── lsp8MetadataBaseURI.handler.ts
│   │   │   │   ├── lsp12IssuedAssets.handler.ts
│   │   │   │   ├── lsp29EncryptedAsset.handler.ts
│   │   │   │   ├── lsp29EncryptedAssetFetch.handler.ts
│   │   │   │   ├── chillwhales/
│   │   │   │   │   ├── orbFaction.handler.ts
│   │   │   │   │   └── orbLevel.handler.ts
│   │   │   │   └── __tests__/        # Handler unit tests
│   │   │   │       ├── totalSupply.handler.test.ts
│   │   │   │       ├── ownedAssets.handler.test.ts
│   │   │   │       ├── follower.handler.test.ts
│   │   │   │       ├── lsp3ProfileFetch.handler.test.ts
│   │   │   │       ├── lsp4MetadataFetch.handler.test.ts
│   │   │   │       ├── lsp29EncryptedAssetFetch.handler.test.ts
│   │   │   │       └── lsp6Controllers.handler.test.ts
│   │   │   ├── constants/            # Configuration constants
│   │   │   │   ├── index.ts          # Env vars, addresses, gateway URLs, pool sizes
│   │   │   │   ├── lsp29.ts          # LSP29 data keys
│   │   │   │   └── chillwhales.ts    # Chillwhales-specific constants
│   │   │   ├── utils/                # Shared utility functions
│   │   │   │   ├── index.ts          # Decode helpers, type guards, ID generators
│   │   │   │   └── metadataFetch.ts  # Shared metadata fetch utility
│   │   │   └── model.ts              # Re-exports @chillwhales/typeorm
│   │   ├── test/                     # Integration tests
│   │   │   ├── fixtures/blocks/      # JSON block fixtures
│   │   │   │   ├── multi-event.json
│   │   │   │   ├── transfer-lsp7.json
│   │   │   │   └── transfer-lsp8.json
│   │   │   └── integration/
│   │   │       └── pipeline.test.ts
│   │   ├── logs/                     # Runtime log output (gitignored)
│   │   ├── vitest.config.ts          # Test configuration
│   │   ├── vitest.setup.ts           # Test setup
│   │   ├── tsconfig.json             # TypeScript config with @/ path alias
│   │   ├── tsconfig.eslint.json      # ESLint-specific TS config
│   │   ├── package.json
│   │   └── lib/                      # Compiled JS output
│   └── typeorm/                      # Database schema and entity generation
│       ├── schema.graphql            # SOURCE OF TRUTH for entity types (~80+ entities)
│       ├── src/model/generated/      # Generated TypeORM entities — DO NOT EDIT
│       ├── db/migrations/            # TypeORM migrations
│       ├── lib/                      # Compiled JS output
│       └── package.json
├── docker/
│   ├── v1/                           # V1 Docker config
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── v2/                           # V2 Docker config (ACTIVE)
│       ├── Dockerfile                # Multi-stage build (deps → build → runtime)
│       └── docker-compose.yml        # postgres + indexer-v2 + hasura + data-connector
├── docs/                             # Documentation
├── sql/views/                        # SQL view definitions
├── scripts/                          # Build/utility scripts
├── .github/                          # GitHub templates and CI
│   ├── workflows/ci.yml              # CI pipeline
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE/
├── .planning/                        # Planning documents
│   ├── codebase/                     # Codebase analysis (this file)
│   ├── phases/                       # Implementation phase plans
│   └── research/                     # Research notes
├── docker-compose.yml                # Root-level Docker Compose
├── package.json                      # Root workspace scripts
├── pnpm-workspace.yaml               # Workspace: packages/*
├── pnpm-lock.yaml
├── tsconfig.json                     # Root TypeScript config
├── eslint.config.ts                  # ESLint flat config
├── .prettierrc                       # Prettier config
├── .prettierignore
├── .env.example                      # Environment variable template
└── README.md
```

## Directory Purposes

**`packages/indexer-v2/src/core/` — Pipeline Framework:**

- Purpose: The core engine powering the V2 indexer
- Contains: Pipeline orchestrator, registry, batch context, verification, worker pool, logging
- Key files: `pipeline.ts` (529 lines — the main 6-step pipeline), `registry.ts` (368 lines — plugin/handler discovery)

**`packages/indexer-v2/src/plugins/events/` — Event Plugins:**

- Purpose: One file per blockchain event type; auto-discovered by `PluginRegistry`
- Contains: 11 plugin files, each implementing `EventPlugin` interface
- Pattern: Export default object with `name`, `topic0`, `extract()` method
- Discovery: Files matching `*.plugin.js` are loaded at runtime

**`packages/indexer-v2/src/handlers/` — Entity Handlers:**

- Purpose: One file per derived entity creation concern; auto-discovered by `PluginRegistry`
- Contains: 22+ handler files, each implementing `EntityHandler` interface
- Pattern: Export default object with `name`, `listensToBag[]`, `handle()` method
- Discovery: Files matching `*.handler.js` are loaded at runtime
- Subdirectory: `chillwhales/` for project-specific handlers

**`packages/indexer-v2/src/app/` — Application Bootstrap:**

- Purpose: Entry point, processor setup, registry creation, pipeline config assembly
- Contains: 4 files composing the application startup sequence
- Key files: `index.ts` (entry), `bootstrap.ts` (registry creation), `config.ts` (pipeline config), `processor.ts` (Subsquid processor)

**`packages/indexer-v2/src/core/types/` — Type System:**

- Purpose: All interface and type definitions for the plugin architecture
- Contains: 7 type modules with barrel export
- Key types: `EventPlugin`, `EntityHandler`, `IBatchContext`, `Entity`, `FKFields<T>`, `WritableFields<T>`, `EnrichmentRequest<T>`

**`packages/typeorm/` — Database Schema:**

- Purpose: Single source of truth for the database schema
- Contains: `schema.graphql` → generated TypeORM entity classes
- 80+ entity types covering: events, data keys, profiles, assets, permissions, followers, marketplace

## Key File Locations

**Entry Points:**

- `packages/indexer-v2/src/app/index.ts`: V2 main entry (active)
- `packages/indexer/src/app/index.ts`: V1 main entry (legacy)

**Configuration:**

- `packages/indexer-v2/src/constants/index.ts`: All env-var configuration with defaults
- `packages/indexer-v2/src/app/processor.ts`: Subsquid processor setup
- `packages/indexer-v2/tsconfig.json`: TypeScript config with `@/` path alias
- `packages/indexer-v2/vitest.config.ts`: Test framework configuration
- `packages/typeorm/schema.graphql`: Database schema (source of truth)
- `.env.example`: All supported environment variables

**Core Logic:**

- `packages/indexer-v2/src/core/pipeline.ts`: 6-step enrichment pipeline (529 lines)
- `packages/indexer-v2/src/core/registry.ts`: Plugin discovery and routing (368 lines)
- `packages/indexer-v2/src/core/batchContext.ts`: Batch entity storage (232 lines)
- `packages/indexer-v2/src/core/verification.ts`: Address verification + LRU cache (451 lines)
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`: Worker pool manager (577 lines)
- `packages/indexer-v2/src/core/metadataWorker.ts`: Worker thread (181 lines)
- `packages/indexer-v2/src/utils/metadataFetch.ts`: Shared metadata fetch utility (391 lines)

**Testing:**

- `packages/indexer-v2/src/core/__tests__/`: Core unit tests (pipeline, batchContext, workerPool, logger)
- `packages/indexer-v2/src/handlers/__tests__/`: Handler unit tests (7 test files)
- `packages/indexer-v2/test/integration/`: Integration tests
- `packages/indexer-v2/test/fixtures/`: JSON block fixtures for tests

**Docker:**

- `docker/v2/Dockerfile`: Multi-stage build for V2 indexer
- `docker/v2/docker-compose.yml`: Full stack (postgres + indexer-v2 + hasura + data-connector)

## Naming Conventions

**Files:**

- Plugins: `{eventName}.plugin.ts` — e.g., `lsp7Transfer.plugin.ts`, `dataChanged.plugin.ts`
- Handlers: `{concern}.handler.ts` — e.g., `totalSupply.handler.ts`, `lsp4TokenName.handler.ts`
- Tests: `{module}.test.ts` — co-located in `__tests__/` directories
- Core modules: `camelCase.ts` — e.g., `batchContext.ts`, `metadataWorkerPool.ts`
- Type modules: `camelCase.ts` in `types/` — e.g., `handler.ts`, `plugins.ts`

**Directories:**

- `camelCase` for all source directories
- `__tests__/` for test directories (co-located with source)
- `chillwhales/` subdirectory for project-specific handlers

**Exports:**

- Plugins: `export default {PluginName}Plugin` — e.g., `export default LSP7TransferPlugin`
- Handlers: `export default {HandlerName}Handler` — e.g., `export default TotalSupplyHandler`
- Types: Named exports via barrel files

## Where to Add New Code

**New Blockchain Event:**

1. Add ABI JSON to `packages/abi/custom/` if needed
2. Rebuild ABI: `pnpm --filter=@chillwhales/abi build`
3. Add entity to `packages/typeorm/schema.graphql`
4. Rebuild typeorm: `pnpm --filter=@chillwhales/typeorm build`
5. Create `packages/indexer-v2/src/plugins/events/{eventName}.plugin.ts`
   - Implement `EventPlugin` interface
   - Export as default
   - Auto-discovered by registry — no wiring needed

**New Derived Entity (Handler):**

1. Add entity to `packages/typeorm/schema.graphql` if needed
2. Create `packages/indexer-v2/src/handlers/{concern}.handler.ts`
   - Implement `EntityHandler` interface
   - Set `listensToBag` to subscribe to event types
   - Set `dependsOn` if ordering matters
   - Export as default
   - Auto-discovered by registry — no wiring needed

**New Metadata Fetch Handler:**

1. Create handler at `packages/indexer-v2/src/handlers/{lspX}Fetch.handler.ts`
2. Use `handleMetadataFetch()` from `packages/indexer-v2/src/utils/metadataFetch.ts`
3. Implement `parseAndAddSubEntities()` callback for JSON parsing

**New Test:**

- Unit tests: `packages/indexer-v2/src/{module}/__tests__/{name}.test.ts`
- Integration tests: `packages/indexer-v2/test/integration/{name}.test.ts`
- Fixtures: `packages/indexer-v2/test/fixtures/`

**Utilities/Helpers:**

- Shared decode/type-guard helpers: `packages/indexer-v2/src/utils/index.ts`
- Entity merge helpers: `packages/indexer-v2/src/core/handlerHelpers.ts`

## Special Directories

**`packages/abi/src/` and `packages/abi/lib/`:**

- Generated: Yes (by `scripts/codegen.sh` via `squid-evm-typegen` and `tsc`)
- Committed: No — gitignored. Must run `pnpm --filter=@chillwhales/abi build` after clone

**`packages/typeorm/src/model/generated/`:**

- Generated: Yes (by `squid-typeorm-codegen` from `schema.graphql`)
- Committed: No — gitignored. Must run `pnpm --filter=@chillwhales/typeorm build` after clone
- NEVER edit manually — edit `schema.graphql` then regenerate

**`packages/*/lib/`:**

- Generated: Yes (by `tsc`)
- Committed: No — `lib/` is gitignored across all packages. Must build before runtime

**`packages/indexer-v2/logs/`:**

- Generated: Yes (runtime log output)
- Committed: No (gitignored)

**`packages/indexer-v2/test/fixtures/`:**

- Generated: No (manually created test data)
- Committed: Yes

---

_Structure analysis: 2026-02-12_
