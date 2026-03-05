---
phase: 11-server-actions-publish-readiness
plan: 01
subsystem: api
tags: [zod, validation, server-actions, next.js, error-handling]

# Dependency graph
requires:
  - phase: 9.11
    provides: All 12 domain action files with 21 server action functions
provides:
  - VALIDATION error category and VALIDATION_FAILED code in IndexerErrorCategory/IndexerErrorCode
  - IndexerError.fromValidationError() static factory method
  - validateInput() shared utility for all server actions
  - Zod input validation on all 21 exported server action functions
affects: [11-02]

# Tech tracking
tech-stack:
  added: [zod (dependency of @lsp-indexer/next)]
  patterns: [validateInput utility pattern, Zod safeParse for server action validation]

key-files:
  created:
    - packages/next/src/actions/validate.ts
  modified:
    - packages/types/src/errors.ts
    - packages/node/src/errors/indexer-error.ts
    - packages/next/package.json
    - packages/next/src/actions/profiles.ts
    - packages/next/src/actions/digital-assets.ts
    - packages/next/src/actions/nfts.ts
    - packages/next/src/actions/owned-assets.ts
    - packages/next/src/actions/owned-tokens.ts
    - packages/next/src/actions/followers.ts
    - packages/next/src/actions/creators.ts
    - packages/next/src/actions/issued-assets.ts
    - packages/next/src/actions/encrypted-assets.ts
    - packages/next/src/actions/data-changed-events.ts
    - packages/next/src/actions/token-id-data-changed-events.ts
    - packages/next/src/actions/universal-receiver-events.ts

key-decisions:
  - 'PropertyKey[] for fromValidationError issues param — Zod v4 uses PropertyKey (includes symbol) instead of (string | number)[]'
  - 'Separate runtime import for schemas — import type for types, import for Zod schema values, matching isolatedModules requirement'

patterns-established:
  - "validateInput pattern: validateInput(Schema, input, 'actionName') as first line of implementation overload"
  - 'Optional params guard: if (params) validateInput(...) for list actions with optional params'
  - "Scalar-to-object wrapping: validateInput(Schema, { address }, 'getX') for scalar-param actions"

requirements-completed: [ACTION-01, ACTION-03]

# Metrics
duration: 11min
completed: 2026-03-05
---

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
