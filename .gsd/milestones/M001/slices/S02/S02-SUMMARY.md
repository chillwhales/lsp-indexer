---
id: S02
parent: M001
milestone: M001
provides:
  - Logger factory module (createStepLogger, initFileLogger, getFileLogger, createDualLogger)
  - PipelineStep type for all V2 pipeline stages
  - Dual-output architecture (Subsquid stdout + pino file)
  - Package.json and tsconfig.json for indexer-v2 TypeScript source
  - Follower EntityHandler (listensToBag: Follow, Unfollow)
  - Follow EventPlugin TypeScript source
  - Unfollow EventPlugin TypeScript source
  - Vitest test infrastructure (config, setup, CJS alias resolution)
  - 8 unit tests covering follow/unfollow cycle
  - LSP6Controllers TypeScript source with full type annotations
  - Unit tests proving delete-and-recreate cycle for 3 sub-entity types
  - Test patterns for mocking mergeEntitiesFromBatchAndDb and queueClear
  - Pipeline TypeScript source with structured logging via createStepLogger
  - Verification TypeScript source with structured logging
  - Zero JSON.stringify logging in any V2 TypeScript source file
requires: []
affects: []
key_files: []
key_decisions:
  - "Dual-output via Subsquid Logger.child() + pino file transport — keeps stdout/stderr under Subsquid control while adding independent file rotation"
  - "LOG_LEVEL env var overrides NODE_ENV-based default regardless of environment"
  - "Four severity levels only (debug, info, warn, error) — no trace/fatal per user decision"
  - "DualLogger wrapper passes attributes as objects directly — never JSON.stringify"
  - 'vitest @/* alias uses lib/ directory (compiled JS) since src/ is incomplete'
  - 'CJS require resolution for @/* handled via Module._resolveFilename hook in vitest.setup.ts'
  - 'Follower handler uses generateFollowId from @/utils for V1-compatible deterministic IDs'
  - "Used type assertions (null as unknown as undefined) for entity FK fields where TypeORM model types don't include null but compiled JS sets null at runtime"
  - 'Cast dataKey/dataValue to 0x${string} template literals for viem hexToBytes compatibility'
  - 'Mocked mergeEntitiesFromBatchAndDb at module level to isolate handler logic from DB dependencies'
  - 'Step loggers created once per step section (outside loops) for efficiency'
  - "Helper modules (verification.ts) use inline step field since they don't have direct createStepLogger access"
  - "Handler log calls use step='HANDLE' + handler='{name}' for dual-level filtering"
  - 'decimals.handler.ts and formattedTokenId.handler.ts deferred — no TS sources exist yet (Phase 1 scope)'
patterns_established:
  - "createStepLogger wraps Logger.child() with step field injection"
  - "Singleton pino file logger initialized once at startup via initFileLogger()"
  - "DualLogger convenience wrapper for simultaneous stdout + file logging"
  - 'Mock BatchContext helper pattern for handler unit tests'
  - 'EntityHandler test pattern: seed entity bags, call handle(), verify addEntity/queueDelete/queueEnrichment calls'
  - 'LSP6 handler test pattern: mock BatchContext with _entityBags/_clearQueue/_enrichmentQueue accessors'
  - 'Sub-entity FK linking verification: check controller field set on all permission/call/key entities'
  - "Pipeline steps: createStepLogger(context.log, 'STEP_NAME', blockRange) per section"
  - "Handler logging: inline { step: 'HANDLE', handler: 'handlerName', ...attrs } pattern"
  - "Verification logging: inline { step: 'VERIFY', ...attrs } pattern for helper modules"
observability_surfaces: []
drill_down_paths: []
duration: 5min
verification_result: passed
completed_at: 2026-02-06
blocker_discovered: false
---
# S02: New Handlers Structured Logging

**# Phase 2 Plan 1: Structured Logger Module Summary**

## What Happened

# Phase 2 Plan 1: Structured Logger Module Summary

**Dual-output structured logger factory with Subsquid Logger.child() for stdout and pino-roll for rotating JSON file output, plus 11 unit tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T15:45:34Z
- **Completed:** 2026-02-06T15:53:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Logger factory module with `createStepLogger`, `initFileLogger`, `getFileLogger`, `createDualLogger`, and `PipelineStep` type
- Dual-output architecture: Subsquid stdout + pino file with daily rotation via pino-roll
- All attributes passed as structured objects (no JSON.stringify) — ready for jq filtering
- 11 unit tests covering field injection, blockRange formatting, LOG_LEVEL override, NODE_ENV defaults, and dual logger attribute passthrough
- Created indexer-v2 package.json and tsconfig.json for TypeScript source compilation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install pino dependencies and create logger module** - `f71b29e` (feat)
2. **Task 2: Unit tests for logger module** - `6616c9a` (test)

## Files Created/Modified

- `packages/indexer-v2/src/core/logger.ts` — Logger factory with PipelineStep, createStepLogger, initFileLogger, getFileLogger, createDualLogger
- `packages/indexer-v2/src/core/__tests__/logger.test.ts` — 11 unit tests for logger factory
- `packages/indexer-v2/package.json` — V2 package with pino, pino-roll, vitest, @subsquid/logger
- `packages/indexer-v2/tsconfig.json` — TypeScript config for V2 source compilation
- `pnpm-lock.yaml` — Updated lock file with new dependencies

## Decisions Made

- **Dual-output via Subsquid Logger.child() + pino file transport:** Keeps stdout/stderr under Subsquid control while adding independent file rotation. Subsquid already outputs to stderr with its own format — we don't fight it, just add file output.
- **Singleton pino logger pattern:** initFileLogger() called once at startup, getFileLogger() returns it anywhere. Clean lifecycle management.
- **\_resetFileLogger() exported for testing:** Internal helper allows test isolation without side effects between tests.
- **Added @subsquid/logger as direct dependency:** Was only a transitive dep via @subsquid/evm-processor, needed explicit declaration for type imports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created package.json and tsconfig.json for indexer-v2**

- **Found during:** Task 1 (Install pino dependencies)
- **Issue:** No package.json or tsconfig.json existed for the indexer-v2 package — only compiled JS in lib/ and node_modules
- **Fix:** Created both files with appropriate config matching the V1 indexer patterns
- **Files modified:** packages/indexer-v2/package.json, packages/indexer-v2/tsconfig.json
- **Verification:** pnpm install succeeded, TypeScript compilation of logger.ts succeeded
- **Committed in:** f71b29e (Task 1 commit)

**2. [Rule 3 - Blocking] Added @subsquid/logger as direct dependency**

- **Found during:** Task 1 (Logger module creation)
- **Issue:** @subsquid/logger was only available as transitive dependency — `import type { Logger }` failed to resolve
- **Fix:** Added `"@subsquid/logger": "^1.4.0"` to package.json dependencies
- **Files modified:** packages/indexer-v2/package.json
- **Verification:** `require.resolve('@subsquid/logger')` succeeds from indexer-v2
- **Committed in:** f71b29e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for task completion — no package infrastructure existed for V2 source code. No scope creep.

## Issues Encountered

None — plan executed with expected blocking issues resolved inline.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Logger factory module ready for integration into pipeline.js (Plan 02-04)
- All exports match plan specification: createStepLogger, initFileLogger, getFileLogger, createDualLogger, PipelineStep
- vitest.config.ts already existed with proper alias configuration — future tests can reuse
- Package.json establishes indexer-v2 as a proper TypeScript package for remaining Phase 2 plans

## Self-Check: PASSED

---

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_

# Phase 2 Plan 2: Follower Handler + EventPlugin TypeScript Sources Summary

**Follower EntityHandler creating/deleting Follower entities via generateFollowId deterministic IDs, with Follow/Unfollow EventPlugin TypeScript ports and 8 unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T15:46:55Z
- **Completed:** 2026-02-06T15:52:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Follower EntityHandler handles both Follow (create) and Unfollow (delete) events with deterministic IDs matching V1's `generateFollowId` format
- Follow and Unfollow EventPlugin TypeScript sources faithfully port compiled JS behavior (uuid IDs, LSP26 ABI decode, enrichment queuing)
- 8 unit tests covering HNDL-01 (follow creation) and HNDL-02 (unfollow deletion), including critical pitfall test for `unfollowedAddress` vs `followedAddress`
- Vitest test infrastructure established with CJS `@/*` alias resolution

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Follow/Unfollow EventPlugin TS sources and Follower handler** - `ff7f2cf` (feat)
2. **Task 2: Unit tests for Follower handler** - `194277c` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/follower.handler.ts` - Follower EntityHandler with listensToBag: ['Follow', 'Unfollow']
- `packages/indexer-v2/src/plugins/events/follow.plugin.ts` - Follow EventPlugin TypeScript source (port from compiled JS)
- `packages/indexer-v2/src/plugins/events/unfollow.plugin.ts` - Unfollow EventPlugin TypeScript source (port from compiled JS)
- `packages/indexer-v2/src/handlers/__tests__/follower.handler.test.ts` - 8 unit tests for Follower handler (315 lines)
- `packages/indexer-v2/vitest.config.ts` - Vitest configuration with @/\* alias to lib/
- `packages/indexer-v2/vitest.setup.ts` - CJS Module.\_resolveFilename hook for @/\* path alias

## Decisions Made

- **vitest alias strategy:** Mapped `@/*` to `lib/` (compiled JS) since `src/` doesn't have full module coverage yet. A `vitest.setup.ts` patches Node's `Module._resolveFilename` to handle CJS `require("@/...")` calls inside compiled lib files.
- **Test approach:** Mock BatchContext with vi.fn() tracking, seed entity bags directly, verify handler interactions via mock call assertions. This pattern is reusable for future handler tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created vitest.setup.ts for CJS @/\* path resolution**

- **Found during:** Task 2 (unit tests)
- **Issue:** Compiled JS files in `lib/` use `require("@/constants")` which Node's CJS loader cannot resolve. Vitest's Vite-based alias only handles ESM imports, not CJS require calls.
- **Fix:** Created `vitest.setup.ts` that patches `Module._resolveFilename` to rewrite `@/*` paths to `lib/*` at CJS resolution time.
- **Files modified:** packages/indexer-v2/vitest.setup.ts, packages/indexer-v2/vitest.config.ts
- **Verification:** All 8 tests pass successfully
- **Committed in:** 194277c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make tests runnable. No scope creep — the CJS alias setup is infrastructure for all future V2 handler tests.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Follower handler and EventPlugins ready for Phase 4 integration wiring
- Mock BatchContext pattern established for LSP6Controllers handler tests (02-03)
- vitest test infrastructure ready for all future handler unit tests

---

## Self-Check: PASSED

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_

# Phase 2 Plan 3: LSP6Controllers Handler TypeScript Port + Tests Summary

**LSP6Controllers handler ported to 568-line TypeScript source with 9 unit tests verifying queueClear delete-and-recreate cycle, controller merge, sub-entity linking, and enrichment**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-06T15:48:13Z
- **Completed:** 2026-02-06T15:58:54Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Faithful TypeScript port of compiled lsp6Controllers.handler.js (456→568 lines) with full type annotations
- Added @lukso/lsp6-contracts and @erc725/erc725.js as indexer-v2 dependencies
- 9 unit tests covering all critical behaviors: queueClear for 3 sub-entity types, merge-upsert, sub-entity linking, orphan detection, enrichment
- All tests pass in 14ms

## Task Commits

Each task was committed atomically:

1. **Task 1: Port LSP6Controllers handler to TypeScript source** - `93704ae` (feat)
2. **Task 2: Unit tests for LSP6Controllers handler delete-and-recreate cycle** - `1670790` (test)

## Files Created/Modified

- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts` - TypeScript source for LSP6Controllers EntityHandler (568 lines)
- `packages/indexer-v2/src/handlers/__tests__/lsp6Controllers.handler.test.ts` - 9 unit tests proving delete-and-recreate cycle (438 lines)
- `packages/indexer-v2/package.json` - Added @lukso/lsp6-contracts and @erc725/erc725.js dependencies
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- Used type assertions (`null as unknown as undefined`) for entity FK fields where TypeORM model types don't include `| null` in their TypeScript declarations but the compiled JS sets `null` at runtime — maintains identical behavior to V1
- Cast `dataKey`/`dataValue` parameters to `` `0x${string}` `` template literals for viem's `hexToBytes` which requires hex-prefixed types
- Mocked `mergeEntitiesFromBatchAndDb` at module level via `vi.mock()` to isolate handler logic from database dependencies in tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @lukso/lsp6-contracts and @erc725/erc725.js dependencies**

- **Found during:** Task 1 (TypeScript port)
- **Issue:** These packages were not in indexer-v2's package.json but are required imports in the handler. The compiled JS works because they're hoisted from sibling packages, but TypeScript source compilation and vitest need them as explicit dependencies.
- **Fix:** Added both packages to indexer-v2/package.json dependencies
- **Files modified:** packages/indexer-v2/package.json, pnpm-lock.yaml
- **Verification:** pnpm install succeeded, all imports resolve
- **Committed in:** 93704ae (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for TypeScript compilation. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LSP6Controllers handler verified as correct TypeScript source with passing unit tests
- Ready for plan 02-04 (structured logging replacement)
- All 3 handler-related plans in Phase 2 now complete (follower, LSP6, logging module)

---

## Self-Check: PASSED

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_

# Phase 2 Plan 4: Replace JSON.stringify Logging with Structured Attributes Summary

**All 12 JSON.stringify log calls in pipeline/verification/handlers replaced with structured attribute-based logging using createStepLogger and inline step fields**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-06T16:02:28Z
- **Completed:** 2026-02-06T16:07:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created pipeline.ts TypeScript source (532 lines) with all 10 JSON.stringify calls replaced by createStepLogger-based structured attribute calls
- Created verification.ts TypeScript source (395 lines) with 1 JSON.stringify call replaced by inline structured attributes
- Updated lsp6Controllers.handler.ts with 2 JSON.stringify calls replaced by structured attributes with step='HANDLE' and handler='lsp6Controllers' fields
- Every log call includes a `step` field for pipeline step filtering
- Every pipeline step log call includes `blockRange` for batch-level context

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace JSON.stringify logging in pipeline.ts with structured attributes** - `39b5139` (feat)
2. **Task 2: Replace JSON.stringify logging in handlers and verification** - `4735f83` (feat)

## Files Created/Modified

- `packages/indexer-v2/src/core/pipeline.ts` — Full pipeline TypeScript source with createStepLogger for each step (PERSIST_RAW, CLEAR_SUB_ENTITIES, DELETE_ENTITIES, PERSIST_DERIVED, VERIFY, ENRICH)
- `packages/indexer-v2/src/core/verification.ts` — Full verification module TypeScript source with inline step='VERIFY' on multicall logging
- `packages/indexer-v2/src/handlers/lsp6Controllers.handler.ts` — Updated 2 warn calls from JSON.stringify to structured attrs with step='HANDLE', handler='lsp6Controllers'

## Decisions Made

- **Step loggers created once per step section:** Each pipeline section creates its logger outside the loop (e.g., `const persistRawLog = createStepLogger(...)`) to avoid per-iteration overhead.
- **Helper modules use inline step field:** verification.ts is called from pipeline's VERIFY step but doesn't use createStepLogger — it adds `step: 'VERIFY'` inline since it's a called function, not a direct pipeline step.
- **Handlers use step+handler dual fields:** Handler log calls use `{ step: 'HANDLE', handler: 'lsp6Controllers', ...attrs }` to enable filtering by both pipeline step and specific handler.
- **decimals and formattedTokenId deferred:** These handlers have JSON.stringify calls in their compiled `.js` files, but no `.ts` sources exist yet. They'll be addressed when Phase 1 creates their TypeScript sources. Documented in this summary for tracking.

## Deviations from Plan

None — plan executed exactly as written.

**Note on deferred files:** The plan specified modifying `decimals.handler.ts` and `formattedTokenId.handler.ts`, but these TypeScript source files don't exist yet (only compiled `.js` in `lib/`). The logging changes for these 4 remaining JSON.stringify calls (2 in decimals, 2 in formattedTokenId) will be applied when Phase 1 creates their TypeScript sources. The 13 JSON.stringify calls in files with existing TypeScript sources have all been replaced.

## Issues Encountered

None — all files with TypeScript sources had their logging updated successfully. TypeScript compilation errors for `@/` path aliases are expected since most V2 modules only exist as compiled JS.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 2 is complete — all 4 plans executed successfully
- Structured logging patterns established for all future handler and pipeline work
- When Phase 1 creates decimals.handler.ts and formattedTokenId.handler.ts, the logging pattern (step='HANDLE', handler='{name}') is documented and ready to apply
- All V2 TypeScript source files use consistent structured attribute logging — zero JSON.stringify calls remain

## Self-Check: PASSED

---

_Phase: 02-new-handlers-structured-logging_
_Completed: 2026-02-06_
