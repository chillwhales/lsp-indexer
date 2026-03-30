# S02: NftFilter + OwnedToken propagation

**Goal:** NFTs filterable by chillClaimed, orbsClaimed, maxLevel, cooldownExpiryBefore; full 5-package build passes including OwnedToken propagation verification.
**Demo:** After this: After this: NFTs filterable by chillClaimed/orbsClaimed/maxLevel/cooldownExpiryBefore; getOwnedTokens returns nested NFT custom fields with include narrowing.

## Tasks
- [x] **T01: Added chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema and wired corresponding Hasura relationship conditions in buildNftWhere** — Add chillClaimed, orbsClaimed, maxLevel, and cooldownExpiryBefore filter fields to NftFilterSchema in the types package, then add corresponding conditions to buildNftWhere in the node services package. Each filter maps to a nested Hasura relationship condition. Verify full 5-package build passes.

## Steps

1. Open `packages/types/src/nfts.ts`. In the `NftFilterSchema` z.object block (after the `isMinted` field), add 4 new fields:
   - `chillClaimed: z.boolean().optional()` — filter NFTs by chill claimed status
   - `orbsClaimed: z.boolean().optional()` — filter NFTs by orbs claimed status
   - `maxLevel: z.number().optional()` — filter NFTs at or below this level
   - `cooldownExpiryBefore: z.number().optional()` — filter NFTs whose cooldown expires before this timestamp
   Add JSDoc comments matching the existing style.

2. Open `packages/node/src/services/nfts.ts`. In the `buildNftWhere` function, after the `isMinted` condition block, add 4 new condition blocks:
   - `chillClaimed`: `if (filter.chillClaimed !== undefined)` → push `{ chillClaimed: { value: { _eq: filter.chillClaimed } } }`
   - `orbsClaimed`: `if (filter.orbsClaimed !== undefined)` → push `{ orbsClaimed: { value: { _eq: filter.orbsClaimed } } }`
   - `maxLevel`: `if (filter.maxLevel !== undefined)` → push `{ level: { value: { _lte: filter.maxLevel } } }`
   - `cooldownExpiryBefore`: `if (filter.cooldownExpiryBefore !== undefined)` → push `{ cooldownExpiry: { value: { _lte: filter.cooldownExpiryBefore } } }`
   CRITICAL: Use `!== undefined` checks, NOT truthiness. `false` and `0` are valid filter values.

3. Run `pnpm --filter=@lsp-indexer/types build` — types must compile.
4. Run `pnpm --filter=@lsp-indexer/node build` — node must compile with new conditions.
5. Run `pnpm build` — full 9-project build must exit 0.

## Must-Haves

- [ ] 4 new optional fields in NftFilterSchema
- [ ] 4 new condition blocks in buildNftWhere using `!== undefined` guard
- [ ] Boolean filters use `_eq`, numeric filters use `_lte`
- [ ] Full `pnpm build` exits 0

## Verification

- `pnpm --filter=@lsp-indexer/types build` exits 0
- `pnpm --filter=@lsp-indexer/node build` exits 0
- `pnpm build` exits 0 (all 9 workspace projects)
  - Estimate: 20m
  - Files: packages/types/src/nfts.ts, packages/node/src/services/nfts.ts
  - Verify: pnpm --filter=@lsp-indexer/types build && pnpm --filter=@lsp-indexer/node build && pnpm build
