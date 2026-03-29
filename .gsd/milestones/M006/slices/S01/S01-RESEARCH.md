# S01 — Research: Defensive hexToBool hardening

**Date:** 2026-03-29

## Summary

All 3 `hexToBool` call sites confirmed. The pattern is identical at each — `isHex(r.returnData) && hexToBool(r.returnData)` inside a multicall result interpretation. The fix is a new `safeHexToBool` wrapper in the existing utils file, then mechanical replacement at each call site. The codebase already has `safeBigInt`, `safeHexToNumber`, and `safeJsonStringify` as precedent for this exact "safe wrapper" pattern.

## Recommendation

Add `safeHexToBool(hex: Hex): boolean` to `packages/indexer/src/utils/index.ts`. It wraps viem's `hexToBool` in try-catch, returning `false` on any error. Replace `hexToBool` at all 3 call sites, remove the `hexToBool` import from viem at each file. Single task — too small to decompose further.

## Implementation Landscape

### Key Files

- `packages/indexer/src/utils/index.ts` — Add `safeHexToBool`. Already has `import { Hex, isHex } from 'viem'` but needs `hexToBool` added to that import. Follows the established `safe*` naming convention.
- `packages/indexer/src/core/verification.ts` — Line 233: `hexToBool(r.returnData)` inside `multicallVerify()`. Import on line 18: `import { type Hex, hexToBool, isHex } from 'viem'`. Replace with `safeHexToBool` from `@/utils`, remove `hexToBool` from viem import.
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts` — Line 177: `hexToBool(result[index].returnData)`. Import on line 23. Same replacement pattern.
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts` — Line 174: `hexToBool(result[index].returnData)`. Import on line 20. Same replacement pattern.

### Build Order

Single task: create utility → replace call sites → build. No dependency chain — all 3 replacements are independent once the utility exists.

### Verification Approach

1. `rg hexToBool packages/indexer/src/` — should show only the `safeHexToBool` definition in utils and its 3 usages. No raw `hexToBool` imports from viem.
2. `pnpm --filter=@chillwhales/indexer build` — exits 0 with no type errors.

## Constraints

- viem's `hexToBool` only accepts `0x0` or `0x1` — any other hex throws `InvalidHexBooleanError`
- The `Hex` type from viem is needed for the parameter type annotation
- Prettier with `prettier-plugin-organize-imports` will auto-sort imports — don't manually arrange them
