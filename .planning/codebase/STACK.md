# Technology Stack

**Analysis Date:** 2026-02-12

## Languages

**Primary:**

- TypeScript ^5.9.2 — All source code across all 4 packages
- Target: ES2020 (all tsconfigs)

**Secondary:**

- Shell scripts — Docker entrypoint (`docker/v2/entrypoint.sh`), ABI codegen (`packages/abi/scripts/codegen.sh`)
- GraphQL — Schema definition for TypeORM codegen (`packages/typeorm/schema.graphql`, 925 lines)
- SQL — Custom views (`sql/views/DataChangedLatest.sql`)

## Runtime

**Environment:**

- Node.js 22 (primary, used in Docker and CI)
- Node.js 20 (CI build matrix compatibility)
- Docker base image: `node:22-alpine`

**Execution:**

- `ts-node` ^10.9.2 with `tsconfig-paths/register` — runs compiled JS via `lib/app/index.js`
- NOT running raw TS at runtime; TypeScript compiles to `lib/` then ts-node executes compiled JS

**Package Manager:**

- pnpm 10.15.0 (root `package.json` `packageManager` field)
- pnpm 10.10.0 (individual packages — minor version discrepancy)
- Lockfile: `pnpm-lock.yaml` (present, 312KB)
- Workspace: `pnpm-workspace.yaml` — `packages: ['packages/*']`
- Corepack: enabled in Docker (`corepack enable pnpm`)

## Workspace Packages

| Package                   | Version | Purpose                                      |
| ------------------------- | ------- | -------------------------------------------- |
| `@chillwhales/indexer-v2` | 0.1.0   | Active indexer — plugin architecture         |
| `@chillwhales/indexer`    | 1.5.2   | Legacy v1 indexer — read-only reference      |
| `@chillwhales/typeorm`    | 1.2.1   | Database entities, migrations, Hasura config |
| `@chillwhales/abi`        | 1.0.4   | ABI typegen for smart contract interfaces    |

**Dependency Graph:**

```
indexer-v2 → abi (workspace:1.0.4), typeorm (workspace:1.2.0)  ← pinned below latest 1.2.1
indexer    → abi (workspace:1.0.4), typeorm (workspace:1.2.1)
typeorm    → (standalone, generates entities from schema.graphql)
abi        → (standalone, generates ABI types from contract artifacts)
```

## Frameworks

**Core:**

- Subsquid EVM SDK — Blockchain indexing framework
  - `@subsquid/evm-processor` ^1.27.2 — EVM batch processor, event log routing
  - `@subsquid/typeorm-store` ^1.5.1 — TypeORM integration for Subsquid processor
  - `@subsquid/logger` ^1.4.0 — Structured logging (indexer-v2 only)
  - `@subsquid/evm-abi` ^0.3.1 — ABI encoding/decoding
  - `@subsquid/evm-codec` ^0.3.0 — EVM data codec
  - `@subsquid/evm-typegen` ^4.4.0 — ABI → TypeScript codegen (devDep)

**ORM/Database:**

- TypeORM ^0.3.25 — PostgreSQL ORM for entity persistence
  - `@subsquid/typeorm-codegen` ^2.0.2 — GraphQL schema → TypeORM entity codegen
  - `@subsquid/typeorm-migration` ^1.3.0 — Database migration generation and application
  - `@subsquid/hasura-configuration` ^2.0.0 — Hasura metadata generation

**Blockchain/Web3:**

- viem ^2.33.2 — Ethereum client library (hex utils, public client, type codecs)
- `@erc725/erc725.js` ^0.28.1 — ERC725 data decoding (LSP data key parsing)
- `@erc725/smart-contracts` ^8.0.1 — ERC725 contract ABIs for typegen

**LUKSO LSP Contract Libraries:**

- `@lukso/lsp0-contracts` 0.15.5 — Universal Profile (ERC725Account) ABIs + interface IDs
- `@lukso/lsp2-contracts` ^0.15.4 — ERC725Y JSON Schema
- `@lukso/lsp3-contracts` 0.16.6 — Profile Metadata
- `@lukso/lsp4-contracts` 0.16.7 — Digital Asset Metadata
- `@lukso/lsp5-contracts` ^0.15.4 — Received Assets
- `@lukso/lsp6-contracts` 0.15.5 — Key Manager
- `@lukso/lsp7-contracts` 0.16.8 — Digital Asset (fungible)
- `@lukso/lsp8-contracts` 0.16.7 — Identifiable Digital Asset (NFT)
- `@lukso/lsp12-contracts` ^0.15.4 — Issued Assets
- `@lukso/lsp14-contracts` ^0.15.5 — Ownable 2-Step
- `@lukso/lsp23-contracts` ^0.15.5 — Linked Contracts Factory
- `@lukso/lsp26-contracts` ^0.1.7 — Follower System

**HTTP/Networking:**

- axios ^1.11.0 — HTTP client for IPFS/metadata fetching (in worker threads)
- `data-urls` ^5.0.0 — Parsing `data:` URIs for inline metadata

**Logging:**

- pino ^9.6.0 — Structured JSON file logging (indexer-v2 only)
- `pino-roll` ^1.1.0 — Daily rotating log files (indexer-v2 only)
- `@subsquid/logger` ^1.4.0 — Console/stdout structured logging (indexer-v2 only)

**Utilities:**

- uuid ^11.1.0 — UUID v4 generation for entity IDs
- dotenv ^17.2.1 — Environment variable loading from `.env`
- `tsconfig-paths` ^4.2.0 — Path alias resolution (`@/*` → `src/*` or `lib/*`)

**Testing:**

- vitest ^2.1.8 — Test runner (indexer-v2 only)
- Config: `packages/indexer-v2/vitest.config.ts`
- Globals enabled, node environment
- Tests: `src/**/*.test.ts` (unit), `test/**/*.test.ts` (integration)

**Build/Dev:**

- TypeScript ^5.9.2 — `tsc` compiler (no bundler)
- Output: CommonJS modules to `lib/` directories
- Decorators: `experimentalDecorators` + `emitDecoratorMetadata` (TypeORM entities)
- Path aliases: `@/*` → `src/*` in tsconfig, resolved by `tsconfig-paths/register` at runtime

**Linting/Formatting:**

- ESLint ^9.39.2 with `typescript-eslint` ^8.54.0 — type-checked linting
  - Config: `eslint.config.ts` (flat config format)
  - Key rules: `no-floating-promises: error`, `explicit-function-return-type: warn`, `no-explicit-any: warn`
- Prettier ^3.5.3 — code formatting
  - Config: `.prettierrc` — 2-space tabs, 100 char width, single quotes, trailing commas
  - Plugin: `prettier-plugin-organize-imports` ^4.1.0 — auto-sorts imports
- jiti ^2.6.1 — TypeScript config loader for ESLint flat config

## TypeScript Configuration

**Root (`tsconfig.json`):**

- module: `nodenext`, moduleResolution: `nodenext`, target: `es2020`
- strict: true, esModuleInterop: true, skipLibCheck: true
- Only includes `eslint.config.ts`

**Indexer-v2 (`packages/indexer-v2/tsconfig.json`):**

- module: `commonjs`, target: `es2020`
- experimentalDecorators: true, emitDecoratorMetadata: true (TypeORM)
- resolveJsonModule: true, declaration: true
- baseUrl: `.`, paths: `{ "@/*": ["src/*"] }`
- rootDir: `src`, outDir: `lib`
- ts-node config: transpileOnly: true, require: `tsconfig-paths/register`

## Codegen Pipeline

**ABI Codegen (`packages/abi`):**

1. `squid-evm-typegen` reads contract JSON artifacts from `@lukso/*` and `@erc725/*` node_modules
2. Generates TypeScript ABI wrappers in `src/abi/`
3. Auto-generates barrel `src/index.ts` with exports
4. `tsc` compiles to `lib/`

**TypeORM Codegen (`packages/typeorm`):**

1. `squid-typeorm-codegen` reads `schema.graphql` (925-line schema)
2. Generates TypeORM entity classes in `src/model/`
3. `tsc` compiles to `lib/model/`
4. `squid-typeorm-migration generate` creates SQL migrations in `db/`
5. `squid-hasura-configuration regenerate` creates Hasura metadata JSON

## Docker Infrastructure

**Production Docker (`docker/v2/Dockerfile`):**

- 3-stage multi-stage build: `base` → `deps` → `builder` → `runner`
- Base: `node:22-alpine`
- Runs as non-root `node` user
- Health check: `pgrep -f "ts-node.*lib/app/index.js"`
- Entrypoint: `docker/v2/entrypoint.sh` (migration → Hasura config → start)

**Docker Compose (`docker-compose.yml`):**

- 4 services: `postgres`, `indexer-v2`, `hasura`, `data-connector-agent`
- Resource limits enforced (Postgres 2G, Indexer 4G, Hasura 1G, data-connector 512M)
- PostgreSQL tuned for high-write workload (max_wal_size=2GB, shared_buffers=512MB)
- Named volumes: `postgres-data`, `indexer-logs`

## CI/CD Pipeline

**GitHub Actions (`.github/workflows/ci.yml`):**

- Triggers: push/PR to `main` and `refactor/indexer-v2` branches
- Concurrency: cancel-in-progress per workflow+ref
- 3 parallel jobs:
  1. **Prettier** — `pnpm format:check`
  2. **ESLint** — `pnpm lint` (requires building abi + typeorm packages first)
  3. **Build** — Node 20 + Node 22 matrix, builds abi → typeorm → indexer-v2
- No test job in CI currently

## Key Development Commands

```bash
pnpm build                    # Build all packages (abi → typeorm → indexer-v2)
pnpm clean                    # Clean all lib/ directories
pnpm format                   # Prettier write
pnpm format:check             # Prettier check
pnpm lint                     # ESLint check (requires abi + typeorm built first)
pnpm lint:fix                 # ESLint autofix
pnpm hasura:generate          # Regenerate Hasura metadata from schema
pnpm hasura:apply             # Apply Hasura metadata to running instance
pnpm migration:generate       # Generate DB migrations from schema.graphql changes
pnpm migration:apply          # Apply pending DB migrations
pnpm start                    # Start v1 indexer (legacy)
pnpm start:v2                 # Start v2 indexer (active)
```

**Package-level commands (indexer-v2):**

```bash
pnpm --filter=@chillwhales/indexer-v2 test       # Run vitest
pnpm --filter=@chillwhales/indexer-v2 test:watch  # Vitest watch mode
pnpm --filter=@chillwhales/indexer-v2 start:simple # Start without file logging
```

## Platform Requirements

**Development:**

- Node.js 20+ (22 recommended)
- pnpm 10.10.0+
- PostgreSQL 17 (via Docker or local)
- Git (required for pnpm dependency resolution)

**Production:**

- Docker + Docker Compose
- 4GB+ RAM (indexer-v2 limit)
- PostgreSQL 17 (Alpine, with tuning for high-write blockchain workload)
- Network access to LUKSO RPC + Subsquid archive + IPFS gateway

---

_Stack analysis: 2026-02-12_
