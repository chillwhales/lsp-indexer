---
phase: 04-integration-wiring
fixed: 2026-02-10T07:00:00Z
pr: 139
branch: feat/indexer-v2-04-05-tests
commit: abb7741f8f1e4d8e0c5d3f1a9e7c5b3a1f9d7e5c
---

# Phase 4 Integration Test Fixes Summary

**Fixed:** 2026-02-10T07:00:00Z  
**PR:** #139 (feat/indexer-v2-04-05-tests)  
**Commit:** `abb7741` - "fix(indexer-v2): fix critical test issues in integration tests"

## Issues Fixed

### 🔴 Critical Issue #1: Wrong LSP8 Topic0 Hash (BLOCKER)

**File:** `packages/indexer-v2/test/integration/pipeline.test.ts` line 156

**Problem:** Test expected wrong topic0 hash for LSP8 Transfer event, would fail immediately when run.

**Fix:**

```diff
- '0xb333c813a7426223b383e5c3b9c73933703c0fc910884f2ff6bcbb0f64051a9c',
+ '0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf',
```

**Verification:** Corrected hash now matches:

- Fixture file `transfer-lsp8.json`
- ABI definition in `@chillwhales/abi` (LSP8Enumerable, LSP8Burnable, etc.)
- Plugin in `lsp8Transfer.plugin.ts`

---

### 🟡 Issue #2a: Weak NFT Entity Assertion

**File:** `packages/indexer-v2/test/integration/pipeline.test.ts` line 271

**Problem:** `toBeGreaterThanOrEqual(0)` always passes, even when NFT handler completely fails.

**Fix:**

```diff
- expect(nftEntities.length).toBeGreaterThanOrEqual(0); // May be 0 if NFT creation logic requires specific conditions
+ // LSP8 Transfer must create at least one NFT entity
+ expect(nftEntities.length).toBeGreaterThan(0);
```

**Justification:** LSP8 Transfer event should always create an NFT entity. If it doesn't, the handler is broken.

---

### 🟡 Issue #2b: Missing Parentheses on Mock Assertion

**File:** `packages/indexer-v2/test/integration/pipeline.test.ts` line 378

**Problem:** `expect(mockVerify).toHaveBeenCalled` checks if property exists (always true), not if function was called.

**Fix:**

```diff
- expect(mockVerify).toHaveBeenCalled;
+ expect(mockVerify).toHaveBeenCalled();
```

**Justification:** Vitest matchers require parentheses to execute the check.

---

### 🟡 Issue #3: Documentation Mismatch

**File:** `packages/indexer-v2/test/fixtures/blocks/README.md`

**Problem:** Documentation said "Real LUKSO blockchain blocks" but fixtures are synthetic.

**Fix:**

- Changed title description from "Real LUKSO blockchain blocks captured as JSON" to "Synthetic block fixtures in Subsquid format"
- Added explanation: "These fixtures use **real event topic0 hashes** from LUKSO LSP standards but **synthetic addresses, hashes, and block numbers** for simplicity and privacy"
- Clarified structure: "Real elements: Event topic0 hashes from `@chillwhales/abi`" and "Synthetic elements: Addresses, hashes, block numbers"
- Updated "Capture Process" to "Fixture Structure" section
- Removed misleading archive query instructions
- Updated "Adding New Fixtures" instructions to reflect synthetic approach

**Justification:** Documentation should match implementation. Synthetic fixtures are valid for integration tests.

---

## Changes Made

### Files Modified

1. `packages/indexer-v2/test/integration/pipeline.test.ts`

   - Line 156: Corrected LSP8 topic0 hash
   - Line 271: Strengthened NFT entity assertion
   - Line 378: Added parentheses to verification mock check

2. `packages/indexer-v2/test/fixtures/blocks/README.md`
   - Title/intro: Changed "Real" to "Synthetic"
   - Added explanation of what's real (topic0) vs synthetic (addresses/hashes)
   - Updated structure documentation
   - Updated "Adding New Fixtures" instructions
   - Removed misleading capture instructions

### Lines Changed

- **Test file:** 4 lines changed (3 fixes + 1 comment clarification)
- **README:** ~30 lines changed (rewording and restructuring)

---

## Verification Steps

Before considering PR #139 ready to merge, verify:

1. ✅ **Commit pushed** - Changes committed and pushed to `feat/indexer-v2-04-05-tests`
2. ⏳ **CI passes** - Wait for GitHub Actions to complete (Prettier, ESLint, Build)
3. ⏳ **Tests run** - Need to execute `pnpm test:integration` to verify tests actually pass
4. ⏳ **All 10 tests pass** - Confirm test suite completes successfully

---

## Impact on Phase 4 Verification

### Before Fix

- **INTG-03:** ❌ BLOCKED - Tests would fail immediately on wrong topic0
- **Test Quality:** 🔴 CRITICAL - Tests never executed successfully
- **Merge Status:** ❌ DO NOT MERGE

### After Fix

- **INTG-03:** 🟡 READY FOR TESTING - Tests should now execute without errors
- **Test Quality:** 🟢 ACCEPTABLE - Assertions now validate actual behavior
- **Merge Status:** ⏳ PENDING TEST EXECUTION - Need to verify tests actually pass

---

## Next Steps

1. **Run integration tests locally:**

   ```bash
   cd /home/coder/lsp-indexer
   pnpm --filter=@chillwhales/indexer-v2 test:integration
   ```

2. **If tests pass:**

   - Merge PR #138 (fixtures)
   - Merge PR #139 (tests with fixes)
   - Update Phase 4 verification report
   - Mark INTG-03 as ✅ SATISFIED

3. **If tests fail:**
   - Investigate failure reasons
   - Fix additional issues
   - Re-run until all tests pass

---

## Notes

- PR #138 (fixtures) already has correct "Synthetic" documentation - no fixes needed
- The fixtures themselves are correct (topic0 hashes match ABI)
- The issue was only in the test assertions and documentation, not in the implementation
- These fixes unblock Phase 4 completion

---

_Fixed: 2026-02-10T07:00:00Z_  
_Pushed to: feat/indexer-v2-04-05-tests (abb7741)_
