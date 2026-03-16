---
phase: 25-test-app-public-publish-readiness-secure-env-variables-conditional-tabs-install-guide
plan: 01
subsystem: ui
tags: [env-config, react-context, conditional-rendering, security, next.js]

# Dependency graph
requires: []
provides:
  - EnvProvider context with boolean-only env availability flags
  - Conditional subscription provider mounting based on WS env vars
  - Conditional client/server mode toggle in PlaygroundPageLayout
affects: [25-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC env detection → boolean props → client context (no secret leakage)"
    - "Conditional provider wrapping based on env availability"

key-files:
  created:
    - apps/test/src/lib/env-config.ts
    - apps/test/src/components/env-provider.tsx
  modified:
    - apps/test/src/app/layout.tsx
    - apps/test/src/app/providers.tsx
    - apps/test/src/components/playground/page-layout.tsx

key-decisions:
  - "hasServerUrl checks only INDEXER_URL (no NEXT_PUBLIC fallback) per PUB-05 — Server tab only when explicit server env is set"
  - "Removed hardcoded proxyUrl='ws://localhost:4000' from NextSubscriptionProvider — let it use default /api/graphql for non-localhost deployments"
  - "No-mode scenario shows warning with setup instructions rather than crashing"

patterns-established:
  - "RSC → client boolean context: getEnvAvailability() in layout → EnvProvider → useEnvAvailability()"
  - "Conditional provider wrapping: helper function wraps children only when env available"

requirements-completed: [PUB-04, PUB-05, PUB-06]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 25 Plan 01: Env Availability Detection Summary

**Boolean-only env detection flowing RSC layout → EnvProvider context → conditional mode toggle and subscription providers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T06:45:03Z
- **Completed:** 2026-03-16T06:47:40Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created server-only `getEnvAvailability()` returning boolean flags (never leaks env values to client)
- Created `EnvProvider` + `useEnvAvailability()` client context for env-aware rendering
- Wired layout to pass env booleans through Providers (conditional WS) and EnvProvider
- Made `PlaygroundPageLayout` conditionally render mode toggle (both modes → toggle, single → auto-select, none → warning)
- Removed hardcoded `proxyUrl="ws://localhost:4000"` from NextSubscriptionProvider

## Task Commits

Each task was committed atomically:

1. **Task 1: Create env availability detection and React context** - `097c5cd` (feat)
2. **Task 2: Wire EnvProvider into layout, conditional providers, and conditional mode toggle** - `90778f2` (feat)

## Files Created/Modified
- `apps/test/src/lib/env-config.ts` - Server-only env availability detection (boolean flags only)
- `apps/test/src/components/env-provider.tsx` - Client React context for env availability
- `apps/test/src/app/layout.tsx` - Calls getEnvAvailability(), passes booleans to Providers and EnvProvider
- `apps/test/src/app/providers.tsx` - Conditional subscription provider wrapping based on WS availability
- `apps/test/src/components/playground/page-layout.tsx` - Conditional mode toggle with no-env warning

## Decisions Made
- `hasServerUrl` checks only `INDEXER_URL` (no NEXT_PUBLIC fallback) per PUB-05 — Server tab only appears when explicit server-side env is configured
- Removed hardcoded `proxyUrl="ws://localhost:4000"` from NextSubscriptionProvider to support non-localhost deployments
- No-mode scenario renders a warning with setup instructions rather than an empty or broken UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Env availability infrastructure complete, ready for Plan 02 (install guide / further publish readiness)
- All boolean flags flow correctly from RSC → client components
- No server secrets leak to client bundle

## Self-Check: PASSED

All 5 files verified on disk. Both task commits (097c5cd, 90778f2) verified in git log.

---
*Phase: 25-test-app-public-publish-readiness-secure-env-variables-conditional-tabs-install-guide*
*Completed: 2026-03-16*
