# T01: 03.1-improve-debug-logging-strategy 01

**Slice:** S04 — **Milestone:** M001

## Description

Add component-specific debug logging infrastructure with configurable filtering, enabling faster debugging of worker pool and metadata fetch operations without code modifications.

Purpose: Accelerate debugging by allowing toggling debug logs via environment variables (LOG_LEVEL, DEBUG_COMPONENTS) without redeploying or adding console.log statements.

Output: Enhanced logger module with component filtering, debug logging in MetadataWorkerPool and metadata fetch handlers, plus unit tests.

## Must-Haves

- [ ] 'User can set LOG_LEVEL=debug and see debug-level logs from all components'
- [ ] 'User can set DEBUG_COMPONENTS=worker_pool and see only worker pool logs'
- [ ] 'User can trace worker pool operations without modifying code'
- [ ] 'User sees structured log output with timestamp, level, component, message, context fields'

## Files

- `packages/indexer-v2/src/core/logger.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/src/core/metadataWorkerPool.ts`
- `packages/indexer-v2/src/handlers/LSP3MetadataFetchHandler.ts`
- `packages/indexer-v2/src/handlers/LSP4MetadataFetchHandler.ts`
- `packages/indexer-v2/src/handlers/LSP29MetadataFetchHandler.ts`
