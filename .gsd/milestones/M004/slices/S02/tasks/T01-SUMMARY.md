---
id: T01
parent: S02
milestone: M004
provides:
  - /mutual-follows playground page with 6 tabbed hook demos
  - nav sidebar link to /mutual-follows
key_files:
  - apps/docs/src/app/mutual-follows/page.tsx
  - apps/docs/src/components/nav.tsx
key_decisions:
  - Reused ProfileCard (not FollowerCard) since mutual follow hooks return profile results
  - Extracted shared AddressPairInputs and ProfileControls components to reduce duplication across 6 tabs
patterns_established:
  - Mutual follow playground tabs follow same pattern as profiles page (ProfileSort, PROFILE_INCLUDE_FIELDS, ProfileCard)
observability_surfaces:
  - ErrorAlert renders hook errors inline per tab; React Query devtools show cache keys for mutual follow queries
duration: 12m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T01: Create mutual follows playground page with nav link

**Created /mutual-follows playground page with 6 tabbed hook demos (3 base + 3 infinite) and added nav sidebar link**

## What Happened

Created `apps/docs/src/app/mutual-follows/page.tsx` following the established pattern from the follows page. The page has 6 tabs exercising all mutual follow hooks: Mutual Follows, ∞ Mutual Follows, Mutual Followers, ∞ Mutual Followers, By My Follows, and ∞ By My Follows. Each tab includes two address inputs (addressA/addressB for mutual follows/followers, myAddress/targetAddress for followed-by-my-follows), sort controls with ProfileSortField options, include toggles via PROFILE_INCLUDE_FIELDS, and a HookMode toggle switching between React and Next.js imports. Results render via ProfileCard. Added `UsersRound` icon import and `/mutual-follows` entry to `playgroundLinks` in nav.tsx.

## Verification

All three task-level checks pass. All 4 library packages build clean (types, node, react, next).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/docs/src/app/mutual-follows/page.tsx` | 0 | ✅ pass | <1s |
| 2 | `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx` | 0 | ✅ pass | <1s |
| 3 | `grep -c 'useMutualFollows\|useMutualFollowers\|useFollowedByMyFollows' apps/docs/src/app/mutual-follows/page.tsx` → 24 (≥6) | 0 | ✅ pass | <1s |
| 4 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 5s |
| 5 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 9s |
| 6 | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | 9s |
| 7 | `pnpm --filter=@lsp-indexer/next build` | 0 | ✅ pass | 4s |

## Diagnostics

- Each tab renders `ErrorAlert` for hook-level errors, visible inline
- React Query devtools (in dev mode) show cache entries keyed under `followerKeys.mutualFollows`, `followerKeys.mutualFollowers`, `followerKeys.followedByMyFollows` and their infinite variants
- Browser console will log network errors from Hasura GraphQL if the endpoint is unreachable

## Deviations

- Added `UsersRound` import to nav.tsx — it was not already imported despite what the task plan assumed.

## Known Issues

None.

## Files Created/Modified

- `apps/docs/src/app/mutual-follows/page.tsx` — new playground page (~480 lines) with 6 tabs exercising all mutual follow hooks
- `apps/docs/src/components/nav.tsx` — added UsersRound import and /mutual-follows entry in playgroundLinks
