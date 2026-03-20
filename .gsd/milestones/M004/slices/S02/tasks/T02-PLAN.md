---
estimated_steps: 4
estimated_files: 3
---

# T02: Update node, react, and next docs pages with mutual follow APIs

**Slice:** S02 — Build Validation & Docs
**Milestone:** M004

## Description

Update the 3 package documentation pages to include the new mutual follow fetch functions, hooks, and server actions. Then run the full build across all 5 packages (types, node, react, next, docs) to validate R008: zero build errors.

## Steps

1. **Update `apps/docs/src/app/docs/node/page.mdx`:**
   - Add a row to the "Available fetch functions" table (after the "Follows" row at line 72): `| Mutual Follows | — | fetchMutualFollows, fetchMutualFollowers, fetchFollowedByMyFollows |`
   - Add an "Additional:" note after line 78 (or extend existing): mention these are intersection queries that take `addressA`/`addressB` or `myAddress`/`targetAddress` params

2. **Update `apps/docs/src/app/docs/react/page.mdx`:**
   - Add a row to the domain hooks table (after "Follows" at line 158): `| Mutual Follows | useMutualFollows, useInfiniteMutualFollows, useMutualFollowers, useInfiniteMutualFollowers, useFollowedByMyFollows, useInfiniteFollowedByMyFollows |`
   - Add a "### Mutual Follow Hooks" section (after the Batch Follow Checking section at ~line 196) with a brief usage example showing `useMutualFollows(addressA, addressB, { sort, limit, include })` and include narrowing

3. **Update `apps/docs/src/app/docs/next/page.mdx`:**
   - Add a row to the server actions table (after "Follows" at line 170): `| Mutual Follows | getMutualFollows, getMutualFollowers, getFollowedByMyFollows |`
   - Add 6 Next.js hooks to the hooks information (mention they follow the same API as React hooks)
   - Add a brief usage section for mutual follow hooks via Next.js

4. **Run full build validation:**
   - `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build`
   - All 5 must exit 0

## Must-Haves

- [ ] Node docs list all 3 mutual follow fetch functions
- [ ] React docs list all 6 mutual follow hooks in domain table
- [ ] Next.js docs list all 3 mutual follow server actions in domain table
- [ ] React and Next.js docs include at least one usage example for mutual follow hooks
- [ ] All 5 packages build with zero errors

## Verification

- `grep -c 'fetchMutualFollow\|fetchFollowedByMyFollow' apps/docs/src/app/docs/node/page.mdx` returns ≥ 3
- `grep -c 'useMutualFollow\|useFollowedByMyFollow\|useInfiniteMutualFollow\|useInfiniteFollowedByMyFollow' apps/docs/src/app/docs/react/page.mdx` returns ≥ 6
- `grep -c 'getMutualFollow\|getFollowedByMyFollow' apps/docs/src/app/docs/next/page.mdx` returns ≥ 3
- `pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build && pnpm --filter=docs build` exits 0

## Inputs

- `apps/docs/src/app/docs/node/page.mdx` — fetch functions table at line 63-76, "Additional:" at line 78
- `apps/docs/src/app/docs/react/page.mdx` — domain hooks table at line 149-162, Batch Follow section at line 166
- `apps/docs/src/app/docs/next/page.mdx` — server actions table at line 161-174
- S01 summary: service functions are `fetchMutualFollows(url, addressA, addressB, opts)`, `fetchMutualFollowers(url, addressA, addressB, opts)`, `fetchFollowedByMyFollows(url, myAddress, targetAddress, opts)`
- S01 summary: server actions are `getMutualFollows`, `getMutualFollowers`, `getFollowedByMyFollows` with Zod validation
- S01 summary: React hooks use `getClientUrl()`, Next.js hooks route through server actions

## Expected Output

- `apps/docs/src/app/docs/node/page.mdx` — new table row + additional note for mutual follow fetch functions
- `apps/docs/src/app/docs/react/page.mdx` — new table row + "Mutual Follow Hooks" usage section
- `apps/docs/src/app/docs/next/page.mdx` — new table row + mutual follow usage section
- All 5 builds pass cleanly (R008 validated)
