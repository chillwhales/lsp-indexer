---
id: T01
parent: S15
milestone: M001
provides:
  - VALIDATION error category and VALIDATION_FAILED code in IndexerErrorCategory/IndexerErrorCode
  - IndexerError.fromValidationError() static factory method
  - validateInput() shared utility for all server actions
  - Zod input validation on all 21 exported server action functions
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 11min
verification_result: passed
completed_at: 2026-03-05
blocker_discovered: false
---
# T01: 11-server-actions-publish-readiness 01

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
