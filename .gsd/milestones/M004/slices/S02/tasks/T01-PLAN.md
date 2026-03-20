---
estimated_steps: 4
estimated_files: 2
---

# T01: Create mutual follows playground page with nav link

**Slice:** S02 — Build Validation & Docs
**Milestone:** M004

## Description

Create the `/mutual-follows` playground page following the established pattern from `apps/docs/src/app/follows/page.tsx`. The page exercises all 6 mutual follow hooks (3 base + 3 infinite) from both `@lsp-indexer/react` and `@lsp-indexer/next` with a HookMode toggle, include toggles, and sort controls. Results render via `ProfileCard`. Also add the nav sidebar link.

**Relevant skills:** none required — this is a UI page following an existing pattern.

## Steps

1. **Read the reference page** `apps/docs/src/app/follows/page.tsx` to understand the full pattern: tab structure, HookMode toggle, include toggles, sort controls, results rendering. Also read `apps/docs/src/components/playground/index.ts` to see available exports (`PlaygroundPageLayout`, `PROFILE_INCLUDE_FIELDS`, `IncludeToggles`, `SortControls`, `ResultsList`, `useIncludeToggles`, `useSubInclude`, `ErrorAlert`, `HookMode`).

2. **Create `apps/docs/src/app/mutual-follows/page.tsx`** with:
   - `'use client'` directive
   - 6 tabs organized as 3 pairs (list + infinite for each query type):
     - **Mutual Follows** / **Infinite Mutual Follows** — `useMutualFollows` / `useInfiniteMutualFollows`
     - **Mutual Followers** / **Infinite Mutual Followers** — `useMutualFollowers` / `useInfiniteMutualFollowers`
     - **Followed By My Follows** / **Infinite Followed By My Follows** — `useFollowedByMyFollows` / `useInfiniteFollowedByMyFollows`
   - Each tab has:
     - Two address text inputs (`addressA`/`addressB` for mutual follows/followers, `myAddress`/`targetAddress` for followed-by-my-follows)
     - `IncludeToggles` using `PROFILE_INCLUDE_FIELDS` (these hooks return profiles)
     - `SortControls` for profile sorting
     - `HookMode` toggle switching between React and Next.js imports
     - `ResultsList` rendering items via `ProfileCard`
   - Import hooks from both `@lsp-indexer/react` (as `*React`) and `@lsp-indexer/next` (as `*Next`)
   - Use `PlaygroundPageLayout` as the page wrapper
   - Sort options: use `ProfileSortField` values (same as profiles page sort since results are profiles)

3. **Add nav link** in `apps/docs/src/components/nav.tsx`: Add `{ href: '/mutual-follows', label: 'Mutual Follows', icon: UsersRound, available: true }` to the `playgroundLinks` array after the follows entry (line ~67). The `UsersRound` icon is already imported.

4. **Verify** the file compiles by checking for syntax correctness: `grep -c 'useMutualFollows\|useMutualFollowers\|useFollowedByMyFollows' apps/docs/src/app/mutual-follows/page.tsx` should return ≥ 6 and `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx`.

## Must-Haves

- [ ] Page has 6 tabs — one for each of the 6 mutual follow hooks
- [ ] Each tab has two address inputs, include toggles, sort controls
- [ ] HookMode toggle switches between React and Next.js hook imports
- [ ] Results render via `ProfileCard` (not `FollowerCard`)
- [ ] Nav sidebar link added for `/mutual-follows`

## Verification

- `test -f apps/docs/src/app/mutual-follows/page.tsx`
- `grep -q 'mutual-follows' apps/docs/src/components/nav.tsx`
- `grep -c 'useMutualFollows\|useMutualFollowers\|useFollowedByMyFollows' apps/docs/src/app/mutual-follows/page.tsx` returns ≥ 6

## Inputs

- `apps/docs/src/app/follows/page.tsx` — reference pattern (719 lines, tabbed playground with HookMode toggle)
- `apps/docs/src/components/playground/index.ts` — shared playground components to reuse
- `apps/docs/src/components/profile-card.tsx` — card component for rendering profiles
- `apps/docs/src/components/nav.tsx` — sidebar navigation, add entry to `playgroundLinks` array
- S01 created all 12 hooks (6 React + 6 Next.js) exported from `@lsp-indexer/react` and `@lsp-indexer/next`
- Hook params: `addressA`/`addressB` for mutual follows and mutual followers; `myAddress`/`targetAddress` for followed-by-my-follows
- Hooks return `{ profiles, totalCount }` (base) or `{ profiles, hasNextPage, fetchNextPage }` (infinite)
- Sort uses `ProfileSort` type (field + direction), not `FollowerSort`
- Include uses `ProfileInclude` type — toggled via `PROFILE_INCLUDE_FIELDS` constant from playground

## Expected Output

- `apps/docs/src/app/mutual-follows/page.tsx` — new playground page (~400-600 lines) exercising all 6 hooks
- `apps/docs/src/components/nav.tsx` — one new entry in `playgroundLinks` array
