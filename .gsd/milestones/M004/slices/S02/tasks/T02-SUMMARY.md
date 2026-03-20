---
id: T02
parent: S02
milestone: M004
provides:
  - Node docs list 3 mutual follow fetch functions with usage description
  - React docs list 6 mutual follow hooks with usage examples
  - Next.js docs list 3 server actions, 6 hooks, and usage examples
  - All 5 packages (types, node, react, next, docs) build with zero errors
key_files:
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/docs/react/page.mdx
  - apps/docs/src/app/docs/next/page.mdx
key_decisions:
  - none
patterns_established:
  - Mutual follow docs sections follow same structure as batch follow checking sections (table + usage example)
observability_surfaces:
  - Build exit code is the primary signal — MDX parse errors surface as build failures with file:line in stderr
duration: 5m
verification_result: passed
completed_at: 2026-03-20
blocker_discovered: false
---

# T02: Update node, react, and next docs pages with mutual follow APIs

**Added mutual follow API documentation to node, react, and next docs pages and validated all 5 packages build clean**

## What Happened

Updated three MDX documentation pages with the new mutual follow APIs:

1. **Node docs** (`page.mdx`): Added "Mutual Follows" row to the fetch functions table listing `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`. Added a description block explaining these are intersection queries across the follow graph with `addressA`/`addressB` or `myAddress`/`targetAddress` parameters.

2. **React docs** (`page.mdx`): Added "Mutual Follows" row to the Available Domains table listing all 6 hooks. Added a full "Mutual Follow Hooks" section with a hook reference table and two usage examples — one showing `useMutualFollows` with include narrowing and sort/limit options, one showing `useFollowedByMyFollows` with its different parameter names.

3. **Next.js docs** (`page.mdx`): Added "Mutual Follows" row to the server actions table listing `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows`. Added a "Mutual Follow Hooks" section with a combined hook→action mapping table, a client-side usage example, and a server component example using server actions directly.

All 5 packages (types, node, react, next, docs) build with zero errors, validating R008.

## Verification

All task-level and slice-level verification checks pass. The grep counts exceed the required minimums, and the full 5-package build exits 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' apps/docs/src/app/docs/node/page.mdx` → 4 (≥3) | 0 | ✅ pass | <1s |
| 2 | `grep -c 'useMutualFollow\|useFollowedByMyFollow\|useInfiniteMutualFollow\|useInfiniteFollowedByMyFollow' apps/docs/src/app/docs/react/page.mdx` → 12 (≥6) | 0 | ✅ pass | <1s |
| 3 | `grep -c 'getMutualFollow\|getFollowedByMyFollow' apps/docs/src/app/docs/next/page.mdx` → 10 (≥3) | 0 | ✅ pass | <1s |
| 4 | `pnpm --filter=@lsp-indexer/types build` | 0 | ✅ pass | 1s |
| 5 | `pnpm --filter=@lsp-indexer/node build` | 0 | ✅ pass | 3s |
| 6 | `pnpm --filter=@lsp-indexer/react build` | 0 | ✅ pass | 2s |
| 7 | `pnpm --filter=@lsp-indexer/next build` | 0 | ✅ pass | 3s |
| 8 | `pnpm --filter=docs build` | 0 | ✅ pass | 8s |
| 9 | `test -f apps/docs/src/app/mutual-follows/page.tsx` | 0 | ✅ pass | <1s |
| 10 | `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx` | 0 | ✅ pass | <1s |

## Diagnostics

- MDX documentation pages are statically generated at build time — any syntax or content issues surface as build failures in `pnpm --filter=docs build` with file:line details
- No runtime observability for docs content itself; the playground page (T01) provides runtime diagnostics via ErrorAlert and React Query devtools

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/docs/src/app/docs/node/page.mdx` — added Mutual Follows row to fetch functions table and usage description
- `apps/docs/src/app/docs/react/page.mdx` — added Mutual Follows row to domains table and full usage section with examples
- `apps/docs/src/app/docs/next/page.mdx` — added Mutual Follows row to server actions table, hook→action mapping table, and usage examples
- `.gsd/milestones/M004/slices/S02/S02-PLAN.md` — marked T02 done, added Observability/Diagnostics section
