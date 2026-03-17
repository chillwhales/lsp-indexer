# T03: 03.1-improve-debug-logging-strategy 03

**Slice:** S04 — **Milestone:** M001

## Description

Fix code quality issues in Phase 3.1 debug logging implementation: remove unnecessary type assertions and eliminate performance overhead by moving date calculations inside debug guards.

Purpose: Ensure TypeScript is used properly (no type assertions where proper types should be used) and that debug logging has zero performance impact when disabled (no Date.now() calls or duration calculations).

Output: Clean, performant debug logging code that follows TypeScript best practices and only executes debug-related operations when LOG_LEVEL=debug is enabled.

## Must-Haves

- [ ] 'Type assertions removed from logger.test.ts - proper mock types used instead'
- [ ] 'Date.now() calculations only happen when debug logging is enabled'
- [ ] 'No performance overhead from debug logging when LOG_LEVEL=info'

## Files

- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
