---
id: M004
provides:
  - 3 service functions (fetchMutualFollows, fetchMutualFollowers, fetchFollowedByMyFollows) with ProfileInclude type narrowing
  - 6 React hooks (3 base + 3 infinite scroll) calling Hasura directly via getClientUrl()
  - 6 Next.js client hooks routing through 3 server actions with Zod validation
  - 6 Zod param schemas + inferred types in @lsp-indexer/types
  - 6 query key factory entries for cache management
  - /mutual-follows playground page with 6 tabbed hook demos
  - Full docs coverage across node, react, and next MDX pages
key_decisions:
  - D001: Hasura nested followed/followedBy relationship filters for server-side SQL joins
  - D002: Return Profile[] (via ProfileResult<I>) not Follower[] — consumers want identity, not relationship metadata
  - D003: Query universal_profile table with nested relationship filters, reusing existing profile parser
  - D004: Service functions call execute() directly with composed _and where-clauses instead of fetchProfiles
  - D005: Mandatory addressA/addressB params (no default = {}) — mutual follow queries always require two addresses
patterns_established:
  - Mutual follow service functions follow 3-overload pattern with direct execute() and composed Universal_Profile_Bool_Exp
  - Query keys use 'followers' root with sub-segments like 'mutual-follows', 'mutual-followers', 'followed-by-my-follows'
  - Mutual follow factories follow createUseList/createUseInfinite plumbing with items→profiles remap
  - Concrete hooks use same 3-line wiring pattern (import service + import factory + wire with getClientUrl)
  - Next.js hooks use 4-line pattern ('use client' + import action + import factory + wire)
observability_surfaces:
  - Zod validation in server actions throws ZodError with field-level detail before any network call
  - Service functions propagate Hasura GraphQL errors via execute() as structured GraphQLError
  - React hooks surface errors via TanStack Query error/isError state
  - Query key arrays inspectable at runtime for cache debugging
  - ErrorAlert renders hook errors inline per playground tab
requirement_outcomes:
  - id: R001
    from_status: active
    to_status: validated
    proof: fetchMutualFollows service function + useMutualFollows hook compile and export across all 4 packages. Playground page exercises with include/sort controls. Full 5-package build exits 0.
  - id: R002
    from_status: active
    to_status: validated
    proof: fetchMutualFollowers service function + useMutualFollowers hook compile and export across all 4 packages. Playground page exercises with include/sort controls. Full 5-package build exits 0.
  - id: R003
    from_status: active
    to_status: validated
    proof: fetchFollowedByMyFollows service function + useFollowedByMyFollows hook compile and export across all 4 packages. Playground page exercises with myAddress/targetAddress inputs. Full 5-package build exits 0.
  - id: R004
    from_status: active
    to_status: validated
    proof: 6 React hooks exported from packages/react/src/hooks/followers/index.ts, each calling Hasura directly via getClientUrl(). Playground page imports all 6 with HookMode toggle. Build exits 0.
  - id: R005
    from_status: active
    to_status: validated
    proof: 3 server actions with 'use server' directive + Zod validation in packages/next/src/actions/followers.ts. 6 Next.js hooks exported from packages/next/src/hooks/followers/index.ts. pnpm --filter=@lsp-indexer/next build exits 0.
  - id: R006
    from_status: active
    to_status: validated
    proof: All service functions and factories use <const I extends ProfileInclude> with 3-overload signatures. TypeScript compilation across all 4 packages validates type narrowing works correctly.
  - id: R007
    from_status: active
    to_status: validated
    proof: useInfiniteMutualFollows, useInfiniteMutualFollowers, useInfiniteFollowedByMyFollows present in both react and next packages with offset-based pagination via createUseInfinite factory. Playground includes infinite scroll tabs.
  - id: R008
    from_status: active
    to_status: validated
    proof: All 5 packages (types, node, react, next, docs) build with zero errors. Verified by pnpm build across all filters in S02.
duration: 48m
verification_result: passed
completed_at: 2026-03-20
---

# M004: Mutual Follow Hooks

**Three social graph intersection hook families — mutual follows, mutual followers, and followed-by-my-follows — delivered across types, node, react, and next packages with infinite scroll, ProfileInclude narrowing, playground page, and full docs**

## What Happened

S01 built the complete vertical stack for three social graph intersection queries. In `@lsp-indexer/types`, 6 Zod param schemas (3 base + 3 infinite) define the input contracts. In `@lsp-indexer/node`, 3 service functions call `execute()` directly with composed `Universal_Profile_Bool_Exp` using `_and` + nested `followedBy`/`followed` relationship filters — bypassing `fetchProfiles` because mutual follow queries need two simultaneous relationship conditions that can't be expressed through `ProfileFilter`. Six query key entries support cache management. In `@lsp-indexer/react`, 6 factory functions produce hooks with 3-overload `ProfileInclude` narrowing, and 6 concrete hooks wire them to `getClientUrl()`. In `@lsp-indexer/next`, 3 server actions with Zod validation and 6 client hooks complete the dual-package story.

S02 closed the milestone with a `/mutual-follows` playground page (~480 lines, 6 tabbed demos with address inputs, sort controls, include toggles, and HookMode switching between React and Next.js imports). Documentation updates covered all three MDX pages — node docs got the fetch function table row, react docs got a full usage section with 6 hooks, and next docs got server action mapping tables and usage examples. All 5 packages (types, node, react, next, docs) build with zero errors.

## Cross-Slice Verification

| Success Criterion | Evidence |
|---|---|
| `useMutualFollows(addressA, addressB)` returns profiles both follow | S01: service function + hooks compile across 4 packages. S02: playground tab exercises with controls |
| `useMutualFollowers(addressA, addressB)` returns profiles following both | Same — separate service function with `followed` relationship filter |
| `useFollowedByMyFollows(myAddress, targetAddress)` returns social proof set | Same — uses `myAddress`/`targetAddress` params (corrected from plan's single `address`) |
| All three have infinite scroll variants | S01: 3 infinite factories + hooks using `createUseInfinite` with offset pagination |
| Include-based type narrowing works | 3-overload `<const I extends ProfileInclude>` signatures across all layers; TypeScript build validates |
| All 4 packages build and typecheck clean | S02: `pnpm --filter=@lsp-indexer/{types,node,react,next} build` + `pnpm --filter=docs build` all exit 0 |
| Hooks available from both react and next | Barrel exports in `packages/react/src/hooks/followers/index.ts` and `packages/next/src/hooks/followers/index.ts` |
| Test app playground page | S02: `/mutual-follows` page with 6 tabs, nav sidebar link |
| Docs updated | S02: node, react, next MDX pages updated with tables and usage examples |

## Requirement Changes

- R001: active → validated — fetchMutualFollows + hooks compile, playground exercises, 5-package build exits 0
- R002: active → validated — fetchMutualFollowers + hooks compile, playground exercises, 5-package build exits 0
- R003: active → validated — fetchFollowedByMyFollows + hooks compile, playground exercises, 5-package build exits 0
- R004: active → validated — 6 React hooks exported calling Hasura via getClientUrl(), playground imports all 6
- R005: active → validated — 3 server actions with Zod validation, 6 Next.js hooks, build exits 0
- R006: active → validated — 3-overload ProfileInclude signatures across all layers, TypeScript validates
- R007: active → validated — 3 infinite hooks with offset pagination via createUseInfinite factory
- R008: active → validated — All 5 packages build with zero errors

## Forward Intelligence

### What the next milestone should know
- The mutual follow hooks bypass `fetchProfiles` and call `execute()` directly because they need composed `_and` where-clauses with dual relationship filters. Any future hooks that need multi-condition relationship filters should follow this same pattern (D004).
- All 18 hooks (6 React + 6 Next.js + 6 return types) are exported from barrel `index.ts` files — imports work from `@lsp-indexer/react` and `@lsp-indexer/next` directly.
- The project now has 15 query domains across the 4 packages (12 original + 3 mutual follow families).

### What's fragile
- The `_and` where-clause composition in service functions constructs `Universal_Profile_Bool_Exp` manually — if Hasura schema changes relationship names (`followedBy`/`followed`), these break silently (GraphQL returns empty results, not errors).
- The playground page has 6 near-identical tab components with shared `AddressPairInputs` and `ProfileControls` — if the profile hook API changes (e.g., ProfileSort fields), all 6 tabs need updating.

### Authoritative diagnostics
- `pnpm --filter=@lsp-indexer/{types,node,react,next} build && pnpm --filter=docs build` — if all 5 exit 0, the entire mutual follow stack is sound.
- `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts` — should return ≥ 19 confirming all schemas present.

### What assumptions changed
- Plan assumed `getFollowedByMyFollows` would use a single `address` param — actual implementation uses `myAddress` + `targetAddress` to match the two-address requirement of intersection queries.
- Mutual follow factory hooks require mandatory `addressA`/`addressB` params (no `= {}` default) unlike `createUseProfiles` — two addresses are always required for intersection queries (D005).

## Files Created/Modified

- `packages/types/src/followers.ts` — 6 Zod param schemas + 6 inferred types for mutual follow queries
- `packages/node/src/services/followers.ts` — 3 service functions with 3-overload ProfileInclude narrowing
- `packages/node/src/keys/followers.ts` — 6 query key factory entries
- `packages/react/src/hooks/types/followers.ts` — 6 return types mirroring UseProfilesReturn shape
- `packages/react/src/hooks/factories/followers/` — 6 factory functions (create-use-[infinite-]{mutual-follows,mutual-followers,followed-by-my-follows}.ts)
- `packages/react/src/hooks/followers/` — 6 concrete React hooks + barrel index.ts
- `packages/next/src/actions/followers.ts` — 3 server actions with Zod validation
- `packages/next/src/hooks/followers/` — 6 Next.js client hooks + barrel index.ts
- `apps/docs/src/app/mutual-follows/page.tsx` — playground page with 6 tabbed hook demos
- `apps/docs/src/components/nav.tsx` — nav sidebar link to /mutual-follows
- `apps/docs/src/app/docs/node/page.mdx` — mutual follow fetch functions documentation
- `apps/docs/src/app/docs/react/page.mdx` — mutual follow hooks documentation with usage examples
- `apps/docs/src/app/docs/next/page.mdx` — mutual follow server actions and hooks documentation
