---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T01: Add safeHexToBool utility and replace all 3 raw hexToBool call sites

Create `safeHexToBool(hex: Hex): boolean` in `packages/indexer/src/utils/index.ts` that wraps viem's `hexToBool` in try-catch, returning `false` on any error. Then replace the raw `hexToBool` call at each of the 3 call sites:

1. `packages/indexer/src/core/verification.ts` line 233
2. `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` line 177
3. `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` line 174

At each call site, replace `hexToBool(...)` with `safeHexToBool(...)`, add the import from `@/utils`, and remove `hexToBool` from the viem import. Prettier with `prettier-plugin-organize-imports` will auto-sort imports — don't manually arrange them.

The utils file already imports `Hex` and `isHex` from viem but needs `hexToBool` added to that import for the wrapper implementation.

Existing safe wrapper precedent in the same file: `safeBigInt`, `safeHexToNumber`, `safeJsonStringify`.

## Inputs

- ``packages/indexer/src/utils/index.ts` — existing safe wrapper utilities, viem imports`
- ``packages/indexer/src/core/verification.ts` — hexToBool call site at line 233`
- ``packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` — hexToBool call site at line 177`
- ``packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` — hexToBool call site at line 174`

## Expected Output

- ``packages/indexer/src/utils/index.ts` — new safeHexToBool export, hexToBool added to viem import`
- ``packages/indexer/src/core/verification.ts` — uses safeHexToBool from @/utils, hexToBool removed from viem import`
- ``packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` — uses safeHexToBool from @/utils, hexToBool removed from viem import`
- ``packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` — uses safeHexToBool from @/utils, hexToBool removed from viem import`

## Verification

rg hexToBool packages/indexer/src/ | grep -v safeHexToBool | grep -c hexToBool | grep -q '^0$' && pnpm --filter=@chillwhales/indexer build
