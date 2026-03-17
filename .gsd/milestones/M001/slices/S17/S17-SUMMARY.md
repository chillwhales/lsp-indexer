---
id: S17
parent: M001
milestone: M001
provides:
  - Single canonical packages/indexer/ with @chillwhales/indexer name
  - Flat docker/ directory with promoted Docker files
  - Updated root scripts, eslint, CI, and .env.example
  - Version-neutral comparison-tool (--source/--target only, no ComparisonMode)
  - All documentation reflects single-indexer, flat-docker reality
  - Zero v1/v2 references outside .planning/
requires: []
affects: []
key_files: []
key_decisions:
  - "Dropped '. ./env.sh &&' prefix from root scripts — env.sh only existed at docker/v1/env.sh (deleted), indexer loads env via dotenv internally"
  - 'Updated CI branch triggers from refactor/indexer-v2 to refactor/indexer-v2-react (active working branch)'
  - 'Removed eslint ignore for packages/indexer/ — now the active code, should be linted'
  - 'Removed KnownDivergence type and V1_V2_DIVERGENCES entirely — all diffs are now unexpected since v1 no longer exists'
  - 'Simplified RowDiff to single diffs field — no known/unexpected split needed without v1-v2 mode'
  - 'FK coverage always checks both endpoints — no v1-v2 branch that only checks target'
  - 'Kept refactor/indexer-v2-react branch name in AGENTS.md — it is the actual working branch name'
patterns_established:
  - 'Single indexer package: @chillwhales/indexer at packages/indexer/'
  - 'Flat docker/ directory with manage.sh management script'
  - 'Source/Target labels for comparison-tool (not V1/V2 or V2-A/V2-B)'
  - 'All documentation references flat docker/ with manage.sh'
observability_surfaces: []
drill_down_paths: []
duration: 8min
verification_result: passed
completed_at: 2026-03-06
blocker_discovered: false
---
# S17: Indexer V1 Cleanup

**# Phase 13 Plan 01: Delete v1, Rename v2 to Canonical Summary**

## What Happened

# Phase 13 Plan 01: Delete v1, Rename v2 to Canonical Summary

**Deleted v1 indexer + Docker, renamed v2 to canonical packages/indexer/ with @chillwhales/indexer name, promoted Docker to flat docker/, updated all root configs and CI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T09:32:16Z
- **Completed:** 2026-03-06T09:38:56Z
- **Tasks:** 3
- **Files modified:** 189

## Accomplishments

- Deleted entire v1 indexer package (8700+ lines removed) and renamed v2 to canonical packages/indexer/ with @chillwhales/indexer name
- Deleted docker/v1/, promoted docker/v2/ files to flat docker/ structure, renamed docker-v2.sh to manage.sh, updated all v2 references across compose/Dockerfile/manage.sh/entrypoint
- Updated root package.json (removed start:v2, dropped dead env.sh sourcing), eslint.config.ts, CI workflow, and .env.example — zero "indexer-v2" refs in operational configs
- Build validation: `pnpm --filter=@chillwhales/indexer build` succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete v1 package, rename v2 → canonical indexer** - `25b597b` (feat)
2. **Task 2: Delete v1 Docker, promote v2 Docker to flat docker/** - `1cb116d` (feat)
3. **Task 3: Update root configs, CI, and build validation** - `0ebda9a` (feat)

## Files Created/Modified

- `packages/indexer/package.json` — Renamed from @chillwhales/indexer-v2 to @chillwhales/indexer
- `docker/docker-compose.yml` — Promoted from docker/v2/, all v2 refs removed
- `docker/Dockerfile` — Promoted, updated build paths and package refs
- `docker/manage.sh` — Renamed from docker-v2.sh, all v2 refs removed
- `docker/entrypoint.sh` — Promoted, updated indexer path
- `docker/README.md` — Rewritten, removed v1/v2 comparison content
- `package.json` — Removed start:v2, dropped env.sh sourcing, start points to @chillwhales/indexer
- `eslint.config.ts` — Removed v1 ignore, updated tsconfig path to packages/indexer/
- `.github/workflows/ci.yml` — Updated branch triggers, removed v1 exclusion comment, build step uses @chillwhales/indexer
- `.env.example` — Removed v1/v2 commentary

## Decisions Made

- Dropped `. ./env.sh &&` prefix from root migration and start scripts — env.sh only existed at docker/v1/env.sh (now deleted); the indexer loads environment via dotenv internally
- Updated CI branch triggers from `refactor/indexer-v2` to `refactor/indexer-v2-react` — the active v1.1 working branch
- Removed eslint ignore for `packages/indexer/` — after rename, this is the active code that should be linted

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for Plan 02 (documentation cleanup across docs/ and .planning references)
- All v1 code and Docker artifacts removed
- Zero "indexer-v2" references in operational config files

---

_Phase: 13-indexer-v1-cleanup_
_Completed: 2026-03-06_

# Phase 13 Plan 02: Comparison Tool Cleanup & Documentation Sweep Summary

**Removed v1-v2 mode from comparison-tool (~400 lines deleted including V1_V2_DIVERGENCES), swept all documentation to eliminate v1/v2 references, deleted legacy planning artifacts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T09:42:14Z
- **Completed:** 2026-03-06T09:50:59Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- Removed ComparisonMode type, KnownDivergence interface, and V1_V2_DIVERGENCES array (~225 lines of dead code) from comparison-tool
- Simplified CLI to --source/--target only (removed --v1/--v2/--mode flags), hardcoded Source/Target labels
- Updated all 8 documentation files to reflect single-indexer, flat-docker reality
- Deleted PR_CLEANUP_PLAN.md and IMPROVEMENTS_ROADMAP.md legacy planning artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove v1 mode from comparison-tool** - `db78fbd` (feat)
2. **Task 2: Documentation sweep — eliminate all v1/v2 references** - `46cb52e` (docs)

## Files Created/Modified

- `packages/comparison-tool/package.json` — Updated description (removed "v1-v2 or v2-v2")
- `packages/comparison-tool/src/types.ts` — Deleted ComparisonMode, KnownDivergence, simplified RowDiff
- `packages/comparison-tool/src/cli.ts` — Removed --v1/--v2/--mode args, simplified usage text
- `packages/comparison-tool/src/comparisonEngine.ts` — Hardcoded Source/Target labels, removed mode branching, simplified diff logic
- `packages/comparison-tool/src/entityRegistry.ts` — Deleted V1_V2_DIVERGENCES (~225 lines), removed getKnownDivergences
- `packages/comparison-tool/src/reporter.ts` — Removed mode display, known divergences logic, simplified to single diff category
- `README.md` — Single indexer, flat docker/, manage.sh commands
- `docs/AGENTS.md` — 3 packages (not 4), @chillwhales/indexer build commands
- `docs/README.md` — Single indexer listing, Docker Setup label
- `docs/docker/README.md` — Flat docker/, manage.sh, removed v1 section and migration content
- `docs/docker/QUICKSTART.md` — Updated all paths and container names
- `docs/docker/REFERENCE.md` — ~50 references updated throughout

## Decisions Made

- Removed KnownDivergence type and V1_V2_DIVERGENCES entirely — all diffs are now unexpected since v1 no longer exists
- Simplified RowDiff interface to single `diffs` field — no known/unexpected split needed without v1-v2 mode
- FK coverage always checks both endpoints — removed conditional v1-v2 branch that only checked target
- Kept `refactor/indexer-v2-react` branch name reference in AGENTS.md — it is the actual working branch name, not a v2 product reference

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 13 complete — all v1 code, Docker artifacts, and documentation references cleaned up
- Zero "indexer-v2" or "v1-v2" references in any operational file outside .planning/
- Ready for Phase 14 (code comments cleanup & release prep)

---

_Phase: 13-indexer-v1-cleanup_
_Completed: 2026-03-06_
