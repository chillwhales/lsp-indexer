# S04: Improve Debug Logging Strategy

**Goal:** Add component-specific debug logging infrastructure with configurable filtering, enabling faster debugging of worker pool and metadata fetch operations without code modifications.
**Demo:** Add component-specific debug logging infrastructure with configurable filtering, enabling faster debugging of worker pool and metadata fetch operations without code modifications.

## Must-Haves


## Tasks

- [x] **T01: 03.1-improve-debug-logging-strategy 01** `est:6min`
  - Add component-specific debug logging infrastructure with configurable filtering, enabling faster debugging of worker pool and metadata fetch operations without code modifications.

Purpose: Accelerate debugging by allowing toggling debug logs via environment variables (LOG_LEVEL, DEBUG_COMPONENTS) without redeploying or adding console.log statements.

Output: Enhanced logger module with component filtering, debug logging in MetadataWorkerPool and metadata fetch handlers, plus unit tests.
- [x] **T02: 03.1-improve-debug-logging-strategy 02** `est:2min`
  - Fix missing imports for createComponentLogger and getFileLogger across all files that use these functions, making the debug logging infrastructure from Plan 01 fully functional.

Purpose: Complete the wiring for Phase 3.1's debug logging implementation by adding the import statements that were omitted in Plan 01. Without these imports, all debug logging code throws ReferenceError at runtime.

Output: All 5 files that use createComponentLogger/getFileLogger will have proper import statements, enabling debug logging to work when LOG_LEVEL=debug is set.
- [x] **T03: 03.1-improve-debug-logging-strategy 03** `est:3min`
  - Fix code quality issues in Phase 3.1 debug logging implementation: remove unnecessary type assertions and eliminate performance overhead by moving date calculations inside debug guards.

Purpose: Ensure TypeScript is used properly (no type assertions where proper types should be used) and that debug logging has zero performance impact when disabled (no Date.now() calls or duration calculations).

Output: Clean, performant debug logging code that follows TypeScript best practices and only executes debug-related operations when LOG_LEVEL=debug is enabled.
- [x] **T04: 03.1-improve-debug-logging-strategy 04** `est:3min`
  - Fix remaining code quality issues: eliminate ALL type assertions from test code by using proper TypeScript interfaces, and move logger creation to only where it's actually used (inside if/else blocks, not before).

Purpose: Follow TypeScript best practices completely - no type assertions anywhere, proper interface definitions, and variables declared in minimal scope.

Output: Zero type assertions, zero ESLint warnings, clean TypeScript code that leverages the type system properly.

## Files Likely Touched

- `packages/indexer-v2/src/core/logger.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/LSP3MetadataFetchHandler.ts`
- `packages/indexer-v2/src/handlers/LSP4MetadataFetchHandler.ts`
- `packages/indexer-v2/src/handlers/LSP29MetadataFetchHandler.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
