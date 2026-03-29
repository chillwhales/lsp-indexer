# S01: Defensive hexToBool hardening — UAT

**Milestone:** M006
**Written:** 2026-03-29

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This is a compile-time fix replacing unsafe function calls with a safe wrapper. The build passing confirms correct integration. Runtime verification requires deploying against the live chain at block 7,137,664.

## Preconditions

- Repository checked out with all M006/S01 changes applied
- Node.js and pnpm available
- Dependencies installed (`pnpm install`)

## Smoke Test

Run `pnpm --filter=@chillwhales/indexer build` — should exit 0 with no errors.

## Test Cases

### 1. No raw hexToBool calls remain outside the wrapper

1. Run `rg hexToBool packages/indexer/src/`
2. **Expected:** All matches are in `packages/indexer/src/utils/index.ts` only (the import from viem, the JSDoc comment, and the `return hexToBool(hex)` inside `safeHexToBool`). Zero matches in any handler or core file.

### 2. safeHexToBool wrapper exists with correct signature

1. Open `packages/indexer/src/utils/index.ts`
2. Find the `safeHexToBool` function
3. **Expected:** Function signature is `function safeHexToBool(hex: Hex): boolean`. Body wraps `hexToBool(hex)` in try-catch, returning `false` on error.

### 3. verification.ts uses safe wrapper

1. Open `packages/indexer/src/core/verification.ts`
2. Search for `safeHexToBool`
3. **Expected:** `safeHexToBool` is imported from `@/utils` and used in `multicallVerify()` where `hexToBool` was previously called. No `hexToBool` import from viem exists.

### 4. orbsClaimed handler uses safe wrapper

1. Open `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
2. Search for `safeHexToBool`
3. **Expected:** `safeHexToBool` is imported from `@/utils` and used where `hexToBool` was previously called. No `hexToBool` import from viem exists.

### 5. chillClaimed handler uses safe wrapper

1. Open `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
2. Search for `safeHexToBool`
3. **Expected:** `safeHexToBool` is imported from `@/utils` and used where `hexToBool` was previously called. No `hexToBool` import from viem exists.

### 6. Build compiles clean

1. Run `pnpm --filter=@chillwhales/indexer build`
2. **Expected:** Exit code 0, no TypeScript errors.

## Edge Cases

### Invalid hex input at runtime (the original crash scenario)

1. When the indexer processes block 7,137,664 and `supportsInterface` returns non-boolean hex (e.g. ABI-encoded multi-word response)
2. **Expected:** `safeHexToBool` catches the `InvalidHexBooleanError` and returns `false`. The address is treated as not supporting the interface. No crash, no restart loop.

### Valid boolean hex input

1. When `supportsInterface` returns `0x0000...0001` (true) or `0x0000...0000` (false)
2. **Expected:** `safeHexToBool` delegates to `hexToBool` normally and returns the correct boolean.

## Failure Signals

- `pnpm --filter=@chillwhales/indexer build` fails with type errors
- `rg hexToBool` shows raw calls outside `utils/index.ts`
- Indexer crashes with `InvalidHexBooleanError` at block 7,137,664 after deployment

## Not Proven By This UAT

- Actual runtime behavior against the live LUKSO chain at block 7,137,664 (requires deployment)
- Performance impact of try-catch in the hot path (expected: negligible — errors are rare)

## Notes for Tester

All 3 call sites listed in the original plan were real: `verification.ts`, `orbsClaimed.handler.ts`, and `chillClaimed.handler.ts`. The `verification.ts` migration was initially missed and added during PR review. When you run `rg hexToBool packages/indexer/src/`, you should see matches only in `packages/indexer/src/utils/index.ts`. When you run `rg safeHexToBool packages/indexer/src/`, you should see matches in all three migrated files plus `utils/index.ts`.
