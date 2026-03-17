---
id: T01
parent: S16
milestone: M001
provides:
  - '@chillwhales/erc725 and @chillwhales/lsp1 as npm dependencies replacing local packages'
  - 'DataKeyNameSchema and TypeIdNameSchema imported directly from upstream (Zod 4 compatible)'
  - 'packages/data-keys/ and packages/lsp1/ directories removed'
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 5min
verification_result: passed
completed_at: 2026-03-05
blocker_discovered: false
---
# T01: 12-replace-local-packages-with-chillwhales-npm 01

**# Phase 12 Plan 01: Replace Local Packages with @chillwhales NPM Summary**

## What Happened

# Phase 12 Plan 01: Replace Local Packages with @chillwhales NPM Summary

**Replaced local packages/data-keys/ and packages/lsp1/ with @chillwhales/erc725@^0.1.1 and @chillwhales/lsp1@^0.1.1 from npm — direct schema and function imports, no local wrappers**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T22:16:10Z
- **Completed:** 2026-03-05T22:21:24Z
- **Tasks:** 2
- **Files modified:** 19 modified, 16 deleted

## Accomplishments

- All imports swapped from @lsp-indexer/data-keys → @chillwhales/erc725 and @lsp-indexer/lsp1 → @chillwhales/lsp1 across types, node, and test app packages
- DataKeyNameSchema and TypeIdNameSchema imported directly from upstream (both packages use Zod 4)
- Deleted packages/data-keys/ and packages/lsp1/ directories (16 files removed)
- All 4 publishable packages build, pass publint and attw with zero errors
- Test app next build compiles successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap all imports to @chillwhales packages + handle Zod compatibility** - `cc9e5fa` (feat)
2. **Task 2: Delete local packages + install + build validation** - `61b611a` (chore)

## Files Created/Modified

- `packages/types/src/data-changed-events.ts` - Import DataKeyNameSchema from @chillwhales/erc725
- `packages/types/src/token-id-data-changed-events.ts` - Import DataKeyNameSchema from @chillwhales/erc725
- `packages/types/src/universal-receiver-events.ts` - Import TypeIdNameSchema from @chillwhales/lsp1
- `packages/types/package.json` - @chillwhales/erc725 + @chillwhales/lsp1 deps
- `packages/types/tsup.config.ts` - Updated externals
- `packages/node/src/parsers/data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/parsers/token-id-data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/parsers/universal-receiver-events.ts` - @chillwhales/lsp1 import
- `packages/node/src/services/data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/services/token-id-data-changed-events.ts` - @chillwhales/erc725 import
- `packages/node/src/services/universal-receiver-events.ts` - @chillwhales/lsp1 import
- `packages/node/package.json` - @chillwhales deps
- `packages/node/tsup.config.ts` - Updated externals
- `apps/test/package.json` - @chillwhales deps
- `apps/test/src/app/data-changed-events/page.tsx` - Split imports
- `apps/test/src/app/token-id-data-changed-events/page.tsx` - Split imports
- `apps/test/src/app/universal-receiver-events/page.tsx` - Split imports
- `pnpm-lock.yaml` - Updated with npm @chillwhales packages

## Decisions Made

- Import DataKeyNameSchema and TypeIdNameSchema directly from upstream — both @chillwhales packages use Zod 4 (zod@^4.3.6), same as this repo

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan 12-02 (upstream contribution audit)
- All 4 packages build and validate cleanly with @chillwhales deps
- packages/data-keys/ and packages/lsp1/ fully removed from repo

---

_Phase: 12-replace-local-packages-with-chillwhales-npm_
_Completed: 2026-03-05_
