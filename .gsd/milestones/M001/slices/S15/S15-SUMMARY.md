---
id: S15
parent: M001
milestone: M001
provides:
  - VALIDATION error category and VALIDATION_FAILED code in IndexerErrorCategory/IndexerErrorCode
  - IndexerError.fromValidationError() static factory method
  - validateInput() shared utility for all server actions
  - Zod input validation on all 21 exported server action functions
  - Zero-error publint validation across all 4 packages
  - Zero-error arethetypeswrong validation across all 4 packages (node10/node16/bundler)
  - Clean npm pack output (only dist/ files) for all 4 packages
  - Server/client bundle separation verified
  - Workspace-level validate:publint, validate:attw, validate:publish scripts
requires: []
affects: []
key_files: []
key_decisions:
  - 'PropertyKey[] for fromValidationError issues param — Zod v4 uses PropertyKey (includes symbol) instead of (string | number)[]'
  - 'Separate runtime import for schemas — import type for types, import for Zod schema values, matching isolatedModules requirement'
  - "Added typesVersions to @lsp-indexer/next for node10 resolution of ./server entry — attw flagged NoResolution for node10 without it"
patterns_established:
  - "validateInput pattern: validateInput(Schema, input, 'actionName') as first line of implementation overload"
  - 'Optional params guard: if (params) validateInput(...) for list actions with optional params'
  - "Scalar-to-object wrapping: validateInput(Schema, { address }, 'getX') for scalar-param actions"
  - "typesVersions fallback: multi-entry packages need typesVersions for node10 resolution even with exports map"
  - "validate:publish script: run publint + attw as CI-ready quality gate before npm publish"
observability_surfaces: []
drill_down_paths: []
duration: 3min
verification_result: passed
completed_at: 2026-03-05
blocker_discovered: false
---
# S15: Server Actions Publish Readiness

**# Phase 11 Plan 01: Server Action Input Validation Summary**

## What Happened

# Phase 11 Plan 01: Server Action Input Validation Summary

**Zod input validation on all 21 server action functions using existing param schemas from @lsp-indexer/types, with VALIDATION error category and field-level error details**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-05T14:19:00Z
- **Completed:** 2026-03-05T14:30:06Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Added VALIDATION error category and VALIDATION_FAILED code to the error type system
- Created IndexerError.fromValidationError() factory that formats Zod issues into developer-friendly field-level error messages
- Created shared validateInput() utility that all server actions use
- Wired Zod input validation into all 21 exported server action functions across 12 action files
- Invalid inputs now throw IndexerError with category 'VALIDATION' before reaching the GraphQL layer

## Task Commits

Each task was committed atomically:

1. **Task 1: Add VALIDATION error category + validation utility** - `7fa4238` (feat)
2. **Task 2: Wire Zod validation into all 12 action files** - `976d0ca` (feat)

## Files Created/Modified

- `packages/next/src/actions/validate.ts` - Shared validateInput utility using Zod safeParse
- `packages/types/src/errors.ts` - Added VALIDATION category, VALIDATION_FAILED code, validationErrors field
- `packages/node/src/errors/indexer-error.ts` - Added validationErrors field, toJSON output, fromValidationError factory
- `packages/next/package.json` - Added zod dependency
- `packages/next/src/actions/profiles.ts` - getProfile + getProfiles validation
- `packages/next/src/actions/digital-assets.ts` - getDigitalAsset + getDigitalAssets validation
- `packages/next/src/actions/nfts.ts` - getNft + getNfts validation
- `packages/next/src/actions/owned-assets.ts` - getOwnedAsset + getOwnedAssets validation
- `packages/next/src/actions/owned-tokens.ts` - getOwnedToken + getOwnedTokens validation
- `packages/next/src/actions/followers.ts` - getFollows + getFollowCount + getIsFollowing validation
- `packages/next/src/actions/creators.ts` - getCreators validation
- `packages/next/src/actions/issued-assets.ts` - getIssuedAssets validation
- `packages/next/src/actions/encrypted-assets.ts` - getEncryptedAssets validation
- `packages/next/src/actions/data-changed-events.ts` - getLatestDataChangedEvent + getDataChangedEvents validation
- `packages/next/src/actions/token-id-data-changed-events.ts` - getLatestTokenIdDataChangedEvent + getTokenIdDataChangedEvents validation
- `packages/next/src/actions/universal-receiver-events.ts` - getUniversalReceiverEvents validation

## Decisions Made

- Used PropertyKey[] (not (string | number)[]) for fromValidationError issues parameter to match Zod v4's type definition that includes symbol in path arrays
- Kept separate `import type` for types and `import` for runtime schema values rather than merging into a single import — maintains clear separation and compatibility with isolatedModules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PropertyKey type compatibility with Zod v4**

- **Found during:** Task 1 (validation utility type check)
- **Issue:** Plan specified `(string | number)[]` for issues path, but Zod v4 uses `PropertyKey[]` which includes `symbol`. Type error TS2345 on safeParse result.
- **Fix:** Changed `fromValidationError` parameter from `Array<{ path: (string | number)[]; message: string }>` to `Array<{ path: PropertyKey[]; message: string }>` and used `.map(String).join('.')` for path serialization
- **Files modified:** packages/node/src/errors/indexer-error.ts
- **Verification:** All three packages type-check cleanly
- **Committed in:** 7fa4238 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type signature adjustment for Zod v4 compatibility. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All server actions now validate inputs before calling service functions
- Ready for 11-02 (remaining publish readiness tasks)

---

_Phase: 11-server-actions-publish-readiness_
_Completed: 2026-03-05_

## Self-Check: PASSED

All key files exist on disk. All commit hashes verified in git log.

# Phase 11 Plan 02: Publish Validation & Bundle Audit Summary

**All 4 packages pass publint + arethetypeswrong with zero errors, clean npm pack output, and verified server/client bundle separation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T14:33:43Z
- **Completed:** 2026-03-05T14:36:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Installed publint and @arethetypeswrong/cli as workspace root devDependencies
- All 4 packages (@lsp-indexer/types, @lsp-indexer/node, @lsp-indexer/react, @lsp-indexer/next) pass publint with zero errors
- All 4 packages pass attw across all resolution modes (node10, node16 CJS/ESM, bundler) — including @lsp-indexer/next's dual entry points (. and ./server)
- npm pack --dry-run confirms only dist/ files included for all 4 packages — no source files, config files, or test fixtures leak
- Server/client bundle separation verified: @lsp-indexer/node has no "use client" banner, @lsp-indexer/next main has "use client", @lsp-indexer/next/server has no "use client"
- Added validate:publint, validate:attw, and validate:publish scripts to root package.json for CI-ready validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install publish validation tools and run against all 4 packages** - `6ae2b55` (feat)
2. **Task 2: Bundle separation verification and npm pack audit** - no changes (verification-only task, all checks passed)

## Files Created/Modified

- `package.json` - Added publint + @arethetypeswrong/cli devDependencies and validate:publint/validate:attw/validate:publish scripts
- `packages/next/package.json` - Added typesVersions for node10 resolution of ./server entry point
- `pnpm-lock.yaml` - Updated lockfile with new dependencies

## Decisions Made

- Added `typesVersions` to `@lsp-indexer/next` for node10 resolution fallback — attw flagged `NoResolution` for `./server` entry under node10 without it. Other 3 packages (single entry point) didn't need typesVersions since node10 falls back to `types` field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed node10 resolution for @lsp-indexer/next/server entry**

- **Found during:** Task 1 (attw validation)
- **Issue:** attw flagged `NoResolution` for `@lsp-indexer/next/server` under node10 — `typesVersions` was missing and node10 can't resolve sub-path exports
- **Fix:** Added `typesVersions: { "*": { ".": ["./dist/index.d.ts"], "server": ["./dist/server.d.ts"] } }` to packages/next/package.json
- **Files modified:** packages/next/package.json
- **Verification:** Re-ran attw — all green (node10/node16/bundler) for both entry points
- **Committed in:** 6ae2b55 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Expected fix — plan pre-documented this as a likely attw finding. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 packages are npm publish-ready with zero validation errors
- Phase 11 complete — all server action and publish readiness requirements delivered
- Ready for milestone completion

---

_Phase: 11-server-actions-publish-readiness_
_Completed: 2026-03-05_

## Self-Check: PASSED

All key files exist on disk. All commit hashes verified in git log.
