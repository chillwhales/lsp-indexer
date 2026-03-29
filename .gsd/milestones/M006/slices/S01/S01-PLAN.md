# S01: Defensive hexToBool hardening

**Goal:** Replace all raw hexToBool calls with a defensive safeHexToBool wrapper that returns false on invalid hex, fixing the production crash at block 7,137,664.
**Demo:** After this: After this: pnpm --filter=@chillwhales/indexer build passes. All 3 hexToBool call sites use safeHexToBool. rg hexToBool shows only the safe wrapper definition and its usages.

## Tasks
- [x] **T01: Add safeHexToBool wrapper and replace all raw hexToBool call sites to fix production crash on invalid Multicall3 return data** — Create `safeHexToBool(hex: Hex): boolean` in `packages/indexer/src/utils/index.ts` that wraps viem's `hexToBool` in try-catch, returning `false` on any error. Then replace the raw `hexToBool` call at each of the 3 call sites:

1. `packages/indexer/src/core/verification.ts` line 233
2. `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` line 177
3. `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` line 174

At each call site, replace `hexToBool(...)` with `safeHexToBool(...)`, add the import from `@/utils`, and remove `hexToBool` from the viem import. Prettier with `prettier-plugin-organize-imports` will auto-sort imports — don't manually arrange them.

The utils file already imports `Hex` and `isHex` from viem but needs `hexToBool` added to that import for the wrapper implementation.

Existing safe wrapper precedent in the same file: `safeBigInt`, `safeHexToNumber`, `safeJsonStringify`.
  - Estimate: 15m
  - Files: packages/indexer/src/utils/index.ts, packages/indexer/src/core/verification.ts, packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts, packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
  - Verify: rg hexToBool packages/indexer/src/ | grep -v safeHexToBool | grep -c hexToBool | grep -q '^0$' && pnpm --filter=@chillwhales/indexer build
