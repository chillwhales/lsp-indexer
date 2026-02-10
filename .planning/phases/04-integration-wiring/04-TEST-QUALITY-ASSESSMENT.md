---
phase: 04-integration-wiring
assessed: 2026-02-10T06:45:00Z
status: critical_issues_found
test_file: packages/indexer-v2/test/integration/pipeline.test.ts
fixture_files: packages/indexer-v2/test/fixtures/blocks/*.json
test_count: 10
lines: 401
---

# Phase 4 Integration Test Quality Assessment

**Assessed:** 2026-02-10T06:45:00Z  
**Test Suite:** `packages/indexer-v2/test/integration/pipeline.test.ts`  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

## Executive Summary

The integration tests have **good structure** but suffer from **3 critical issues** that undermine their effectiveness:

1. 🔴 **BLOCKER** — Wrong LSP8 topic0 hash in test fixture and assertion
2. 🟡 **MEDIUM** — Weak assertions that pass even when pipeline fails
3. 🟡 **MEDIUM** — Fixtures are synthetic, not real LUKSO blocks (contradicts documentation)

**Recommendation:** ❌ **DO NOT MERGE** until Issue #1 is fixed.

---

## Critical Issue #1: Wrong LSP8 Topic0 Hash 🔴

### Problem

The test expects LSP8 Transfer topic0 to be:

```
'0xb333c813a7426223b383e5c3b9c73933703c0fc910884f2ff6bcbb0f64051a9c'
```

But the actual LSP8 Transfer topic0 hash (from `@chillwhales/abi`) is:

```
'0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf'
```

**Difference:** Characters 17-80 differ completely.

### Evidence

**From test (line 155-157):**

```typescript
expect(lsp8TransferFixture.logs[0].topics[0]).toBe(
  '0xb333c813a7426223b383e5c3b9c73933703c0fc910884f2ff6bcbb0f64051a9c',
);
```

**From ABI package:**

```javascript
// packages/abi/lib/abi/LSP8Enumerable.js
Transfer: event("0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf", ...)
```

**From fixture (`transfer-lsp8.json` line 12):**

```json
"0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf"
```

### Impact

**CRITICAL — Test will FAIL on line 155-157:**

The test assertion checks if the fixture topic0 matches the hardcoded expected value. Since the fixture has the **correct** hash but the test expects the **wrong** hash, this test will **fail immediately** when run.

**This means the test suite has NEVER been executed successfully.**

### Root Cause

Likely a typo when writing the test assertion. The fixture itself has the correct hash (matching the ABI), but the test assertion has a different hash.

### Fix Required

Change line 155-157 in `pipeline.test.ts`:

```diff
      expect(lsp8TransferFixture.logs[0].topics[0]).toBe(
-       '0xb333c813a7426223b383e5c3b9c73933703c0fc910884f2ff6bcbb0f64051a9c',
+       '0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf',
      );
```

**Verification:** The corrected hash matches:

1. The fixture file (`transfer-lsp8.json` and `multi-event.json`)
2. The ABI definition in `packages/abi/lib/abi/LSP8*.js`
3. The plugin in `packages/indexer-v2/src/plugins/events/lsp8Transfer.plugin.ts`

---

## Critical Issue #2: Weak Assertions 🟡

### Problem

Several tests use assertions that **always pass**, even when the pipeline produces no output.

### Evidence

**Line 271 — NFT entity check:**

```typescript
expect(nftEntities.length).toBeGreaterThanOrEqual(0);
```

**Line 373 — Handler entities check:**

```typescript
expect(store.upsertedEntities.length).toBeGreaterThanOrEqual(0);
```

**Line 377 — Verification check:**

```typescript
expect(mockVerify).toHaveBeenCalled; // Missing parentheses!
```

### Impact

**MEDIUM — Tests pass when they should fail:**

1. `toBeGreaterThanOrEqual(0)` passes when length is 0, 1, or any number

   - If NFT handler fails completely, test still passes
   - If no derived entities created, test still passes

2. `expect(mockVerify).toHaveBeenCalled` without parentheses checks if the property exists (always true), not if it was called
   - Should be: `expect(mockVerify).toHaveBeenCalled()`

### Root Cause

Over-cautious test writing with fallback comments like:

```typescript
// May be 0 if NFT creation logic requires specific conditions
```

The test author wasn't confident about expected behavior, so wrote tests that can't fail.

### Fix Required

Replace weak assertions with specific expectations:

```diff
// Line 271 - LSP8 Transfer Processing
- expect(nftEntities.length).toBeGreaterThanOrEqual(0);
+ expect(nftEntities.length).toBeGreaterThan(0); // LSP8 transfer MUST create NFT entity

// Line 373 - End-to-End Verification
- expect(store.upsertedEntities.length).toBeGreaterThanOrEqual(0);
+ expect(store.upsertedEntities.length).toBeGreaterThan(0); // Handlers MUST create derived entities

// Line 377 - Verification function
- expect(mockVerify).toHaveBeenCalled;
+ expect(mockVerify).toHaveBeenCalled(); // Add parentheses to actually check calls
```

**Alternative:** If 0 entities is valid for some edge cases, document WHY and add a separate test for the success case.

---

## Critical Issue #3: Synthetic Fixtures (Documentation Mismatch) 🟡

### Problem

**Documentation says:** "Real LUKSO blockchain blocks captured as JSON"

**Reality:** Fixtures are synthetic/fake with placeholder data:

- Block hashes: `0x7f9e4c2b1a5f8d3e...` (not real LUKSO block hashes)
- Addresses: `0x1234567890abcdef...`, `0xdeadbeef...`, `0x11111111...`
- Transaction hashes: `0xabcdef1234567890...`
- Block numbers: 5234567, 5234789, 5235012 (no evidence these exist on LUKSO)

### Evidence

**From README.md:**

> Real LUKSO blockchain blocks captured as JSON for deterministic integration testing.

**From transfer-lsp7.json:**

```json
{
  "header": {
    "height": 5234567,
    "hash": "0x7f9e4c2b1a5f8d3e6c4a2b1f9e7d5c3a1f8e6d4c2b1a9f7e5d3c1a8f6e4d2c1b"
  },
  "logs": [{
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "topics": [...],
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  }]
}
```

**From SUMMARY.md (04-04):**

> - **Synthetic fixtures:** Created synthetic fixtures instead of capturing real blocks for deterministic testing

### Impact

**MEDIUM — Tests may not catch real-world edge cases:**

Synthetic fixtures have perfect structure but may miss:

- Real encoding quirks in data fields
- Edge cases in topic indexing
- Real transaction ordering issues
- Actual LUKSO chain behavior

However, for **structural testing** (does the pipeline flow work?), synthetic fixtures are acceptable.

### Root Cause

**Contradiction between plan and execution:**

- Plan said "real LUKSO block fixtures"
- Execution created synthetic fixtures (legitimate decision)
- Documentation not updated to match

### Fix Required

**Option A (Recommended):** Update documentation to match reality:

```diff
# Block Fixtures for Integration Tests

- Real LUKSO blockchain blocks captured as JSON for deterministic integration testing.
+ Synthetic block fixtures in Subsquid format for deterministic integration testing.
+ These fixtures use real event topic0 hashes but synthetic addresses and hashes for privacy and simplicity.
```

**Option B:** Replace with real LUKSO blocks:

- More work
- Better coverage of real-world cases
- Requires privacy review (no PII)

---

## Positive Aspects ✅

Despite the issues above, the test suite has **strong fundamentals**:

### Good Structure

1. **Clean separation:** Fixtures, mocks, and tests well-organized
2. **Mock quality:** MockStore and MockVerifyFn are properly implemented
3. **No network dependency:** All external calls mocked (RPC, IPFS, verification)
4. **Deterministic:** Same fixtures always produce same results
5. **Coverage:** Tests all 6 pipeline steps explicitly

### Good Test Cases

| Test                     | Purpose                                             | Quality                           |
| ------------------------ | --------------------------------------------------- | --------------------------------- |
| Fixture Loading          | Validates fixtures exist and have correct structure | ✅ Good                           |
| Registry Discovery       | Validates plugin/handler discovery from filesystem  | ✅ Good                           |
| Handler Order (INTG-04)  | Validates NFT before FormattedTokenId dependency    | ✅ Good                           |
| LSP7 Transfer Processing | Validates LSP7 event through pipeline               | 🟡 Weak assertions                |
| LSP8 Transfer Processing | Validates LSP8 event and NFT creation               | 🔴 Wrong topic0 + weak assertions |
| Multi-Event Block        | Validates multiple events in one block              | ✅ Good                           |
| End-to-End Verification  | Validates all 6 steps execute                       | 🟡 Weak assertions                |
| No Network Dependency    | Meta-test validating fixture approach               | ✅ Good                           |

### Good Patterns

- Uses `beforeAll` to discover plugins/handlers once
- Logs entity counts for debugging
- Tests both happy path and edge cases
- Validates handler execution order (INTG-04)
- Proper TypeScript typing throughout

---

## Missing Coverage

Tests **do not verify**:

1. **Entity content correctness** — Tests check entities exist but not if fields are populated correctly
2. **FK enrichment** — Tests don't verify that Step 6 (ENRICH) actually updates foreign key references
3. **Handler logic** — Tests don't verify totalSupply calculations, ownedAssets updates, etc.
4. **Error handling** — No tests for invalid events, malformed data, or verification failures
5. **Metadata fetching** — Worker pool is mocked, no test validates metadata handlers run

**Note:** This is acceptable for **integration tests** focused on pipeline flow. Unit tests should cover handler logic.

---

## Recommendations

### 🔴 Before Merge (Blockers)

1. **Fix LSP8 topic0 hash** — Change test assertion to match fixture and ABI

   - File: `pipeline.test.ts` line 155-157
   - Change to: `0xb333c813a7426a7a11e2b190cad52c44119421594b47f6f32ace6d8c7207b2bf`

2. **Run the test suite** — Verify tests actually pass
   - Command: `pnpm --filter=@chillwhales/indexer-v2 test:integration`
   - Expected: All 10 tests pass
   - If failures: Fix before merge

### 🟡 Before Phase 4 Complete (High Priority)

3. **Strengthen assertions** — Replace `toBeGreaterThanOrEqual(0)` with `toBeGreaterThan(0)` where entities are expected

   - Lines 271, 373
   - Add specific entity count expectations if known

4. **Fix verification check** — Add parentheses to `expect(mockVerify).toHaveBeenCalled()`

   - Line 377

5. **Update documentation** — Change "Real LUKSO blocks" to "Synthetic fixtures" in README
   - File: `test/fixtures/blocks/README.md`

### 🟢 Future Improvements (Nice to Have)

6. **Add FK enrichment validation** — Check that foreign key references are updated in Step 6
7. **Add error case tests** — Invalid events, verification failures, mock verification returning invalid
8. **Add V1 parity tests** — Compare V2 output against known V1 output for same fixtures
9. **Document expected handler order** — Replace TODO on line 201 with explicit order list

---

## Test Execution Evidence

**CRITICAL:** The test suite has likely **NEVER been run successfully** because:

1. Line 155-157 will fail (wrong LSP8 topic0 expected)
2. No CI logs showing test execution
3. PR description mentions tests but no "tests passing" verification

**Before merging PR #139, the author MUST:**

1. Fix the topic0 hash
2. Run `pnpm test:integration`
3. Post CI logs or screenshot showing all tests pass

---

## Final Verdict

### Test Quality: 🟡 **FAIR** (needs fixes)

**Strengths:**

- Good structure and organization
- Proper mocking and isolation
- Covers all 6 pipeline steps
- Tests handler ordering (INTG-04)

**Weaknesses:**

- **BLOCKER:** Wrong LSP8 topic0 (tests will fail)
- Weak assertions that always pass
- Documentation/implementation mismatch
- No evidence tests have been run

### Merge Recommendation: ❌ **DO NOT MERGE**

**Fix required before merge:**

1. Correct LSP8 topic0 hash in test assertion (line 155-157)
2. Run test suite and verify all 10 tests pass
3. Post evidence of successful test run

**After fix:** Tests will be adequate for Phase 4 completion (INTG-03).

---

_Assessed: 2026-02-10T06:45:00Z_  
_Assessor: Claude (gsd-verifier)_
