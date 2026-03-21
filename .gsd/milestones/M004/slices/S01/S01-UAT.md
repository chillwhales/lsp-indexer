# S01: Mutual Follow Hooks — Full Stack — UAT

**Milestone:** M004
**Written:** 2026-03-20

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S01 is a pure compile-time contract slice — all verification is build success + type correctness across 4 packages. Live Hasura runtime testing is deferred to S02's test app playground.

## Preconditions

- Working directory: `/home/coder/lsp-indexer/.gsd/worktrees/M004`
- Node.js 22+ and pnpm available
- No runtime services required (no Hasura, no database)

## Smoke Test

```bash
cd /home/coder/lsp-indexer/.gsd/worktrees/M004
pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm --filter=@lsp-indexer/react build && pnpm --filter=@lsp-indexer/next build
```
**Expected:** All 4 exit 0 with no TypeScript errors.

## Test Cases

### 1. Zod schemas exist and are well-formed

1. Run: `grep -c 'MutualFollow\|FollowedByMyFollow' packages/types/src/followers.ts`
2. **Expected:** Returns ≥ 19 (6 schemas + 6 types + identifiers)

3. Run: `grep 'ParamsSchema' packages/types/src/followers.ts | wc -l`
4. **Expected:** Returns ≥ 6 (3 base + 3 infinite param schemas)

### 2. Service functions have correct signatures

1. Run: `grep -A2 'export async function fetchMutualFollows' packages/node/src/services/followers.ts`
2. **Expected:** Shows function with `url: string, params` signature and generic `<const I extends ProfileInclude>` overload

3. Run: `grep -c 'fetchMutualFollows\|fetchMutualFollowers\|fetchFollowedByMyFollows' packages/node/src/services/followers.ts`
4. **Expected:** Returns ≥ 12 (3 functions × multiple overload lines)

### 3. Query keys cover all 6 variants

1. Run: `grep -c 'mutualFollows\|mutualFollowers\|followedByMyFollows\|infiniteMutualFollows\|infiniteMutualFollowers\|infiniteFollowedByMyFollows' packages/node/src/keys/followers.ts`
2. **Expected:** Returns ≥ 6

### 4. React factory functions exist

1. Run: `ls packages/react/src/hooks/factories/followers/create-use-*.ts | wc -l`
2. **Expected:** Returns 6 (3 base + 3 infinite factories)

### 5. Concrete React hooks exist and export correctly

1. Run: `ls packages/react/src/hooks/followers/use-*.ts | wc -l`
2. **Expected:** Returns 6

3. Run: `grep 'export' packages/react/src/hooks/followers/index.ts | wc -l`
4. **Expected:** Returns ≥ 6 (re-exports for all hooks)

### 6. Next.js server actions exist with Zod validation

1. Run: `grep -c 'getMutualFollows\|getMutualFollowers\|getFollowedByMyFollows' packages/next/src/actions/followers.ts`
2. **Expected:** Returns ≥ 6 (3 functions with multiple references)

3. Run: `grep 'validateInput' packages/next/src/actions/followers.ts | wc -l`
4. **Expected:** Returns ≥ 3 (one per server action)

### 7. Next.js client hooks exist and export correctly

1. Run: `ls packages/next/src/hooks/followers/use-*.ts | wc -l`
2. **Expected:** Returns 6

3. Run: `grep 'export' packages/next/src/hooks/followers/index.ts | wc -l`
4. **Expected:** Returns ≥ 6

### 8. ProfileInclude narrowing compiles

1. Run: `pnpm --filter=@lsp-indexer/react build 2>&1 | grep -i error`
2. **Expected:** No output (no errors — the 3-overload signatures with `ProfileInclude` generics compile clean)

3. Run: `grep -c 'ProfileInclude' packages/react/src/hooks/factories/followers/create-use-mutual-follows.ts`
4. **Expected:** Returns ≥ 1 (confirming include narrowing is wired)

### 9. Return types mirror profile return shape

1. Run: `grep 'UseMutualFollowsReturn\|UseInfiniteMutualFollowsReturn\|UseMutualFollowersReturn\|UseInfiniteMutualFollowersReturn\|UseFollowedByMyFollowsReturn\|UseInfiniteFollowedByMyFollowsReturn' packages/react/src/hooks/types/followers.ts | wc -l`
2. **Expected:** Returns ≥ 6

## Edge Cases

### Empty address params rejected by Zod

1. Check that Zod schemas require `addressA` and `addressB` (or `myAddress` and `targetAddress`) as non-empty strings:
   `grep -A5 'addressA\|myAddress' packages/types/src/followers.ts | head -20`
2. **Expected:** Address fields are defined with `z.string()` or similar validators — not optional

### Infinite variants include pagination params

1. Run: `grep 'offset\|limit\|pageSize' packages/types/src/followers.ts | wc -l`
2. **Expected:** Returns ≥ 3 (infinite schemas extend base with pagination)

## Failure Signals

- Any `pnpm --filter=@lsp-indexer/* build` exits non-zero → type contract broken
- Missing files in `packages/react/src/hooks/followers/` or `packages/next/src/hooks/followers/` → incomplete wiring
- `grep` counts below thresholds → schemas/functions not fully added
- `ProfileInclude` import errors → generic narrowing broken

## Not Proven By This UAT

- Runtime correctness against live Hasura — deferred to S02 test app playground
- Actual data returned by mutual follow queries (requires real follower data in Hasura)
- Pagination behavior under load
- Error handling for invalid addresses or network failures at runtime

## Notes for Tester

- This is a compile-time contract verification UAT — no running services needed
- The `getFollowedByMyFollows` action uses `myAddress` + `targetAddress` (not a single `address` param) — this was a plan deviation, not a bug
- Mutual follow hooks require both addresses as mandatory params (no `= {}` default) — this is intentional since intersection queries always need two addresses
