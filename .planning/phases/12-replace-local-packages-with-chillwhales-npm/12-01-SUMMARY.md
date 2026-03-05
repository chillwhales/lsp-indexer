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
  - 'Local Zod 4 DataKeyNameSchema and TypeIdNameSchema in registry-schemas.ts'
  - 'packages/data-keys/ and packages/lsp1/ directories removed'
affects: [12-02, 13-indexer-v1-cleanup, 14-code-comments-cleanup]

# Tech tracking
tech-stack:
  added: ['@chillwhales/erc725@^0.1.0', '@chillwhales/lsp1@^0.1.0']
  patterns: ['Local Zod 4 schema creation from upstream Zod 3 constant tuples']

key-files:
  created:
    - packages/types/src/registry-schemas.ts
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
  - 'Created local Zod 4 schemas from upstream DATA_KEY_NAMES/TYPE_ID_NAMES tuples to avoid Zod 3/4 incompatibility'
  - 'Used `as readonly [string, ...string[]]` cast for upstream tuple types that widen in .d.mts'

patterns-established:
  - 'Zod version bridge: import constants from upstream, create local Zod schemas when upstream uses different Zod major version'

requirements-completed: [MIGRATE-01, MIGRATE-02, MIGRATE-04]

# Metrics
duration: 5min
completed: 2026-03-05
---

# Phase 12 Plan 01: Replace Local Packages with @chillwhales NPM Summary

**Replaced local packages/data-keys/ and packages/lsp1/ with @chillwhales/erc725 and @chillwhales/lsp1 from npm, with Zod 4 schema bridge for cross-version compatibility**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T22:16:10Z
- **Completed:** 2026-03-05T22:21:24Z
- **Tasks:** 2
- **Files modified:** 19 modified, 1 created, 16 deleted

## Accomplishments

- All imports swapped from @lsp-indexer/data-keys → @chillwhales/erc725 and @lsp-indexer/lsp1 → @chillwhales/lsp1 across types, node, and test app packages
- Created registry-schemas.ts with local Zod 4 DataKeyNameSchema and TypeIdNameSchema from upstream constant tuples (bridging Zod 3/4 incompatibility)
- Deleted packages/data-keys/ and packages/lsp1/ directories (16 files removed)
- All 4 publishable packages build, pass publint and attw with zero errors
- Test app next build compiles successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap all imports to @chillwhales packages + handle Zod compatibility** - `cc9e5fa` (feat)
2. **Task 2: Delete local packages + install + build validation** - `61b611a` (chore)

## Files Created/Modified

- `packages/types/src/registry-schemas.ts` - Local Zod 4 schemas for DataKeyNameSchema and TypeIdNameSchema
- `packages/types/src/index.ts` - Added registry-schemas export
- `packages/types/src/data-changed-events.ts` - Swapped to local registry-schemas import
- `packages/types/src/token-id-data-changed-events.ts` - Swapped to local registry-schemas import
- `packages/types/src/universal-receiver-events.ts` - Swapped to local registry-schemas import
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

- Created local Zod 4 schemas in registry-schemas.ts instead of importing Zod 3 schemas from upstream — prevents runtime incompatibility between Zod 3 and Zod 4 schema composition
- Used `as readonly [string, ...string[]]` cast on upstream tuple types since the .d.mts may widen the const tuple type

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
