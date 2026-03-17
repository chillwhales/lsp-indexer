# T01: 02-new-handlers-structured-logging 01

**Slice:** S02 — **Milestone:** M001

## Description

Build the structured logging module that provides consistent JSON log output across all pipeline steps.

Purpose: INFR-01 and INFR-02 require structured JSON logs with consistent field schemas (`step`, `level`, `blockRange`, `entityCount`) filterable by severity and pipeline step. This plan creates the logger factory that all other pipeline code will consume.

Output: A `logger.ts` module exporting `createStepLogger()` for pipeline step loggers that wrap Subsquid's `context.log.child()`, plus `initFileLogger()` / `getFileLogger()` for pino-based rotating file output. Unit tests proving level filtering and field schemas.

## Must-Haves

- [ ] 'Logger factory produces child loggers with persistent step field on every log line'
- [ ] 'Logger respects LOG_LEVEL env var override regardless of NODE_ENV'
- [ ] 'Logger outputs structured JSON to both stdout and rotating file'
- [ ] 'Four severity levels (debug, info, warn, error) are supported'

## Files

- `packages/indexer-v2/src/core/logger.ts`
- `packages/indexer-v2/src/core/__tests__/logger.test.ts`
- `packages/indexer-v2/package.json`
