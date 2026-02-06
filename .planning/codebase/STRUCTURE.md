# Codebase Structure

**Analysis Date:** 2026-02-06

## Directory Layout

```
lsp-indexer/
├── packages/
│   ├── abi/                    # Smart contract ABI type bindings
│   │   ├── custom/             # Custom JSON ABI files (Multicall3, ORBS, CHILL, marketplace extensions)
│   │   │   └── extensions/     # Marketplace extension ABIs (ListingManager, PurchaseManager, etc.)
│   │   ├── scripts/            # Code generation script (codegen.sh)
│   │   ├── src/                # Generated (by codegen): TS ABI bindings — DO NOT EDIT
│   │   │   └── abi/            # One .ts file per contract ABI
│   │   ├── lib/                # Compiled JS output
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── indexer/                # Core blockchain event indexer
│   │   ├── src/
│   │   │   ├── app/            # Application entry point and orchestration
│   │   │   │   ├── index.ts    # Main entry — processor.run() callback
│   │   │   │   ├── processor.ts # EvmBatchProcessor configuration
│   │   │   │   ├── scanner.ts  # scanLogs() — event log parsing and entity extraction
│   │   │   │   └── handlers/   # Post-processing handlers (one per concern)
│   │   │   │       └── index.ts # Barrel export for all handlers
│   │   │   ├── constants/      # Configuration constants and data key definitions
│   │   │   │   ├── index.ts    # Env vars, addresses, gateway URLs
│   │   │   │   ├── lsp29.ts    # LSP29 encrypted asset data keys
│   │   │   │   └── chillwhales.ts # Chillwhales-specific constants
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   │   └── index.ts    # Processor, Context, Block, ExtractParams types
│   │   │   ├── utils/          # Utility functions organized by event/data key type
│   │   │   │   ├── index.ts    # Barrel + shared helpers (parseIpfsUrl, decodeVerifiableUri, etc.)
│   │   │   │   ├── entityVerification.ts  # verifyEntities orchestrator
│   │   │   │   ├── entityPopulation.ts    # populateEntities orchestrator
│   │   │   │   ├── universalProfile.ts    # UP verification via supportsInterface
│   │   │   │   ├── digitalAsset.ts        # DA verification via supportsInterface
│   │   │   │   ├── nft.ts                 # NFT verification
│   │   │   │   ├── multicall3.ts          # Multicall3 batched RPC calls
│   │   │   │   ├── lsp4MetadataBaseUri.ts # LSP8 base URI metadata extraction
│   │   │   │   ├── dataChanged/           # DataChanged event utilities (one file per data key)
│   │   │   │   ├── executed/              # Executed event extract/populate
│   │   │   │   ├── transfer/              # Transfer event + OwnedAsset/OwnedToken
│   │   │   │   ├── tokenIdDataChanged/    # TokenIdDataChanged event
│   │   │   │   ├── universalReceiver/     # UniversalReceiver event
│   │   │   │   ├── follow/                # Follow event
│   │   │   │   ├── unfollow/              # Unfollow event
│   │   │   │   ├── ownershipTransferred/  # OwnershipTransferred event
│   │   │   │   ├── marketplace/           # Marketplace event extract/populate functions
│   │   │   │   ├── orbsClaimed/           # ORBS claimed tracking
│   │   │   │   └── chillClaimed/          # CHILL claimed tracking
│   │   │   └── model.ts       # Re-exports @chillwhales/typeorm
│   │   ├── lib/                # Compiled JS output
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── typeorm/                # Database schema and entity generation
│   │   ├── schema.graphql      # SOURCE OF TRUTH for all entity types (~1153 lines, ~80+ entities)
│   │   ├── src/                # Generated (by codegen): TypeORM entity classes — DO NOT EDIT
│   │   │   └── model/
│   │   │       └── generated/  # One .ts file per entity from schema.graphql
│   │   ├── lib/                # Compiled JS output (this is what gets imported)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── indexer-v2/             # ABANDONED/WIP — compiled-only, no source or package.json
│       └── lib/                # Compiled JS remnants (core, handlers, plugins, utils)
├── sql-views/                  # SQL view definitions for Hasura/reporting
│   ├── DataChangedLatest.sql   # Latest DataChanged per (dataKey, address)
│   ├── FollowedSellersListings.sql
│   └── TopSellingContentBySeller.sql
├── .github/                    # GitHub templates
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE/
├── docker-compose.yaml         # Full stack: indexer + postgres + hasura + data-connector
├── Dockerfile                  # Node 22 Alpine, builds all packages
├── start.sh                    # Entrypoint: migrate → hasura config → start indexer
├── env.sh                      # Sources .env for local dev
├── .env.example                # Template for environment variables
├── package.json                # Root workspace scripts
├── pnpm-workspace.yaml         # Workspace config: packages/*
├── pnpm-lock.yaml              # Lockfile
├── .prettierrc                 # Prettier config
├── .prettierignore             # Prettier ignore list
├── ARCHITECTURE.md             # Existing architecture doc
├── CONTRIBUTING.md             # Contribution guidelines
├── CODE_OF_CONDUCT.md          # Code of conduct
├── README.md                   # Project readme
└── LICENSE                     # MIT license
```

## Directory Purposes

**`packages/abi/`:**

- Purpose: ABI type bindings for smart contracts the indexer decodes
- Contains: Custom JSON ABIs and auto-generated TypeScript event/function decoders
- Key files: `custom/extensions/*.json` (marketplace ABIs), `scripts/codegen.sh` (runs `squid-evm-typegen`)
- Generated content: `src/abi/` and `src/index.ts` — regenerate with `pnpm build` (runs codegen first)

**`packages/typeorm/`:**

- Purpose: Database schema definition and TypeORM entity code generation
- Contains: `schema.graphql` (the schema source), generated entity classes, migration tooling
- Key files: `schema.graphql` — the ONLY file to edit when changing the data model
- Generated content: `src/model/generated/` — regenerate with `pnpm codegen` or `pnpm build`

**`packages/indexer/`:**

- Purpose: Core blockchain indexer — listens to events and writes to PostgreSQL
- Contains: All business logic: event scanning, entity verification, data key extraction, metadata fetching, derived computation

**`packages/indexer/src/app/`:**

- Purpose: Application orchestration layer
- Contains: Entry point, processor config, scanner, and all handler functions
- Key files: `index.ts` (main pipeline), `processor.ts` (event subscriptions), `scanner.ts` (log parsing)

**`packages/indexer/src/app/handlers/`:**

- Purpose: Post-processing handlers that compute derived/aggregate entities
- Contains: One handler per concern (14 handler files)
- Key files: `lsp3ProfileHandler.ts` (profile metadata fetching), `marketplaceHandler.ts` (listing state machine), `ownedAssetsHandler.ts` (balance tracking)

**`packages/indexer/src/utils/`:**

- Purpose: Event extraction, entity population, and shared helper functions
- Contains: Per-event-type subdirectories with `extract()` and `populate()` functions
- Key files: `index.ts` (barrel + shared helpers), `entityVerification.ts`, `entityPopulation.ts`

**`packages/indexer/src/utils/dataChanged/`:**

- Purpose: Handlers for each standardized ERC725Y data key emitted via DataChanged events
- Contains: One file per data key type (22 files: lsp3Profile, lsp4*, lsp5*, lsp6*, lsp8*, lsp12*, lsp29*)
- Pattern: Each exports `extract()`, `populate()`, and optionally `extractSubEntities()`, `clearSubEntities()`

**`packages/indexer/src/constants/`:**

- Purpose: Configuration values loaded from environment variables with defaults
- Contains: RPC URLs, gateway addresses, rate limits, IPFS gateway, contract addresses

**`packages/indexer/src/types/`:**

- Purpose: Core TypeScript type aliases for Subsquid processor types
- Contains: `Processor`, `Block`, `Context`, `ExtractParams`, `ChillMintTransfer`

**`sql-views/`:**

- Purpose: SQL view definitions for Hasura GraphQL queries or reporting
- Contains: 3 SQL files defining useful database views

## Key File Locations

**Entry Points:**

- `packages/indexer/src/app/index.ts`: Main indexer pipeline (starts processor.run)
- `start.sh`: Docker entrypoint (migration + hasura setup + start)

**Configuration:**

- `packages/indexer/src/app/processor.ts`: Event topic subscriptions and RPC configuration
- `packages/indexer/src/constants/index.ts`: All env-var-based configuration with defaults
- `packages/typeorm/schema.graphql`: Database schema (source of truth for all entities)
- `docker-compose.yaml`: Full infrastructure stack definition
- `.env.example`: All supported environment variables

**Core Logic:**

- `packages/indexer/src/app/scanner.ts`: Event log parsing and routing (~725 lines)
- `packages/indexer/src/utils/entityVerification.ts`: On-chain entity verification
- `packages/indexer/src/utils/entityPopulation.ts`: Entity relationship population (~463 lines)
- `packages/indexer/src/app/handlers/marketplaceHandler.ts`: Listing state machine (~311 lines)
- `packages/indexer/src/app/handlers/lsp3ProfileHandler.ts`: Profile metadata fetching (~190 lines)
- `packages/indexer/src/utils/dataChanged/lsp3Profile.ts`: LSP3 data extraction + sub-entity parsing

**Shared Utilities:**

- `packages/indexer/src/utils/index.ts`: Barrel exports + helpers (parseIpfsUrl, decodeVerifiableUri, getDataFromURL, formatTokenId, ID generators)
- `packages/indexer/src/utils/multicall3.ts`: Multicall3 batched RPC wrapper

**Testing:**

- No test files detected in the codebase

**ABI Management:**

- `packages/abi/scripts/codegen.sh`: Generates TypeScript from all JSON ABIs
- `packages/abi/custom/`: Custom contract ABIs not from npm packages
- `packages/abi/custom/extensions/`: Marketplace extension contract ABIs

## Naming Conventions

**Files:**

- `camelCase.ts` for all TypeScript source files: `lsp3Profile.ts`, `entityVerification.ts`, `marketplaceHandler.ts`
- `index.ts` barrel files in every directory for re-exports
- `UPPERCASE.sql` with PascalCase names for SQL views: `DataChangedLatest.sql`
- `UPPERCASE.md` for documentation: `ARCHITECTURE.md`, `CONTRIBUTING.md`

**Directories:**

- `camelCase` for all source directories: `dataChanged/`, `tokenIdDataChanged/`, `universalReceiver/`
- Directory per event type under `src/utils/`: matches the event name in camelCase
- Directory per data key category under `src/utils/dataChanged/`: matches LSP standard name

**Functions:**

- `camelCase` for all functions: `scanLogs()`, `verifyEntities()`, `populateEntities()`
- Event utility functions: `extract()`, `populate()`, `extractSubEntities()`, `clearSubEntities()`
- Handler functions: `{concern}Handler()` — e.g., `totalSupplyHandler()`, `lsp3ProfileHandler()`
- ID generators: `generate{EntityType}Id()` — e.g., `generateTokenId()`, `generateOwnedAssetId()`

**Variables:**

- Entity collections use descriptive suffixes: `{type}Entities` (arrays), `{type}Map` (Maps)
- Populated entities prefixed with `populated`: `populatedLsp3ProfileEntities`
- Validated entities prefixed with scope: `validUniversalProfiles`, `newDigitalAssets`, `invalidUniversalProfiles`

**Types/Entities:**

- PascalCase for TypeORM entities and TypeScript types: `UniversalProfile`, `DigitalAsset`, `LSP3Profile`
- Enums in PascalCase with SCREAMING_SNAKE values: `ListingStatus.ACTIVE`, `LSP4TokenTypeEnum.TOKEN`

**Imports:**

- Path alias `@/` maps to `packages/indexer/src/` (configured in `tsconfig.json`)
- Namespace imports for utility modules: `import * as Utils from '@/utils'`
- Named imports for entities: `import { UniversalProfile, DigitalAsset } from '@chillwhales/typeorm'`
- Workspace package imports: `@chillwhales/abi`, `@chillwhales/typeorm`

## Import Organization

**Order:**

1. Local path-aliased imports (`@/constants`, `@/types`, `@/utils`)
2. Workspace package imports (`@chillwhales/abi`, `@chillwhales/typeorm`)
3. External LUKSO contract imports (`@lukso/lsp*-contracts`)
4. External library imports (`@subsquid/*`, `typeorm`, `viem`, `axios`, `uuid`)

**Path Aliases:**

- `@/*` → `packages/indexer/src/*` (defined in `packages/indexer/tsconfig.json`)

## Where to Add New Code

**New Blockchain Event Type:**

1. Add ABI JSON to `packages/abi/custom/` (or `custom/extensions/` for marketplace)
2. Rebuild ABI package: `pnpm --filter=@chillwhales/abi build`
3. Add entity type(s) to `packages/typeorm/schema.graphql`
4. Rebuild typeorm package: `pnpm --filter=@chillwhales/typeorm build`
5. Add event topic to `packages/indexer/src/app/processor.ts` (`.addLog({})`)
6. Create extract/populate utility at `packages/indexer/src/utils/{eventName}/index.ts`
7. Export from `packages/indexer/src/utils/index.ts`
8. Add scanning case in `packages/indexer/src/app/scanner.ts` (`switch` on `log.topics[0]`)
9. Wire into `packages/indexer/src/app/index.ts` main pipeline
10. If post-processing needed, add handler at `packages/indexer/src/app/handlers/{concern}Handler.ts` and export from `handlers/index.ts`

**New ERC725Y Data Key:**

1. Add entity to `packages/typeorm/schema.graphql`
2. Create extraction file at `packages/indexer/src/utils/dataChanged/{lspXDataKey}.ts` with `extract()` and `populate()` functions
3. Export from `packages/indexer/src/utils/dataChanged/index.ts`
4. Add data key constant to `packages/indexer/src/constants/` (or use `@lukso/lsp*-contracts`)
5. Add `case`/`if` branch in scanner's `DataChanged` handler (match by exact key or prefix)
6. Add entity collection variables in `scanner.ts` `scanLogs()`, wire through `entityPopulation.ts`, and persist in `index.ts`

**New Handler (Post-Processing):**

1. Create `packages/indexer/src/app/handlers/{concern}Handler.ts`
2. Export from `packages/indexer/src/app/handlers/index.ts`
3. Call from `packages/indexer/src/app/index.ts` after persistence (at the bottom of the pipeline)

**New SQL View:**

- Add `.sql` file to `sql-views/` directory
- Apply manually to PostgreSQL or configure in Hasura

**Utilities/Helpers:**

- Shared helpers: Add to `packages/indexer/src/utils/index.ts`
- Domain-specific helpers: Add to relevant `packages/indexer/src/utils/{domain}/` directory

## Special Directories

**`packages/abi/src/`:**

- Purpose: Generated ABI TypeScript bindings
- Generated: Yes (by `scripts/codegen.sh` via `squid-evm-typegen`)
- Committed: No (cleaned by `pnpm clean`)

**`packages/typeorm/src/`:**

- Purpose: Generated TypeORM entity classes from schema.graphql
- Generated: Yes (by `squid-typeorm-codegen`)
- Committed: No (cleaned by `pnpm clean`)

**`packages/*/lib/`:**

- Purpose: TypeScript compilation output
- Generated: Yes (by `tsc`)
- Committed: Appears to be committed (present in repo), but ideally should not be

**`packages/indexer-v2/`:**

- Purpose: Abandoned/WIP rewrite — contains only compiled JS output (no source or package.json)
- Generated: N/A
- Committed: Yes, but non-functional — no source code, no package.json

**`node_modules/`:**

- Purpose: Installed dependencies (pnpm workspace)
- Generated: Yes
- Committed: No

---

_Structure analysis: 2026-02-06_
