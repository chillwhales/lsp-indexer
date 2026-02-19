---
phase: 09-remaining-query-domains
plan: 05
subsystem: query-domains
tags: [social, followers, following, follow-count, hooks, server-actions, playground]

dependency_graph:
  requires: ['09-01']
  provides: ['QUERY-05', 'PAGE-01-follows']
  affects: ['09-11']

tech_stack:
  added: []
  patterns: ['GraphQL aliases for dual aggregates', 'shared document for followers/following with different where clauses']

key_files:
  created:
    - packages/types/src/social.ts
    - packages/node/src/documents/social.ts
    - packages/node/src/parsers/social.ts
    - packages/node/src/services/social.ts
    - packages/node/src/keys/social.ts
    - packages/react/src/hooks/social.ts
    - packages/next/src/actions/social.ts
    - packages/next/src/hooks/social.ts
    - apps/test/src/app/follows/page.tsx
  modified:
    - packages/react/src/index.ts
    - packages/next/src/index.ts

decisions:
  - Shared GetFollowersDocument for both followers and following — same table, different where clause (followed_address vs follower_address)
  - GetFollowCountDocument uses GraphQL aliases (followerCount, followingCount) to query follower_aggregate twice in one request
  - useFollowCount returns scalar { followerCount, followingCount } — no infinite variant (locked decision)
  - Follows playground uses nested tabs (top-level: Followers/Following/Count, sub-level: List/Infinite for first two)
  - AddressInput component with onPreset callback for synchronous address+query state updates

metrics:
  duration: ~72 minutes
  completed: 2026-02-19
---

# Phase 9 Plan 05: Social/Follow Domain Summary

**One-liner:** Social follow domain vertical slice with useFollowers/useFollowing/useFollowCount hooks querying the `follower` Hasura table (current follow state), plus /follows playground page with Followers, Following, and Follow Count tabs.

## Task Commits

| Task | Name                       | Commit  | Key Files                                             |
| ---- | -------------------------- | ------- | ----------------------------------------------------- |
| 1    | Types + Node layer         | 173a932 | social.ts (types, documents, parsers, services, keys) |
| 2    | React/Next hooks + actions | b312cd0 | hooks/social.ts (react, next), actions/social.ts      |
| 3    | Follows playground page    | 6af28bc | app/follows/page.tsx                                  |

## What Was Built

### Types (`@lsp-indexer/types`)

- `FollowerSchema` — followerAddress + followedAddress
- `FollowCountSchema` — followerCount + followingCount
- `FollowerSortFieldSchema` — sort by followerAddress or followedAddress
- Hook param schemas: `UseFollowersParams`, `UseFollowingParams`, `UseFollowCountParams`, `UseInfiniteFollowersParams`, `UseInfiniteFollowingParams`

### Node Layer (`@lsp-indexer/node`)

- **Documents:** `GetFollowersDocument` — queries `follower` table + aggregate count (shared for both followers and following, different where clause); `GetFollowCountDocument` — uses GraphQL aliases to query `follower_aggregate` twice for both counts in one request
- **Parser:** `parseFollower` / `parseFollowers` — maps `follower_address` → `followerAddress`, `followed_address` → `followedAddress`; `parseFollowCount` — extracts counts from aliased aggregates
- **Services:** `fetchFollowers` (filter by followed_address), `fetchFollowing` (filter by follower_address), `fetchFollowCount` (dual aggregate) — all use `_ilike` for case-insensitive address matching
- **Keys:** `followerKeys` — hierarchical query keys (all → followers/following/count/infinite)

### React Hooks (`@lsp-indexer/react`)

- `useFollowers({ address, sort?, limit?, offset? })` — useQuery wrapping fetchFollowers, enabled: Boolean(address)
- `useFollowing({ address, sort?, limit?, offset? })` — useQuery wrapping fetchFollowing
- `useFollowCount({ address })` — useQuery returning `{ followerCount, followingCount }` scalars
- `useInfiniteFollowers({ address, sort?, pageSize? })` — useInfiniteQuery with offset-based pagination
- `useInfiniteFollowing({ address, sort?, pageSize? })` — useInfiniteQuery with offset-based pagination

### Next.js (`@lsp-indexer/next`)

- `getFollowers`, `getFollowing`, `getFollowCount` server actions with `'use server'` directive
- `useFollowers`, `useFollowing`, `useFollowCount`, `useInfiniteFollowers`, `useInfiniteFollowing` hooks mirroring React package, using server actions as queryFn

### Playground Page

- `/follows` route with three top-level tabs: Followers, Following, Follow Count
- Followers and Following tabs have nested List/Infinite Scroll sub-tabs
- Follow Count tab shows large prominent numbers for followerCount and followingCount
- Client/Server mode toggle (key={mode} for clean remount)
- Preset address buttons for quick testing
- FollowerCard and FollowingCard with truncated mono-spaced addresses
- RawJsonToggle on Follow Count for debugging

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

1. `pnpm build` succeeds in all 4 packages ✅
2. `useFollowers`, `useFollowing`, `useFollowCount`, `useInfiniteFollowers`, `useInfiniteFollowing` exported from both `@lsp-indexer/react` and `@lsp-indexer/next` ✅
3. `getFollowers`, `getFollowing`, `getFollowCount` exported from `@lsp-indexer/next` ✅
4. `useFollowCount` does NOT have an infinite variant ✅
5. Playground page exists at `/follows` with three tabs ✅

## Success Criteria

Developer can call `useFollowers({ address: '0x...' })` and get typed `Follower[]` data. `useFollowCount` returns `{ followerCount, followingCount }` scalars. **QUERY-05 delivered.** ✅

## Next Phase Readiness

No blockers or concerns for subsequent plans. The social/follow domain is a clean vertical slice using the `follower` table for current follow state.

## Self-Check: PASSED
