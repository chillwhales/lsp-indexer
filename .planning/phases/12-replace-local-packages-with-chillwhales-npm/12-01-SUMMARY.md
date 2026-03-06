---
phase: 12-replace-local-packages-with-chillwhales-npm
plan: 01
subsystem: infra
tags: [npm, chillwhales, erc725, lsp1, zod, tsup, migration]

# Dependency graph
requires:
  - phase: 11-server-actions-and-publish-readiness
    provides: 4 publishable packages with publint + attw validation
provides:
  - '@chillwhales/erc725 and @chillwhales/lsp1 as npm dependencies replacing local packages'
  - 'DataKeyNameSchema and TypeIdNameSchema imported directly from upstream (Zod 4 compatible)'
  - 'packages/data-keys/ and packages/lsp1/ directories removed'
affects: [12-02, 13-indexer-v1-cleanup, 14-code-comments-cleanup]

# Tech tracking
tech-stack:
  added: ['@chillwhales/erc725@^0.1.1', '@chillwhales/lsp1@^0.1.1']
  patterns: ['Direct schema import from upstream @chillwhales packages']

key-files:
  created: []
  modified:
    - packages/types/package.json
    - packages/types/tsup.config.ts
    - packages/types/src/index.ts
    - packages/types/src/data-changed-events.ts
    - packages/types/src/token-id-data-changed-events.ts
    - packages/types/src/universal-receiver-events.ts
    - packages/node/package.json
    - packages/node/tsup.config.ts
    - packages/node/src/parsers/data-changed-events.ts
    - packages/node/src/parsers/token-id-data-changed-events.ts
    - packages/node/src/parsers/universal-receiver-events.ts
    - packages/node/src/services/data-changed-events.ts
    - packages/node/src/services/token-id-data-changed-events.ts
    - packages/node/src/services/universal-receiver-events.ts
    - apps/test/package.json
    - apps/test/src/app/data-changed-events/page.tsx
    - apps/test/src/app/token-id-data-changed-events/page.tsx
    - apps/test/src/app/universal-receiver-events/page.tsx

key-decisions:
  - 'Import DataKeyNameSchema and TypeIdNameSchema directly from @chillwhales/erc725 and @chillwhales/lsp1 (both use Zod 4, same as this repo)'

patterns-established:
  - 'Direct schema import from upstream @chillwhales packages — no local wrappers needed when Zod versions match'

requirements-completed: [MIGRATE-01, MIGRATE-02, MIGRATE-04]

# Metrics
duration: 5min
completed: 2026-03-05
---

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
