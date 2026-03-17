# S02: New Handlers Structured Logging

**Goal:** Build the structured logging module that provides consistent JSON log output across all pipeline steps.
**Demo:** Build the structured logging module that provides consistent JSON log output across all pipeline steps.

## Must-Haves


## Tasks

- [x] **T01: 02-new-handlers-structured-logging 01** `est:8min`
  - Build the structured logging module that provides consistent JSON log output across all pipeline steps.

Purpose: INFR-01 and INFR-02 require structured JSON logs with consistent field schemas (`step`, `level`, `blockRange`, `entityCount`) filterable by severity and pipeline step. This plan creates the logger factory that all other pipeline code will consume.

Output: A `logger.ts` module exporting `createStepLogger()` for pipeline step loggers that wrap Subsquid's `context.log.child()`, plus `initFileLogger()` / `getFileLogger()` for pino-based rotating file output. Unit tests proving level filtering and field schemas.
- [x] **T02: 02-new-handlers-structured-logging 02** `est:5min`
  - Build the Follower EntityHandler and TypeScript sources for Follow/Unfollow EventPlugins.

Purpose: HNDL-01 requires Follow events to create Follower entities with deterministic IDs. HNDL-02 requires Unfollow events to remove Follower entities via queueDelete. The EventPlugins already exist as compiled JS but need TypeScript source files for Phase 1's TypeScript migration. The Follower handler is entirely new.

Output: `follower.handler.ts` implementing EntityHandler with `listensToBag: ['Follow', 'Unfollow']`, TypeScript source files for both EventPlugins, and unit tests proving the follow/unfollow cycle with deterministic ID generation.
- [x] **T03: 02-new-handlers-structured-logging 03** `est:10min`
  - Create TypeScript source for the existing LSP6Controllers handler and write unit tests to verify the delete-and-recreate cycle works correctly.

Purpose: HNDL-03 requires that LSP6 permission sub-entities are correctly deleted and re-created on data key changes. The handler already exists as 456-line compiled JS with full implementation. The work is: (1) port to TypeScript source, (2) write unit tests proving the critical behaviors, (3) verify correctness against V1 behavior.

Output: `lsp6Controllers.handler.ts` as a type-safe source file matching the compiled JS, plus comprehensive unit tests covering the queueClear → recreate cycle, merge-upsert behavior, and orphan cleanup.
- [x] **T04: 02-new-handlers-structured-logging 04** `est:5min`
  - Replace all ad-hoc JSON.stringify logging across the V2 pipeline with structured attribute-based logging using the logger factory from Plan 01.

Purpose: INFR-01 requires consistent field schemas across all 6 pipeline steps. INFR-02 requires filterability by severity and pipeline step. The current codebase has 17 `JSON.stringify` log calls that embed structured data as string messages instead of proper structured attributes. This plan replaces them all.

Output: All `context.log.info(JSON.stringify({...}))` calls replaced with `stepLogger.info({ field: value }, 'message')` using `createStepLogger` from the logger module. Every log line includes the `step` field for filtering.

## Files Likely Touched

- `packages/indexer-v2/src/core/logger.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/package.json`
- `packages/indexer-v2/src/handlers/follower.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts`
- `packages/indexer-v2/src/plugins/events/follow.plugin.ts`
- `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts`
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts`
- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/core/verification.ts`
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
