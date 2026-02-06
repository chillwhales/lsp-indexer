# Coding Conventions

**Analysis Date:** 2026-02-06

## Naming Patterns

**Files:**

- Use `camelCase` for all TypeScript source files: `entityVerification.ts`, `entityPopulation.ts`, `multicall3.ts`
- Handlers follow the pattern `{feature}Handler.ts`: `decimalsHandler.ts`, `followerSystemHandler.ts`, `lsp3ProfileHandler.ts`
- LSP data key utilities use `lsp{N}{Feature}.ts`: `lsp3Profile.ts`, `lsp4TokenName.ts`, `lsp8TokenIdFormat.ts`
- Utility modules organized in directories with `index.ts` barrel files: `utils/follow/index.ts`, `utils/transfer/index.ts`
- Constants use `camelCase` files: `lsp29.ts`, `chillwhales.ts`

**Functions:**

- Use `camelCase` for all functions: `extract()`, `populate()`, `verifyEntities()`, `scanLogs()`
- Handler functions are named `{feature}Handler`: `decimalsHandler()`, `lsp3ProfileHandler()`, `marketplaceHandler()`
- Extract functions for marketplace use `extract{EventName}` pattern: `extractListingCreated()`, `extractPurchaseCompleted()`
- Generator/helper functions use `generate{Thing}` or `format{Thing}`: `generateTokenId()`, `generateFollowId()`, `formatTokenId()`
- Type guard functions use `is{Type}`: `isVerification()`, `isFileAsset()`, `isFileImage()`, `isNumeric()`, `isRetryableError()`

**Variables:**

- Entity collections use descriptive plural names with type suffix: `executedEntities`, `transferEntities`, `lsp3ProfileEntities`
- Populated/enriched entities add `populated` prefix: `populatedExecuteEntities`, `populatedLsp3ProfileEntities`
- Valid/verified entity collections add `valid` prefix: `validUniversalProfiles`, `validDigitalAssets`
- New entity collections add `new` prefix: `newUniversalProfiles`, `newDigitalAssets`
- Maps and Sets use descriptive names without `Map`/`Set` suffix (context makes it clear from type annotation)
- Constants use `UPPER_SNAKE_CASE`: `RPC_URL`, `FETCH_LIMIT`, `MULTICALL_ADDRESS`, `LSP26_ADDRESS`

**Types:**

- Use `PascalCase` for all types, interfaces, and enums: `Context`, `ExtractParams`, `FieldSelection`
- Interface names are plain nouns (no `I` prefix): `VerifyParams`, `PopulateParams`, `ChillMintTransfer`
- TypeORM entity types imported directly from `@chillwhales/typeorm`: `UniversalProfile`, `DigitalAsset`, `Transfer`

## Code Style

**Formatting:**

- Prettier (v3.5.3+)
- Config at `.prettierrc`:
  - `tabWidth: 2` (spaces, not tabs)
  - `printWidth: 100`
  - `singleQuote: true`
  - `trailingComma: "all"`
  - Plugin: `prettier-plugin-organize-imports` (auto-sorts imports)
- Run with `pnpm format` at root

**Linting:**

- No ESLint configuration detected in the project
- Prettier serves as the sole style enforcer

## Import Organization

**Order (enforced by prettier-plugin-organize-imports):**

1. Path alias imports: `import { Context } from '@/types'`
2. Internal workspace packages: `import { UniversalProfile } from '@chillwhales/typeorm'`
3. External dependencies: `import { v4 as uuidv4 } from 'uuid'`
4. Relative imports: `import { scanLogs } from './scanner'`

**Path Aliases:**

- The `@/*` alias maps to `src/*` in the indexer package (configured in `packages/indexer/tsconfig.json`)
- Use `@/utils`, `@/types`, `@/constants`, `@/app` for internal imports within the indexer package
- Other packages (abi, typeorm) do not use path aliases

**Namespace Imports:**

- Utils are frequently imported as a namespace: `import * as Utils from '@/utils'`
- Handlers are imported as a namespace: `import * as Handlers from './handlers'`
- ABI contracts use aliased namespace imports:
  ```typescript
  import { LSP0ERC725Account as LSP0 } from '@chillwhales/abi';
  import { LSP7DigitalAsset as LSP7 } from '@chillwhales/abi';
  ```

## Error Handling

**Patterns:**

- **Return error objects instead of throwing**: Functions like `decodeVerifiableUri()` and `getDataFromURL()` return error information as data rather than throwing exceptions:
  ```typescript
  return {
    fetchErrorMessage: error.toString(),
    fetchErrorCode: null,
    fetchErrorStatus: null,
  };
  ```
- **Check-and-return-early pattern**: Functions validate inputs at the top and return error objects for invalid states:
  ```typescript
  if (!lsp3Profile.url)
    return {
      fetchErrorMessage: 'Error: Missing URL',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };
  ```
- **Empty catch blocks for non-critical failures**: Multicall verification uses empty catch blocks (`catch {}`) when individual call failures should be silently ignored (see `packages/indexer/src/utils/universalProfile.ts` lines 89-121)
- **Retryable error detection**: `isRetryableError()` in `packages/indexer/src/utils/index.ts` classifies HTTP errors and network errors as retryable vs. permanent
- **Retry counting**: Entities track `retryCount` and `fetchErrorCode`/`fetchErrorMessage`/`fetchErrorStatus` fields for retry logic

## Logging

**Framework:** Subsquid's built-in `context.log` (not console)

**Patterns:**

- Always log as structured JSON via `JSON.stringify()`:
  ```typescript
  context.log.info(
    JSON.stringify({
      message: "Saving 'UniversalProfile' entities.",
      universalProfilesCount: newUniversalProfiles.size,
    }),
  );
  ```
- Use `context.log.info()` for operational events (entity counts, processing status)
- Use `context.log.warn()` for non-fatal issues
- Include entity counts in every log message for observability
- Log before and after significant operations (verification, persistence, fetching)
- Conditional logging: only log when there are entities to report:
  ```typescript
  if (newUniversalProfiles.size) {
    context.log.info(JSON.stringify({ message: '...' }));
  }
  ```

## Comments

**When to Comment:**

- JSDoc-style block comments for module-level documentation (see `packages/indexer/src/constants/lsp29.ts`)
- Inline `///` comments to denote Solidity event signatures being handled:
  ```typescript
  /// event Executed(uint256,address,uint256,bytes4);
  context.store.insert(populatedExecuteEntities),
  ```
- Section separator comments using `// ============================================================================`:
  ```typescript
  // ============================================================================
  // Extract functions - Create entities from event logs
  // ============================================================================
  ```
- Inline comments for clarifying LSP standard references and data key purposes
- Group-separator comments: `// Marketplace extension events`, `// LSP29 Encrypted Assets`

**JSDoc/TSDoc:**

- Used sparingly, primarily for constants and data key definitions
- Not systematically used on functions

## Function Design

**Size:**

- Handler functions can be very large (100-300+ lines) as they orchestrate full workflows
- Utility extract/populate functions are typically compact (10-50 lines)
- No strict size limit enforced

**Parameters:**

- **Named parameters via destructured objects** for functions with 2+ parameters:
  ```typescript
  export async function decimalsHandler({
    context,
    newDigitalAssets,
  }: {
    context: Context;
    newDigitalAssets: Map<string, DigitalAsset>;
  }) { ... }
  ```
- Inline type annotations on destructured params (not separate interfaces) for most functions
- Some functions define a separate `interface PopulateParams` when reused
- The `context: Context` parameter appears in nearly every function

**Return Values:**

- Functions typically return entity instances or arrays/maps of entities
- Async functions return `Promise<...>` implicitly
- Error states returned as objects with `fetchErrorMessage` fields (not thrown)
- No consistent use of `Result` type or discriminated unions

## Module Design

**Exports:**

- Each utility directory has an `index.ts` barrel file re-exporting sub-modules
- Namespace re-exports used heavily: `export * as DataChanged from './dataChanged'`
- Handler barrel file (`packages/indexer/src/app/handlers/index.ts`) uses named exports: `export { decimalsHandler } from './decimalsHandler'`
- Each util module exports two primary functions: `extract()` and `populate()`
  - `extract()`: Pure function that decodes a log event into an entity
  - `populate()`: Enriches entities with relationship references (FK links)
  - Some modules also export `extractSubEntities()` and `clearSubEntities()` for complex entities with child records

**Barrel Files:**

- Every directory uses `index.ts` as its entry point
- `packages/indexer/src/utils/index.ts` aggregates all utility modules plus standalone helper functions
- `packages/indexer/src/app/handlers/index.ts` re-exports all handlers

## Entity Construction Pattern

**Immutable Entity Pattern:** Entities are constructed via `new EntityClass({ ...props })` and spread-updated rather than mutated:

```typescript
new UniversalProfile({
  ...validUniversalProfiles.get(universalProfile.id)!,
  lsp3Profile: new LSP3Profile({ id }),
});
```

**ID Generation:**

- Unique events: `uuidv4()` for non-deterministic IDs (e.g., `Executed`, `Transfer`, `Follow`)
- Addressable entities: Contract address as ID (e.g., `UniversalProfile.id = address`)
- Composite entities: String concatenation (e.g., `generateTokenId()` returns `${address} - ${tokenId}`)
- Deterministic events: `generateListingEntityId()` returns `${address}-${listingId}` for upsert-safe IDs

## Data Flow Convention

**Three-phase processing pattern used consistently:**

1. **Scan** (`scanLogs`): Iterate blocks/logs, decode events, create raw entities
2. **Verify** (`verifyEntities`): Check addresses against on-chain contracts via multicall
3. **Populate** (`populateEntities`): Enrich entities with FK relationships to verified addresses

---

_Convention analysis: 2026-02-06_
