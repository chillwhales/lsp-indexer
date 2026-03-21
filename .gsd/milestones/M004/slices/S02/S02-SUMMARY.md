---
id: S02
parent: M004
milestone: M004
provides:
  - /mutual-follows playground page with 6 tabbed hook demos (3 base + 3 infinite)
  - Nav sidebar link to /mutual-follows
  - Node docs listing 3 mutual follow fetch functions
  - React docs listing 6 mutual follow hooks with usage examples
  - Next.js docs listing 3 server actions, 6 hooks, and usage examples
  - Full 5-package build validation (types, node, react, next, docs) exits 0
requires:
  - slice: S01
    provides: All 18 hook exports from react/next, 3 service functions from node, Zod schemas from types
affects: []
key_files:
  - apps/docs/src/app/mutual-follows/page.tsx
  - apps/docs/src/components/nav.tsx
  - apps/docs/src/app/docs/node/page.mdx
  - apps/docs/src/app/docs/react/page.mdx
  - apps/docs/src/app/docs/next/page.mdx
key_decisions:
  - Reused ProfileCard (not FollowerCard) since mutual follow hooks return profile results
  - Extracted shared AddressPairInputs and ProfileControls components to reduce duplication across 6 tabs
patterns_established:
  - Mutual follow playground tabs follow same pattern as profiles page (ProfileSort, PROFILE_INCLUDE_FIELDS, ProfileCard)
  - Mutual follow docs sections follow same structure as batch follow checking sections (table + usage example)
observability_surfaces:
  - ErrorAlert renders hook errors inline per tab
  - React Query devtools show cache keys for mutual follow queries
  - MDX build failures surface with file:line details in stderr
drill_down_paths:
  - .gsd/milestones/M004/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S02/tasks/T02-SUMMARY.md
duration: 17m
verification_result: passed
completed_at: 2026-03-20
---

# S02: Build Validation & Docs

**Playground page exercising all 6 mutual follow hooks, full docs coverage, and clean 5-package build — closing the milestone**

## What Happened

T01 created the `/mutual-follows` playground page (~480 lines) following the established follows page pattern. The page has 6 tabs — Mutual Follows, ∞ Mutual Follows, Mutual Followers, ∞ Mutual Followers, By My Follows, ∞ By My Follows — each with two address inputs, ProfileSort controls, PROFILE_INCLUDE_FIELDS toggles, and a HookMode toggle switching between React and Next.js imports. Results render via ProfileCard. Shared `AddressPairInputs` and `ProfileControls` components were extracted to reduce duplication. A nav sidebar link with `UsersRound` icon was added to the `playgroundLinks` array.

T02 updated three MDX docs pages: node docs got a Mutual Follows row in the fetch functions table with `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`; react docs got a domain table row listing all 6 hooks plus a full usage section with include narrowing and sort examples; next docs got a server actions table row, a hook→action mapping table, and both client-side and server component usage examples.

All 5 packages (types, node, react, next, docs) build with zero errors, validating R008 and closing the milestone.

## Verification

All slice-level verification checks pass:

| # | Check | Result |
|---|-------|--------|
| 1 | `test -f apps/docs/src/app/mutual-follows/page.tsx` | ✅ |
| 2 | `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx` | ✅ |
| 3 | `grep -c` node docs ≥ 3 mutual follow fetch refs | 4 ✅ |
| 4 | `grep -c` react docs ≥ 6 mutual follow hook refs | 12 ✅ |
| 5 | `grep -c` next docs ≥ 3 mutual follow action refs | 10 ✅ |
| 6 | `pnpm --filter=@lsp-indexer/{types,node,react,next} build` | 0 ✅ |
| 7 | `pnpm --filter=docs build` | 0 ✅ |

## New Requirements Surfaced

- none

## Deviations

- T01 needed to add `UsersRound` import to nav.tsx — it was not already imported despite what the task plan assumed. Minor, no impact.

## Known Limitations

- Playground page exercises hooks against live Hasura — if the endpoint is unreachable, tabs show ErrorAlert with NETWORK category errors. This is expected behavior, not a gap.
- Runtime pagination behavior (infinite scroll "Load More" actually fetching next page) requires a live Hasura connection to validate. Build-time validation confirms the hooks wire through correctly.

## Follow-ups

- none — S02 is the final slice of M004.

## Files Created/Modified

- `apps/docs/src/app/mutual-follows/page.tsx` — new playground page (~480 lines) with 6 tabbed hook demos
- `apps/docs/src/components/nav.tsx` — added UsersRound import and /mutual-follows entry in playgroundLinks
- `apps/docs/src/app/docs/node/page.mdx` — added Mutual Follows row to fetch functions table and usage description
- `apps/docs/src/app/docs/react/page.mdx` — added Mutual Follows row to domains table and full usage section with examples
- `apps/docs/src/app/docs/next/page.mdx` — added Mutual Follows row to server actions table, hook→action mapping table, and usage examples

## Forward Intelligence

### What the next slice should know
- M004 is complete. All 3 mutual follow hook families are fully wired: types → node services → react hooks → next server actions + hooks → playground page → docs. No remaining slices.

### What's fragile
- The playground page has 6 near-identical tab components with shared `AddressPairInputs` and `ProfileControls` — if the profile hook API changes (e.g., ProfileSort fields), all 6 tabs need updating. The extraction of shared components helps but doesn't eliminate this.

### Authoritative diagnostics
- `pnpm --filter=docs build` exit code is the single most trustworthy signal — it validates MDX syntax, import resolution, and static page generation for all docs and playground pages in one command.

### What assumptions changed
- No assumptions changed — S02 executed cleanly against S01's outputs with no surprises.
