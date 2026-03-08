---
phase: 11-server-actions-publish-readiness
plan: 02
subsystem: infra
tags: [publint, arethetypeswrong, npm-publish, exports-map, tsup, bundle-validation]

# Dependency graph
requires:
  - phase: 11-01
    provides: All 4 packages build cleanly with validated exports maps and Zod validation wired
provides:
  - Zero-error publint validation across all 4 packages
  - Zero-error arethetypeswrong validation across all 4 packages (node10/node16/bundler)
  - Clean npm pack output (only dist/ files) for all 4 packages
  - Server/client bundle separation verified
  - Workspace-level validate:publint, validate:attw, validate:publish scripts
affects: []

# Tech tracking
tech-stack:
  added: [publint, @arethetypeswrong/cli]
  patterns: [typesVersions for node10 resolution fallback on multi-entry packages]

key-files:
  created: []
  modified:
    - package.json
    - packages/next/package.json

key-decisions:
  - "Added typesVersions to @lsp-indexer/next for node10 resolution of ./server entry — attw flagged NoResolution for node10 without it"

patterns-established:
  - "typesVersions fallback: multi-entry packages need typesVersions for node10 resolution even with exports map"
  - "validate:publish script: run publint + attw as CI-ready quality gate before npm publish"

requirements-completed: [ACTION-02, DX-03]

# Metrics
duration: 3min
completed: 2026-03-05
---

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
