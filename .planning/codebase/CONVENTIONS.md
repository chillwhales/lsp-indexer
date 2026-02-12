# Coding Conventions

**Analysis Date:** 2026-02-12

## Naming Patterns

**Files:**

- Source files use `camelCase` with a domain suffix: `{name}.{role}.ts`
  - Plugins: `follow.plugin.ts`, `lsp7Transfer.plugin.ts`, `dataChanged.plugin.ts`
  - Handlers: `totalSupply.handler.ts`, `ownedAssets.handler.ts`, `follower.handler.ts`
  - Core modules: `pipeline.ts`, `registry.ts`, `batchContext.ts`, `logger.ts`
  - Type definitions: organized in `core/types/` directory with domain-specific files
  - Test files: `{source}.test.ts` in co-located `__tests__/` directories
- Barrel exports: `index.ts` in each directory

**Classes:**

- PascalCase: `BatchContext`, `PluginRegistry`, `MetadataWorkerPool`
- Classes are used sparingly - only for stateful objects (registry, batch context)
- Most code uses plain objects implementing interfaces

**Interfaces and Types:**

- PascalCase with `I` prefix for behavioral interfaces: `IBatchContext`, `IPluginRegistry`, `IMetadataWorkerPool`
- PascalCase without prefix for data types: `HandlerContext`, `EntityHandler`, `EventPlugin`, `VerificationResult`
- Type unions: `PipelineStep` (string literal union)
- Generic type params: single uppercase letter `T extends Entity`

**Functions:**

- camelCase for all functions: `processBatch`, `createStepLogger`, `clearSubEntities`
- Factory functions: `create{Thing}` pattern - `createMockStore()`, `createPipelineConfig()`, `createRegistry()`, `createVerifyFn()`
- Type guards: `is{Type}` pattern - `isEventPlugin()`, `isEntityHandler()`, `isNullAddress()`, `isFileAsset()`
- Decode/format utils: `decode{Thing}` / `format{Thing}` - `decodeTokenType()`, `formatTokenId()`, `decodeVerifiableUri()`

**Variables:**

- camelCase for local variables and parameters
- UPPER_SNAKE_CASE for module-level constants: `ENTITY_TYPE`, `LSP26_ADDRESS`, `ZERO_ADDRESS`, `DEAD_ADDRESS`
- Underscore prefix for unused parameters: `_triggeredBy`, `_exhaustive`, `_resetFileLogger`
- Private fields in classes: no prefix, standard camelCase

**Entity Type Keys:**

- PascalCase strings used as entity bag keys in BatchContext: `'Transfer'`, `'Follow'`, `'TotalSupply'`, `'OwnedAsset'`, `'Follower'`
- Defined as `const ENTITY_TYPE = 'Follow'` at module top

## Code Style

**Formatting:**

- Prettier with `prettier-plugin-organize-imports`
- Config in `.prettierrc`:
  - `tabWidth: 2` (spaces, not tabs)
  - `printWidth: 100`
  - `singleQuote: true`
  - `trailingComma: "all"`
- Run: `pnpm format` (write) / `pnpm format:check` (CI)

**Linting:**

- ESLint 9 flat config with `typescript-eslint` type-checked rules
- Config: `eslint.config.ts`
- Run: `pnpm lint` / `pnpm lint:fix`
- Key enforced rules:
  - `@typescript-eslint/no-floating-promises: 'error'` - **critical** for async indexer code
  - `@typescript-eslint/no-misused-promises: 'error'`
  - `@typescript-eslint/no-unused-vars: 'error'` with `^_` ignore pattern
  - `@typescript-eslint/explicit-function-return-type: 'warn'` for exported functions
  - `@typescript-eslint/no-explicit-any: 'warn'` - prefer `unknown`
  - `prefer-const: 'error'`
  - `eqeqeq: ['error', 'smart']`
  - `no-console: ['warn', { allow: ['warn', 'error', 'info'] }]`
  - `no-duplicate-imports: 'error'`
- Test file overrides in `eslint.config.ts`: `@typescript-eslint/unbound-method: 'off'` for `**/__tests__/**/*.ts`
- Unsafe `any` rules set to `'warn'` (not error) as codebase improves
- ESLint ignores: `packages/indexer/` (legacy v1, read-only), codegen output (`packages/abi/src/`, `packages/typeorm/src/`)

## Import Organization

**Order** (auto-sorted by `prettier-plugin-organize-imports`):

1. Path aliases (`@/core/types`, `@/utils`, `@/constants`)
2. External packages (`@chillwhales/typeorm`, `@subsquid/typeorm-store`, `viem`, `typeorm`)
3. Relative imports (`./batchContext`, `../types`)

**Path Aliases:**

- `@/*` maps to `src/*` (dev, via tsconfig paths in `packages/indexer-v2/tsconfig.json`)
- `@/*` maps to `lib/*` (runtime and tests, via `tsconfig-paths/register` and `vitest.setup.ts`)

**Import Style:**

- Named imports preferred: `import { Store } from '@subsquid/typeorm-store'`
- Type-only imports where applicable: `import type { Logger } from '@subsquid/logger'`
- Default exports for plugins and handlers: `export default FollowPlugin`
- Barrel re-exports: `export * from './batchContext'` in `index.ts` files

## Error Handling

**Patterns:**

- **Let errors propagate** - Pipeline has no try/catch; errors propagate to the Subsquid framework. See `packages/indexer-v2/src/core/pipeline.ts` line 174 comment.
- **Fail-fast validation** - `PluginRegistry` in `packages/indexer-v2/src/core/registry.ts` throws on duplicate topic0, duplicate handler names, circular dependencies, unknown dependency references.
- **Defensive guards** - Type guards (`isEventPlugin()`, `isEntityHandler()`) validate plugin/handler shape before registration.
- **Clamp-and-warn** - `packages/indexer-v2/src/handlers/totalSupply.handler.ts` clamps to zero on underflow and logs a warning rather than throwing.
- **Structured error context** - Log warnings with attribute objects: `enrichLog.warn({ entityType, entityId, fkField }, 'message')`
- **Exhaustive switch** - Use `const _exhaustive: never = value` pattern for exhaustive category matching (see `createFkStub()` in `packages/indexer-v2/src/core/pipeline.ts`).
- **Return `{ value, decodeError }` pattern** - For decode operations that can fail, return both value and error string instead of throwing (see `decodeVerifiableUri()` in `packages/indexer-v2/src/utils/index.ts`).

## Logging

**Framework:** Dual-output logging system in `packages/indexer-v2/src/core/logger.ts`

- **Subsquid Logger** - `context.log` for stdout/stderr (structured JSON)
- **Pino** - File logger via `pino-roll` for rotating JSON file output

**Logging Patterns:**

- Use `createStepLogger(context.log, 'STEP_NAME', blockRange)` for pipeline step logging
- Use `createComponentLogger(context.log, 'component_name')` for handler/component tagging
- Use `createDualLogger()` for writing to both console and file simultaneously
- Four severity levels: `debug`, `info`, `warn`, `error`
- Guard debug logging with: `if (hctx.context.log.isDebug()) { ... }`
- Structured attributes passed as native objects (NOT JSON.stringify): `logger.info({ entityType: 'Follow', count: 5 }, 'Processed')`
- Pipeline steps defined as `PipelineStep` union type: `'BOOTSTRAP' | 'EXTRACT' | 'PERSIST_RAW' | 'HANDLE' | 'CLEAR_SUB_ENTITIES' | 'DELETE_ENTITIES' | 'PERSIST_DERIVED' | 'VERIFY' | 'ENRICH'`

**Environment Config:**

- `LOG_LEVEL` env var overrides default
- Default: `'debug'` in development, `'info'` in production
- `INDEXER_ENABLE_FILE_LOGGER=false` disables file logging

**Post-hoc filtering:**

```bash
cat logs/indexer*.log | jq 'select(.component == "metadata_fetch")'
cat logs/indexer*.log | jq 'select(.step == "VERIFY")'
```

## TypeScript Patterns

**Strict Mode:**

- Root `tsconfig.json`: `"strict": true`
- `packages/indexer-v2/tsconfig.json`: `"experimentalDecorators": true`, `"emitDecoratorMetadata": true` (for TypeORM), target `es2020`, module `commonjs`

**Generic Type Safety:**

- `queueEnrichment<T extends Entity>(request: EnrichmentRequest<T>)` - validates FK field names at compile time
- `setPersistHint<T extends Entity>(type: string, hint: PersistHint<T>)` - validates merge field names at compile time
- `queueClear<T extends Entity>(request: ClearRequest<T>)` - validates FK field names at compile time
- Internal storage uses `StoredEnrichmentRequest` (erased generics) for heterogeneous collections
- See type definitions in `packages/indexer-v2/src/core/types/batchContext.ts`

**Plugin/Handler Object Pattern:**

- Plugins and handlers are plain objects implementing interfaces, not classes
- Exported as `default` export: `const TotalSupplyHandler: EntityHandler = { name: 'totalSupply', ... }; export default TotalSupplyHandler;`
- Single file per plugin/handler - adding a new event = creating 1 new file

**Interface-Driven Architecture:**

- Core types defined as interfaces in `packages/indexer-v2/src/core/types/`: `EventPlugin`, `EntityHandler`, `IBatchContext`, `IPluginRegistry`
- Implementations separated from interfaces: types in `core/types/`, impls in `core/`
- Type guards used for runtime validation of dynamically loaded modules in `packages/indexer-v2/src/core/registry.ts`

**Enum Usage:**

- `EntityCategory` enum from core types: `UniversalProfile`, `DigitalAsset`, `NFT`
- External enums from `@chillwhales/typeorm`: `LSP4TokenTypeEnum`, `LSP8TokenIdFormatEnum`, `OperationType`

## Comments

**When to Comment:**

- Module-level JSDoc on every file explaining purpose, context, and port origin from v1
- Interface/method JSDoc explaining contracts, parameters, and behavior
- Pipeline step separator comments using horizontal rules
- Inline `eslint-disable` comments with reason: `// eslint-disable-next-line @typescript-eslint/no-require-imports`
- `TODO:` comments for planned work: `// TODO: Wire this into bootstrap in Phase 6`
- Port reference comments: `// Port from v1: utils/index.ts decodeVerifiableUri()`

**JSDoc Style:**

```typescript
/**
 * Brief one-line description.
 *
 * Longer explanation with context. Multi-paragraph when needed.
 *
 * @param name - Description of parameter
 * @returns Description of return value
 * @throws Error description
 */
```

**Section Separators:**

```typescript
// ---------------------------------------------------------------------------
// Section Name
// ---------------------------------------------------------------------------
```

## Module Design

**Exports:**

- Plugins: `export default FollowPlugin` (default export, discovered by file naming `*.plugin.js`)
- Handlers: `export default TotalSupplyHandler` (default export, discovered by file naming `*.handler.js`)
- Core modules: named exports
- Barrel files: `export * from './module'` in `index.ts`

**File Organization Within Modules:**

1. Module-level JSDoc
2. Imports
3. Constants / type definitions
4. Main implementation (class or functions)
5. Helper functions (private, at bottom)

## Entity Construction Pattern

**Immutable Entity Pattern:** Entities are constructed via `new EntityClass({ ...props })` and spread-updated rather than mutated:

```typescript
new TotalSupply({
  ...entity,
  timestamp,
  value: entity.value + amount,
  digitalAsset: entity.digitalAsset ?? null,
});
```

**ID Generation:**

- Unique events: `uuidv4()` for non-deterministic IDs (e.g., `Executed`, `Transfer`, `Follow`)
- Addressable entities: Contract address as ID (e.g., `TotalSupply.id = address`)
- Composite entities: String concatenation in `packages/indexer-v2/src/utils/index.ts`:
  - `generateTokenId()`: `"${address} - ${tokenId}"`
  - `generateFollowId()`: `"${followerAddress} - ${followedAddress}"`
  - `generateOwnedAssetId()`: `"${owner}:${address}"`
  - `generateOwnedTokenId()`: `"${owner}:${address}:${tokenId}"`

## Git Commit Conventions

**Format:** Conventional commits with scope

```
type(scope): description (#issue)
```

**Types used:**

- `feat` - New feature: `feat: Phase 3.2 - Queue-based worker pool optimization (#155)`
- `fix` - Bug fix: `fix(indexer-v2): preserve FK field when reconstructing TotalSupply entities (#146)`
- `test` - Test additions: `test(indexer-v2): add comprehensive unit tests for OwnedAssets handler (#143)`

**Scopes used:**

- `indexer-v2` - Changes to the v2 indexer package
- `docker` - Docker/deployment changes
- Phase numbers for phased work: `03.2`, etc.

**PR references:** Include PR number in parentheses: `(#155)`

## PR Workflow

**Template:** `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`

- Sections: Description, Related Issues, Changes Made, Testing, Checklist
- Testing checklist: unit tests, integration tests, manual testing
- Checklist items: style guidelines, documentation, test coverage

**CI Pipeline:** `.github/workflows/ci.yml`

- Three parallel jobs: `format` (Prettier), `lint` (ESLint), `build` (Node 20 + 22)
- Runs on push to `main`/`refactor/indexer-v2` and PRs to same
- Concurrency: cancel-in-progress per workflow+ref
- Build job builds dependency packages first (`@chillwhales/abi` then `@chillwhales/typeorm` then `@chillwhales/indexer-v2`)
- **No test job in CI** - tests run locally via `pnpm test` within `packages/indexer-v2/`

---

_Convention analysis: 2026-02-12_
