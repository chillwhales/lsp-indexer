---
phase: 13-indexer-v1-cleanup
plan: 01
subsystem: infra
tags: [docker, ci, monorepo, cleanup]

# Dependency graph
requires:
  - phase: 12-replace-local-packages
    provides: all @chillwhales package swaps complete
provides:
  - Single canonical packages/indexer/ with @chillwhales/indexer name
  - Flat docker/ directory with promoted Docker files
  - Updated root scripts, eslint, CI, and .env.example
affects: [14-code-comments-cleanup, 15-ci-cd-workflows]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-indexer-canonical-naming]

key-files:
  created: []
  modified:
    - packages/indexer/package.json
    - docker/docker-compose.yml
    - docker/Dockerfile
    - docker/manage.sh
    - docker/entrypoint.sh
    - docker/README.md
    - package.json
    - eslint.config.ts
    - .github/workflows/ci.yml
    - .env.example

key-decisions:
  - "Dropped '. ./env.sh &&' prefix from root scripts — env.sh only existed at docker/v1/env.sh (deleted), indexer loads env via dotenv internally"
  - 'Updated CI branch triggers from refactor/indexer-v2 to refactor/indexer-v2-react (active working branch)'
  - 'Removed eslint ignore for packages/indexer/ — now the active code, should be linted'

patterns-established:
  - 'Single indexer package: @chillwhales/indexer at packages/indexer/'
  - 'Flat docker/ directory with manage.sh management script'

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04]

# Metrics
duration: 6min
completed: 2026-03-06
---

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
