# T04: 02-new-handlers-structured-logging 04

**Slice:** S02 — **Milestone:** M001

## Description

Replace all ad-hoc JSON.stringify logging across the V2 pipeline with structured attribute-based logging using the logger factory from Plan 01.

Purpose: INFR-01 requires consistent field schemas across all 6 pipeline steps. INFR-02 requires filterability by severity and pipeline step. The current codebase has 17 `JSON.stringify` log calls that embed structured data as string messages instead of proper structured attributes. This plan replaces them all.

Output: All `context.log.info(JSON.stringify({...}))` calls replaced with `stepLogger.info({ field: value }, 'message')` using `createStepLogger` from the logger module. Every log line includes the `step` field for filtering.

## Must-Haves

- [ ] 'All pipeline.ts log calls use structured attributes (not JSON.stringify)'
- [ ] 'All handler log calls use structured attributes (not JSON.stringify)'
- [ ] 'Every log line from pipeline steps includes the step field'
- [ ] 'Log calls include blockRange field where block context is available'

## Files

- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/core/verification.ts`
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`
- `packages/indexer-v2/src/handlers/decimals.handler.ts`
- `packages/indexer-v2/src/handlers/formattedTokenId.handler.ts`
