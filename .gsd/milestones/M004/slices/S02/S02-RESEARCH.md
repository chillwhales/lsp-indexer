# S02 — Research

**Date:** 2026-03-20

## Summary

S02 is straightforward: add a playground page for the 3 new mutual follow hook families, update the 3 docs pages (node, react, next) and home page tables, then verify all packages build clean. No new APIs, no new architecture — purely wiring existing hooks into established UI patterns and documenting them.

The playground page follows the exact pattern of `apps/docs/src/app/follows/page.tsx` — a `PlaygroundPageLayout` with tabbed sections, each tab rendering a hook's output with filter controls. The key difference: mutual follow hooks return `profiles` (not `followers`), so they use `ProfileCard` instead of `FollowerCard`, and the params are `addressA`/`addressB` (or `myAddress`/`targetAddress`) instead of filter objects.

## Recommendation

Three independent tasks: (1) playground page, (2) docs updates, (3) full build validation. Tasks 1 and 2 are independent; task 3 depends on both. The playground page is the most code; the docs updates are the most tedious (4 files). Build validation is a single command.

## Implementation Landscape

### Key Files

- `apps/docs/src/app/follows/page.tsx` — **reference pattern** for the playground page; ~500 lines, tabs for each hook variant
- `apps/docs/src/app/mutual-follows/page.tsx` — **new file**: playground page for all 6 mutual follow hooks
- `apps/docs/src/components/playground/` — shared playground components (`PlaygroundPageLayout`, `ResultsList`, `IncludeToggles`, etc.) — reuse as-is
- `apps/docs/src/components/profile-card.tsx` — card component for rendering profiles (mutual follow hooks return profiles, not followers)
- `apps/docs/src/components/nav.tsx` — add nav link for `/mutual-follows` playground (line ~61, after follows entry)
- `apps/docs/src/app/docs/node/page.mdx` — add `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows` to fetch functions table
- `apps/docs/src/app/docs/react/page.mdx` — add 6 mutual follow hooks to domain table (line ~158), add usage section
- `apps/docs/src/app/docs/next/page.mdx` — add 3 server actions to domain table (line ~170), add usage section
- `apps/docs/src/app/(home)/page.mdx` — no table change needed (mutual follows are part of "Follows" domain, not a new domain)

### Playground Page Structure

The page needs 6 tabs (one per hook), organized as 3 pairs:

| Tab | Hook | Params | Returns |
|-----|------|--------|---------|
| Mutual Follows | `useMutualFollows` | `addressA`, `addressB`, sort, limit, include | `{ profiles, totalCount }` |
| Infinite Mutual Follows | `useInfiniteMutualFollows` | `addressA`, `addressB`, sort, pageSize, include | `{ profiles, hasNextPage, fetchNextPage }` |
| Mutual Followers | `useMutualFollowers` | `addressA`, `addressB`, sort, limit, include | `{ profiles, totalCount }` |
| Infinite Mutual Followers | `useInfiniteMutualFollowers` | `addressA`, `addressB`, sort, pageSize, include | `{ profiles, hasNextPage, fetchNextPage }` |
| Followed By My Follows | `useFollowedByMyFollows` | `myAddress`, `targetAddress`, sort, limit, include | `{ profiles, totalCount }` |
| Infinite Followed By My Follows | `useInfiniteFollowedByMyFollows` | `myAddress`, `targetAddress`, sort, pageSize, include | `{ profiles, hasNextPage, fetchNextPage }` |

Key differences from the follows playground:
- No filter object — just two address inputs per tab
- No subscription tab (mutual follow subscriptions are out of scope)
- Returns `profiles` not `follows` — use `ProfileCard` and `PROFILE_INCLUDE_FIELDS`
- The "Followed By My Follows" tabs use `myAddress`/`targetAddress` instead of `addressA`/`addressB`
- Hooks from both `@lsp-indexer/react` and `@lsp-indexer/next` should be switchable via `HookMode` toggle (same pattern as follows page)

### Docs Updates

**`apps/docs/src/app/docs/node/page.mdx`:**
- Add row to "Available fetch functions" table: `| Mutual Follows | — | fetchMutualFollows, fetchMutualFollowers, fetchFollowedByMyFollows |`
- Or add to existing "Additional:" line after table

**`apps/docs/src/app/docs/react/page.mdx`:**
- Add row to domain hooks table (line ~158): `| Mutual Follows | useMutualFollows, useInfiniteMutualFollows, useMutualFollowers, useInfiniteMutualFollowers, useFollowedByMyFollows, useInfiniteFollowedByMyFollows |`
- Add a "Mutual Follow Hooks" section with usage examples showing `addressA`/`addressB` params

**`apps/docs/src/app/docs/next/page.mdx`:**
- Add row to server actions table (line ~170): `| Mutual Follows | getMutualFollows, getMutualFollowers, getFollowedByMyFollows |`
- Add usage example section

### Build Order

1. **Playground page + nav link** — creates `apps/docs/src/app/mutual-follows/page.tsx`, updates `nav.tsx`
2. **Docs updates** — updates node, react, next docs pages (independent from task 1)
3. **Full build validation** — `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build`

### Verification Approach

1. All 4 library packages build clean: `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build`
2. Docs app builds clean: `pnpm --filter=docs build` (this catches any MDX syntax errors and TypeScript issues in playground pages)
3. Playground page exists: `test -f apps/docs/src/app/mutual-follows/page.tsx`
4. Nav link added: `grep -c 'mutual-follows' apps/docs/src/components/nav.tsx` returns ≥ 1
5. Docs updated: `grep -c 'MutualFollow\|mutualFollow\|fetchMutualFollow' apps/docs/src/app/docs/node/page.mdx apps/docs/src/app/docs/react/page.mdx apps/docs/src/app/docs/next/page.mdx` returns ≥ 3 per file
