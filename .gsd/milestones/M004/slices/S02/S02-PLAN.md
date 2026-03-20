# S02: Build Validation & Docs

**Goal:** All 4 packages build clean, test app playground page exercises the 3 new mutual follow hook families, docs pages updated with new hooks/actions/functions.
**Demo:** `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build` exits 0. Playground page at `/mutual-follows` renders 6 tabbed hook demos. Node, React, and Next.js docs pages list the new mutual follow functions/hooks/actions.

## Must-Haves

- Playground page at `apps/docs/src/app/mutual-follows/page.tsx` with 6 tabs (one per hook), React/Next toggle, include toggles, sort controls
- Nav sidebar link for `/mutual-follows` in `apps/docs/src/components/nav.tsx`
- `apps/docs/src/app/docs/node/page.mdx` lists `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`
- `apps/docs/src/app/docs/react/page.mdx` lists all 6 mutual follow hooks in the domain table + usage section
- `apps/docs/src/app/docs/next/page.mdx` lists 3 mutual follow server actions in the domain table + usage section + lists 6 Next.js hooks
- All 4 library packages + docs app build with zero errors (R008)

## Verification

- `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build` exits 0
- `pnpm --filter=docs build` exits 0
- `test -f apps/docs/src/app/mutual-follows/page.tsx`
- `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx`
- `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' apps/docs/src/app/docs/node/page.mdx` returns ≥ 3
- `grep -c 'useMutualFollow\|useFollowedByMyFollow\|useInfiniteMutualFollow\|useInfiniteFollowedByMyFollow' apps/docs/src/app/docs/react/page.mdx` returns ≥ 6
- `grep -c 'getMutualFollow\|getFollowedByMyFollow' apps/docs/src/app/docs/next/page.mdx` returns ≥ 3

## Integration Closure

- Upstream surfaces consumed: All 18 hook exports from `@lsp-indexer/react` and `@lsp-indexer/next` (S01), service function exports from `@lsp-indexer/node`, types from `@lsp-indexer/types`
- New wiring introduced in this slice: Playground page imports and exercises hooks at runtime; docs reference new APIs
- What remains before the milestone is truly usable end-to-end: nothing — S02 is the final slice

## Tasks

- [x] **T01: Create mutual follows playground page with nav link** `est:45m`
  - Why: Milestone requires a test app playground page that exercises all 6 mutual follow hooks against live Hasura. This is the primary integration proof.
  - Files: `apps/docs/src/app/mutual-follows/page.tsx`, `apps/docs/src/components/nav.tsx`
  - Do: Create playground page following the exact pattern of `apps/docs/src/app/follows/page.tsx`. 6 tabs (Mutual Follows, Infinite Mutual Follows, Mutual Followers, Infinite Mutual Followers, Followed By My Follows, Infinite Followed By My Follows). Each tab has two address inputs (`addressA`/`addressB` or `myAddress`/`targetAddress`), include toggles via `PROFILE_INCLUDE_FIELDS`, sort controls, and a `HookMode` toggle for React vs Next imports. Results render via `ProfileCard` (not `FollowerCard`). Add nav link entry in `playgroundLinks` array after the follows entry.
  - Verify: `test -f apps/docs/src/app/mutual-follows/page.tsx && grep -q 'mutual-follows' apps/docs/src/components/nav.tsx`
  - Done when: Playground page exists with all 6 tabs and nav link is present

- [x] **T02: Update node, react, and next docs pages with mutual follow APIs** `est:30m`
  - Why: AGENTS.md mandates docs updates for every new hook/action/function. Milestone definition-of-done requires "Docs updated". Closes R008 via final build validation.
  - Files: `apps/docs/src/app/docs/node/page.mdx`, `apps/docs/src/app/docs/react/page.mdx`, `apps/docs/src/app/docs/next/page.mdx`
  - Do: (1) In node docs, add a "Mutual Follows" row to the fetch functions table with `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`. (2) In react docs, add a "Mutual Follows" row to the domain hooks table listing all 6 hooks, plus a usage section showing `addressA`/`addressB` params and include narrowing. (3) In next docs, add a "Mutual Follows" row to server actions table with `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows`, plus add 6 Next.js hooks to hooks listing, plus usage section.
  - Verify: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build`
  - Done when: All 5 builds exit 0 and each docs file references the new mutual follow APIs

## Files Likely Touched

- `apps/docs/src/app/mutual-follows/page.tsx` (new)
- `apps/docs/src/components/nav.tsx`
- `apps/docs/src/app/docs/node/page.mdx`
- `apps/docs/src/app/docs/react/page.mdx`
- `apps/docs/src/app/docs/next/page.mdx`

## Observability / Diagnostics

- **Build verification**: `pnpm --filter=docs build` exit code is the primary signal — MDX parse errors or broken imports surface as build failures with file:line details in stderr
- **Playground error visibility**: Each mutual follow tab renders `ErrorAlert` inline when the hook returns an error (network, GraphQL, or validation)
- **React Query devtools**: In dev mode, cache entries under `followerKeys.mutualFollows`, `followerKeys.mutualFollowers`, `followerKeys.followedByMyFollows` show query state, staleness, and refetch timing
- **Failure path**: If the Hasura endpoint is unreachable, hooks return `IndexerError` with category `NETWORK` — rendered by `ErrorAlert` in the playground and logged to browser console
