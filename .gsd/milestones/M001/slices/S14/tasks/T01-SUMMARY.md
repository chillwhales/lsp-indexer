---
id: T01
parent: S14
milestone: M001
provides:
  - Type-safe SubscriptionConfig<TResult, TVariables, TRaw, TParsed> with extract function
  - 12 exported buildXWhere functions for domain subscription where clauses
  - IndexerSubscriptionProvider wired in test app
  - Subscriptions playground skeleton at /subscriptions
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 6min
verification_result: passed
completed_at: 2026-03-01
blocker_discovered: false
---
# T01: 10.1-subscription-foundation 01

**# Phase 10.1 Plan 01: Subscription Foundation Summary**

## What Happened

# Phase 10.1 Plan 01: Subscription Foundation Summary

**Type-safe 4-generic SubscriptionConfig with extract function replacing string dataKey, 12 exported buildXWhere functions, test app wired with IndexerSubscriptionProvider and playground skeleton**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-01T21:24:14Z
- **Completed:** 2026-03-01T21:30:51Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments

- Replaced stringly-typed `SubscriptionConfig<T>` with fully generic `SubscriptionConfig<TResult, TVariables, TRaw, TParsed>` — zero type assertions in the entire subscription data path
- TypedDocumentString now carries type information from codegen through extract → parser → consumer
- All 12 `buildXWhere` functions exported from `@lsp-indexer/node` (enabling domain sub-phases 10.2–10.13)
- Test app wired with `IndexerSubscriptionProvider` inside `QueryClientProvider` + playground skeleton page + nav link

## Task Commits

Each task was committed atomically:

1. **Task 1: Type-safety refactor — 4-generic SubscriptionConfig with extract function** - `f80d063` (refactor)
2. **Task 2: Export buildXWhere functions + wire test app + playground skeleton** - `5d2fc1c` (feat)
3. **Verification fix: Missing imports + use-client banner** - `9b1f549` (fix)

## Files Created/Modified

- `packages/node/src/subscriptions/types.ts` - New type-safe SubscriptionConfig with 4 generic params and extract function
- `packages/types/src/subscriptions.ts` - Removed old SubscriptionConfig<T>, updated SubscriptionClient interface to 4-generic structural types
- `packages/node/src/subscriptions/client.ts` - Updated createSubscription and executeSubscription to 4-generic with graphql-ws generic threading
- `packages/node/src/subscriptions/subscription-instance.ts` - Updated GenericSubscriptionInstance to 4-generic, replaced dataKey with extract()
- `packages/react/src/subscriptions/create-use-subscription.ts` - Updated UseSubscriptionClient and useSubscription to 4-generic, import SubscriptionConfig from @lsp-indexer/node
- `packages/node/src/index.ts` - Added export for subscriptions/types
- `packages/node/src/services/*.ts` - All 12 service files: added export to buildXWhere functions
- `apps/test/src/app/providers.tsx` - Wired IndexerSubscriptionProvider inside QueryClientProvider
- `apps/test/src/app/subscriptions/page.tsx` - Playground skeleton page with domain placeholder cards
- `apps/test/src/components/nav.tsx` - Added Radio icon import and subscriptions nav link

## Decisions Made

- SubscriptionConfig moved to `@lsp-indexer/node` since it depends on TypedDocumentString from codegen — the types package uses structural `{ toString(): string }` to avoid the import
- TResult threads through `executeSubscription` via `graphql-ws` `Client.subscribe<Data>()` — zero casts needed in the data path
- `extract` function replaces string `dataKey` for type-safe data extraction from GraphQL results

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing import statements in test app**

- **Found during:** Verification
- **Issue:** `providers.tsx` used `IndexerSubscriptionProvider` without importing it; `nav.tsx` used `Radio` icon without importing it
- **Fix:** Added missing imports
- **Files modified:** `apps/test/src/app/providers.tsx`, `apps/test/src/components/nav.tsx`
- **Commit:** `9b1f549`

**2. [Rule 1 - Bug] Pre-existing `@lsp-indexer/next` build failure — missing "use client" banner**

- **Found during:** Verification
- **Issue:** `@lsp-indexer/next` re-exports subscription context/provider (React hooks) but tsup config lacked `"use client"` banner, causing Next.js Turbopack to reject hooks in server component context. Verified as pre-existing (existed before plan execution).
- **Fix:** Split tsup config into array: `index` entry gets `"use client"` banner, `server` entry does not
- **Files modified:** `packages/next/tsup.config.ts`
- **Commit:** `9b1f549`

## Issues Encountered

None — all issues resolved during verification gap closure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Type-safe subscription foundation is complete — all 12 domain sub-phases (10.2–10.13) can now create typed subscription configs
- buildXWhere functions available for building subscription where clauses
- Test app ready for subscription development with provider and playground page

---

_Phase: 10.1-subscription-foundation_
_Completed: 2026-03-01_
