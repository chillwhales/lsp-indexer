# Technology Stack

**Analysis Date:** 2026-02-06

## Languages

**Primary:**

- TypeScript ~5.9.2 - All packages (`packages/indexer/`, `packages/typeorm/`, `packages/abi/`)
- Target: ES2020, Module: CommonJS
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`) for TypeORM entities

**Secondary:**

- Shell scripts - Build automation and startup (`start.sh`, `env.sh`, `packages/abi/scripts/codegen.sh`)
- SQL - Database views (`sql-views/*.sql`)
- GraphQL - Schema definition for TypeORM codegen (`packages/typeorm/schema.graphql`)

## Runtime

**Environment:**

- Node.js 22 (Alpine) - specified in `Dockerfile` (`FROM node:22-alpine`)
- ts-node for runtime TypeScript execution (used in `packages/indexer/package.json` start script)

**Package Manager:**

- pnpm 10.15.0 (root `package.json`), 10.10.0 (sub-packages)
- Lockfile: `pnpm-lock.yaml` present
- Workspace config: `pnpm-workspace.yaml` with `packages/*`

## Frameworks

**Core:**

- Subsquid EVM Processor ^1.27.2 - Blockchain event indexing framework (`packages/indexer/src/app/processor.ts`)
- TypeORM ^0.3.25 - ORM for PostgreSQL data persistence (via `@subsquid/typeorm-store` ^1.5.1)
- Viem ^2.33.2 - Ethereum/EVM interaction utilities (hex conversion, boolean parsing, etc.)

**Build/Dev:**

- TypeScript ^5.9.2 - Compilation (`tsc`)
- Turbo - Build orchestration (`.turbo/` directories present, though no `turbo.json` found at root)
- Prettier ^3.5.3 - Code formatting with `prettier-plugin-organize-imports` ^4.1.0

**Codegen:**

- `@subsquid/evm-typegen` ^4.4.0 - ABI → TypeScript type generation (`packages/abi/scripts/codegen.sh`)
- `@subsquid/typeorm-codegen` ^2.0.2 - GraphQL schema → TypeORM entity generation (`packages/typeorm/package.json`)

## Key Dependencies

**Critical:**

- `@subsquid/evm-processor` ^1.27.2 - Core indexer engine; batch processes EVM logs (`packages/indexer/src/app/processor.ts`)
- `@subsquid/typeorm-store` ^1.5.1 - Provides `TypeormDatabase` store adapter for Subsquid processor (`packages/indexer/src/app/index.ts`)
- `viem` ^2.33.2 - EVM data encoding/decoding utilities used throughout (`packages/indexer/src/utils/index.ts`)
- `@erc725/erc725.js` ^0.28.1 - Decodes ERC725 VerifiableURI values (`packages/indexer/src/utils/index.ts`)
- `axios` ^1.11.0 - HTTP client for fetching IPFS/metadata JSON (`packages/indexer/src/utils/index.ts`)
- `typeorm` ^0.3.25 - ORM query builder (`In`, `IsNull`, `Not`, `LessThan` operators used in handlers)

**LUKSO Smart Contract ABIs:**

- `@lukso/lsp0-contracts` 0.15.5 - Universal Profile (ERC725Account) interface IDs
- `@lukso/lsp3-contracts` 0.16.6 - Profile metadata types and data keys
- `@lukso/lsp4-contracts` 0.16.7 - Digital asset metadata types and data keys
- `@lukso/lsp5-contracts` ^0.15.4 - Received assets data keys
- `@lukso/lsp6-contracts` 0.15.5 - Key manager permissions data keys
- `@lukso/lsp7-contracts` 0.16.8 - Fungible digital asset interface IDs
- `@lukso/lsp8-contracts` 0.16.7 - NFT (identifiable digital asset) interface IDs and data keys
- `@lukso/lsp12-contracts` ^0.15.4 - Issued assets data keys
- `@lukso/lsp14-contracts` ^0.15.5 - Ownable2Step events
- `@lukso/lsp23-contracts` ^0.15.5 - Linked contracts factory events
- `@lukso/lsp26-contracts` ^0.1.7 - Follower system events

**Infrastructure:**

- `@subsquid/hasura-configuration` ^2.0.0 - Auto-generates and applies Hasura GraphQL metadata (`packages/typeorm/package.json`)
- `@subsquid/typeorm-migration` ^1.3.0 - Database migration generation and application
- `dotenv` ^17.2.1 - Environment variable loading (`packages/indexer/src/constants/index.ts`)
- `data-urls` ^5.0.0 - Parses `data:` URIs for inline metadata (`packages/indexer/src/utils/index.ts`)
- `uuid` ^11.1.0 - Generates entity IDs (`packages/indexer/src/app/scanner.ts`)
- `tsconfig-paths` ^4.2.0 - Resolves `@/*` path alias at runtime

## Monorepo Structure

**Workspace Packages:**

- `@chillwhales/indexer` (v1.5.2) - Main indexer application (`packages/indexer/`)
- `@chillwhales/typeorm` (v1.2.1) - TypeORM entity models, generated from GraphQL schema (`packages/typeorm/`)
- `@chillwhales/abi` (v1.0.4) - ABI type bindings, generated from contract JSON artifacts (`packages/abi/`)

**Internal Dependencies:**

- `@chillwhales/indexer` depends on `@chillwhales/abi` (workspace:1.0.4) and `@chillwhales/typeorm` (workspace:1.2.1)

**Unused/Stale Package:**

- `packages/indexer-v2/` - Contains compiled JS output but no source files or `package.json`; appears to be a stale/deprecated experiment

## Configuration

**Environment:**

- `.env` file loaded via `env.sh` shell script (sources and exports vars)
- `.env.example` documents all configuration variables
- `dotenv` package also loads `.env` in `packages/indexer/src/constants/index.ts`

**Key Environment Variables:**

- `DB_URL` - PostgreSQL connection string (required)
- `SQD_GATEWAY` - Subsquid archive gateway (default: `https://v2.archive.subsquid.io/network/lukso-mainnet`)
- `RPC_URL` - LUKSO RPC endpoint (default: `https://rpc.lukso.sigmacore.io`)
- `RPC_RATE_LIMIT` - RPC request rate limit (default: 10)
- `FINALITY_CONFIRMATION` - Block finality depth (default: 75, ~15 min)
- `IPFS_GATEWAY` - IPFS gateway URL (default: `https://api.universalprofile.cloud/ipfs/`)
- `FETCH_LIMIT` - Max metadata items to fetch per batch (default: 10,000)
- `FETCH_BATCH_SIZE` - Batch size for metadata fetching (default: 1,000)
- `FETCH_RETRY_COUNT` - Max retries for failed metadata fetches (default: 5)
- `HASURA_GRAPHQL_ENDPOINT` - Hasura endpoint for metadata application
- `HASURA_GRAPHQL_ADMIN_SECRET` - Hasura admin secret

**Build:**

- Root `package.json` - Orchestrates builds via `pnpm -r build`
- Each package uses `tsc` for compilation with `rootDir: src`, `outDir: lib`
- `packages/abi/` runs codegen before build: `squid-evm-typegen` generates ABI types from JSON artifacts
- `packages/typeorm/` runs codegen before build: `squid-typeorm-codegen` generates entities from `schema.graphql`

**Path Aliases:**

- `@/*` maps to `src/*` in `packages/indexer/tsconfig.json`
- Resolved at runtime via `tsconfig-paths/register`

## Platform Requirements

**Development:**

- Node.js 22+
- pnpm 10.x (corepack-enabled)
- PostgreSQL 17 (for local development via Docker)
- Git (required in Docker build for dependency installation)

**Production:**

- Docker (single-stage build from `Dockerfile`)
- PostgreSQL 17 (Alpine) - via `docker-compose.yaml`
- Hasura GraphQL Engine v2.46.0 - via `docker-compose.yaml`
- Hasura Data Connector Agent v2.46.0 - via `docker-compose.yaml`
- Startup: `start.sh` runs migration:generate → migration:apply → hasura:generate → hasura:apply → pnpm start

---

_Stack analysis: 2026-02-06_
