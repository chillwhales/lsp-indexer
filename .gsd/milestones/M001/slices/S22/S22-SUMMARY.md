---
id: S22
parent: M001
milestone: M001
provides:
  - Production Docker Compose pulling ghcr.io/chillwhales/lsp-indexer image
  - Production environment variable template (.env.prod.example)
  - Production deployment documentation in Docker README
requires: []
affects: []
key_files: []
key_decisions:
  - "Hardcode HASURA_GRAPHQL_METADATA_DEFAULTS as single-quoted YAML string — data connector URIs reference internal service names that won't change"
  - "PostgreSQL port not exposed in production — access only via internal Docker network"
  - "All 3 required vars use ${VAR:?message} syntax for fail-loud behavior"
patterns_established:
  - "Production compose mirrors dev but uses released image and hardens defaults"
  - "Required env vars use :? syntax to fail loudly with descriptive error messages"
observability_surfaces: []
drill_down_paths: []
duration: 1min
verification_result: passed
completed_at: 2026-03-09
blocker_discovered: false
---
# S22: Production Docker Compose

**# Phase 18 Plan 01: Production Docker Compose Summary**

## What Happened

# Phase 18 Plan 01: Production Docker Compose Summary

**Production compose file pulling ghcr.io/chillwhales/lsp-indexer image with fail-loud required env vars and hardened Hasura/PostgreSQL defaults**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-09T07:49:55Z
- **Completed:** 2026-03-09T07:51:51Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Production compose file uses released Docker image from ghcr.io instead of building from source
- Required variables (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) fail loudly with descriptive errors if unset
- PostgreSQL port not exposed, Hasura console and dev mode disabled by default
- Complete production environment template with all required and optional variables documented
- Docker README updated with production deployment instructions and comparison table

## Task Commits

Each task was committed atomically:

1. **Task 1: Create production compose file and env template** - `eeae64e` (feat)
2. **Task 2: Update Docker README with production instructions** - `8ae3f72` (docs)

## Files Created/Modified
- `docker/docker-compose.prod.yml` - Production compose pulling ghcr.io image, hardened defaults, no exposed DB port
- `docker/.env.prod.example` - Production environment template with required/optional sections
- `docker/README.md` - Added Production Deployment section with setup instructions and comparison table

## Decisions Made
- Hardcoded HASURA_GRAPHQL_METADATA_DEFAULTS as single-quoted YAML string — the data connector URIs reference internal service names that won't change between environments
- Used `:?` error syntax for all 3 required vars (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) for fail-loud behavior
- PostgreSQL port not exposed in production — database only accessible via internal Docker network

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 18 complete (single plan), ready for transition to next phase
- Production compose validated with `docker compose config`
- Dev compose confirmed unchanged

## Self-Check: PASSED

All created files exist. All commit hashes verified.

---
*Phase: 18-production-docker-compose*
*Completed: 2026-03-09*
