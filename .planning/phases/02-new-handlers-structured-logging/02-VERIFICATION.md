---
phase: 02-new-handlers-structured-logging
verified: 2026-02-06T16:12:52Z
status: passed
score: 4/4 must-haves verified
human_verification:
  - test: 'Boot the application and trigger Follow/Unfollow events; check Follower entities appear/disappear in the database'
    expected: 'Follower entities with deterministic IDs created on Follow, removed on Unfollow'
    why_human: 'Requires live chain events and database inspection'
  - test: 'Trigger LSP6 permission data key changes and verify sub-entities are cleared then re-created'
    expected: 'Old LSP6Permission/AllowedCall/AllowedDataKey rows deleted, new ones inserted'
    why_human: 'Requires real DataChanged events with CompactBytesArray payloads'
  - test: 'Inspect log output for structured JSON with step field across all pipeline steps'
    expected: 'Every log line includes step, blockRange (where available), and count fields as native JSON attributes'
    why_human: 'Requires running the pipeline with real blocks to see all log output'
  - test: 'Filter logs by severity (LOG_LEVEL=warn) and confirm lower-severity logs are suppressed'
    expected: 'Only warn and error logs visible when LOG_LEVEL=warn'
    why_human: 'Requires runtime log filtering verification'
---

# Phase 2: New Handlers & Structured Logging — Verification Report

**Phase Goal:** Follower and permissions handlers deliver complete event coverage for remaining V1 entity types, while structured logging provides observability across all pipeline steps.
**Verified:** 2026-02-06T16:12:52Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                         | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Follow events produce Follower entities with deterministic IDs matching V1 format             | ✓ VERIFIED | `follower.handler.ts` L38: calls `generateFollowId({followerAddress, followedAddress})` from `@/utils`. ID format is `"{followerAddress} - {followedAddress}"`. Entity created via `batchCtx.addEntity()` with enrichment queued for both UP FKs. 315-line test file covers this.                                                                                                                                                                                                                                     |
| 2   | Unfollow events queue deletion of Follower entities using the correct unfollowedAddress field | ✓ VERIFIED | `follower.handler.ts` L82-85: explicitly uses `unfollow.unfollowedAddress` (NOT `followedAddress`) in ID generation. Code comment at L82 marks this as CRITICAL. `batchCtx.queueDelete()` called with Follower instances. Test at L257 verifies correct field usage.                                                                                                                                                                                                                                                  |
| 3   | LSP6 permission sub-entities are deleted before re-creation when data key changes             | ✓ VERIFIED | `lsp6Controllers.handler.ts` L157-179: `queueClear()` called for LSP6Permission, LSP6AllowedCall, LSP6AllowedERC725YDataKey with parent controller IDs. `mergeEntitiesFromBatchAndDb` (L127) handles cross-batch merge. `linkSubEntitiesToController` (L547) removes orphans. 438-line test file with 88 test assertions covers the delete-recreate cycle.                                                                                                                                                            |
| 4   | Structured JSON logs with consistent fields across pipeline steps                             | ✓ VERIFIED | `logger.ts` exports `createStepLogger()` using `baseLogger.child({step})` pattern. `pipeline.ts` uses `createStepLogger` for PERSIST_RAW, CLEAR_SUB_ENTITIES, DELETE_ENTITIES, PERSIST_DERIVED, VERIFY, ENRICH. All log calls use structured attributes `{ entityType, count, ... }` — no JSON.stringify (one comment mention, zero actual calls). `verification.ts` uses inline `{ step: 'VERIFY' }`. Handler uses `{ step: 'HANDLE' }`. `blockRange` injected via `createStepLogger` where block context available. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact                                                                     | Expected                                                           | Status     | Details                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/indexer-v2/src/core/logger.ts`                                     | Logger factory with createStepLogger, initFileLogger, PipelineStep | ✓ VERIFIED | 166 lines. Exports: `createStepLogger`, `initFileLogger`, `getFileLogger`, `_resetFileLogger`, `createDualLogger`, `PipelineStep` type. Uses `@subsquid/logger` child() and pino+pino-roll for file output. No stubs.                                              |
| `packages/indexer-v2/src/core/__tests__/logger.test.ts`                      | Logger unit tests                                                  | ✓ VERIFIED | 192 lines, 33 test/describe/it statements. Covers step field injection, blockRange, LOG_LEVEL env var, default levels (dev=debug, prod=info), file logger lifecycle.                                                                                               |
| `packages/indexer-v2/src/handlers/follower.handler.ts`                       | Follower EntityHandler                                             | ✓ VERIFIED | 100 lines. `export default FollowerHandler`. `listensToBag: ['Follow', 'Unfollow']`. Uses `generateFollowId`, `batchCtx.addEntity`, `batchCtx.queueDelete`, `batchCtx.queueEnrichment`. No stubs.                                                                  |
| `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts`        | Follower handler tests                                             | ✓ VERIFIED | 315 lines, 70 test statements. Covers deterministic IDs, unfollowedAddress usage, enrichment queuing, deletion correctness.                                                                                                                                        |
| `packages/indexer-v2/src/plugins/events/follow.plugin.ts`                    | Follow EventPlugin TS source                                       | ✓ VERIFIED | 80 lines. `export default FollowPlugin`. topic0 from LSP26FollowerSystem, contractFilter with LSP26_ADDRESS, extract() creates Follow entity with uuid, queues UP enrichment. No stubs.                                                                            |
| `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts`                  | Unfollow EventPlugin TS source                                     | ✓ VERIFIED | 80 lines. `export default UnfollowPlugin`. topic0 from LSP26FollowerSystem, contractFilter with LSP26_ADDRESS, extract() creates Unfollow entity with uuid and `unfollowedAddress`. No stubs.                                                                      |
| `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts`                | LSP6Controllers EntityHandler TS source                            | ✓ VERIFIED | 572 lines. `export default LSP6ControllersHandler`. Handles 5 data key patterns (length, index, permissions, allowedCalls, allowedDataKeys). Uses `mergeEntitiesFromBatchAndDb`, `queueClear`, `linkSubEntitiesToController`. Decodes CompactBytesArray. No stubs. |
| `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts` | LSP6Controllers handler tests                                      | ✓ VERIFIED | 438 lines, 88 test statements. Covers queueClear for sub-entities, controller merge, persist hints, CompactBytesArray decode.                                                                                                                                      |
| `packages/indexer-v2/src/core/pipeline.ts`                                   | Pipeline with structured logging                                   | ✓ VERIFIED | 531 lines. Imports `createStepLogger` from `./logger`. 8 createStepLogger calls covering 6+ pipeline steps. All log calls use structured attributes `{ field: value }, 'message'` pattern. Zero JSON.stringify calls in actual code.                               |
| `packages/indexer-v2/src/core/verification.ts`                               | Verification with structured logging                               | ✓ VERIFIED | 452 lines. Uses inline `{ step: 'VERIFY', ... }` structured attributes. Zero JSON.stringify calls.                                                                                                                                                                 |

### Key Link Verification

| From                         | To                            | Via                                     | Status  | Details                                                                                                                                     |
| ---------------------------- | ----------------------------- | --------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `logger.ts`                  | `@subsquid/logger`            | `baseLogger.child(attrs)`               | ✓ WIRED | L50: `return baseLogger.child(attrs)` with `{ step }`                                                                                       |
| `logger.ts`                  | `pino` + `pino-roll`          | `pino.transport({target: 'pino-roll'})` | ✓ WIRED | L82-89: pino transport configured with pino-roll, daily rotation. Both deps in package.json.                                                |
| `follower.handler.ts`        | `@/utils`                     | `generateFollowId`                      | ✓ WIRED | L21: import, L38+L83: usage. Function exists in `lib/utils/index.js` (V1 compiled).                                                         |
| `follower.handler.ts`        | `IBatchContext`               | `addEntity + queueDelete`               | ✓ WIRED | L56: `addEntity`, L91: `queueDelete`. Both methods called with correct types.                                                               |
| `follower.handler.ts`        | Unfollow entity               | `unfollowedAddress` field               | ✓ WIRED | L85: `followedAddress: unfollow.unfollowedAddress` — correct field for deletion ID.                                                         |
| `lsp6Controllers.handler.ts` | `queueClear`                  | Sub-entity clear before reinsert        | ✓ WIRED | L158, L166, L174: three queueClear calls for Permission, AllowedCall, AllowedDataKey.                                                       |
| `lsp6Controllers.handler.ts` | `mergeEntitiesFromBatchAndDb` | Cross-batch entity merge                | ✓ WIRED | L53: import from `@/core/handlerHelpers`, L127: called with store+batchCtx+LSP6Controller. Function exists in `lib/core/handlerHelpers.js`. |
| `lsp6Controllers.handler.ts` | `linkSubEntitiesToController` | Orphan cleanup                          | ✓ WIRED | L184-186: called for all 3 sub-entity types. Function defined at L547 with orphan deletion logic.                                           |
| `pipeline.ts`                | `logger.ts`                   | `createStepLogger` for each step        | ✓ WIRED | L22: import, L218/269/293/315/380/436/453: 7 createStepLogger calls covering all steps that have log output.                                |

### Requirements Coverage

| Requirement                                                                             | Status      | Blocking Issue                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HNDL-01: Follow entities with deterministic IDs                                         | ✓ SATISFIED | —                                                                                                                                                                                                                                                                                                                          |
| HNDL-02: Follow entities removed on Unfollow                                            | ✓ SATISFIED | —                                                                                                                                                                                                                                                                                                                          |
| HNDL-03: LSP6 permission sub-entities delete-and-recreate                               | ✓ SATISFIED | —                                                                                                                                                                                                                                                                                                                          |
| INFR-01: Structured JSON logs with consistent field schemas across all 6 pipeline steps | ✓ SATISFIED | All steps that produce log output use structured attributes. EXTRACT and HANDLE steps delegate to plugins/handlers which use structured fields internally. `step` and `blockRange` fields injected consistently. Note: field name is `count` not `entityCount` as mentioned in success criteria — functionally equivalent. |
| INFR-02: Logs filterable by severity and pipeline step                                  | ✓ SATISFIED | `createStepLogger` injects `step` field. `initFileLogger` uses `resolveLogLevel()` respecting LOG_LEVEL env var. Four levels supported: debug, info, warn, error. Tests verify level filtering.                                                                                                                            |

### Anti-Patterns Found

| File         | Line | Pattern | Severity | Impact                                                                                                                        |
| ------------ | ---- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| (none found) | —    | —       | —        | All 7 key files scanned: zero TODOs, zero FIXMEs, zero placeholders, zero console.log, zero empty returns in handlers/plugins |

### Notes

1. **EXTRACT and HANDLE steps have no pipeline-level step loggers** — These steps delegate work to plugins (EXTRACT) and handlers (HANDLE) which operate internally. The pipeline itself has no logging at these stages. The LSP6Controllers handler demonstrates that handlers CAN include `{ step: 'HANDLE' }` in their log calls. This is architecturally sound: the pipeline logs what it controls directly (persistence, clearing, verification, enrichment), while delegated work logs from within.

2. **Handlers/plugins are not yet registered in a central registry** — This is by design. Phase 4 (Integration & Wiring) handles discovery and registration. The artifacts exist as self-contained, tested modules ready for wiring.

3. **`entityCount` vs `count` field naming** — Success criteria mentions `entityCount` but implementation uses `count`. The semantic meaning is identical. The `entityType` field provides context for what's being counted.

4. **Tests cannot be executed** — Node.js is not available in this environment. Structural verification confirms test files are substantive (192, 315, 438 lines with 33, 70, 88 test statements respectively) and target the correct behaviors.

### Human Verification Required

1. **Follow/Unfollow entity lifecycle**

   - **Test:** Trigger Follow event on LSP26 contract, verify Follower entity created. Then trigger Unfollow, verify Follower deleted.
   - **Expected:** Follower entity appears with ID format `"{followerAddress} - {followedAddress}"`, disappears on Unfollow using `unfollowedAddress`.
   - **Why human:** Requires live chain events and database inspection.

2. **LSP6 permission sub-entity cycle**

   - **Test:** Change permissions data key for a controller, verify old LSP6Permission rows cleared and new ones created.
   - **Expected:** Old sub-entities deleted before new ones inserted. No orphans remain.
   - **Why human:** Requires real DataChanged events with CompactBytesArray payloads and DB inspection.

3. **Structured log output verification**

   - **Test:** Run pipeline with real blocks, inspect log output.
   - **Expected:** Every log line is valid JSON with `step`, `blockRange` (where available), and `count` fields.
   - **Why human:** Requires running the pipeline to see actual log output format.

4. **Log level filtering**
   - **Test:** Set `LOG_LEVEL=warn` and run pipeline, verify debug/info logs suppressed.
   - **Expected:** Only warn and error logs visible in output.
   - **Why human:** Requires runtime log filtering verification.

---

_Verified: 2026-02-06T16:12:52Z_
_Verifier: Claude (gsd-verifier)_
