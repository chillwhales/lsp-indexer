# T02: 03.1-improve-debug-logging-strategy 02

**Slice:** S04 — **Milestone:** M001

## Description

Fix missing imports for createComponentLogger and getFileLogger across all files that use these functions, making the debug logging infrastructure from Plan 01 fully functional.

Purpose: Complete the wiring for Phase 3.1's debug logging implementation by adding the import statements that were omitted in Plan 01. Without these imports, all debug logging code throws ReferenceError at runtime.

Output: All 5 files that use createComponentLogger/getFileLogger will have proper import statements, enabling debug logging to work when LOG_LEVEL=debug is set.

## Must-Haves

- [ ] 'User can set LOG_LEVEL=debug and see debug-level logs from all components'
- [ ] 'User can trace worker pool operations without modifying code'
- [ ] 'User sees structured log output with timestamp, level, component, message, context fields'

## Files

- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/lsp3ProfileFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts`
- `packages/indexer-v2/src/handlers/lsp29EncryptedAssetFetch.handler.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
