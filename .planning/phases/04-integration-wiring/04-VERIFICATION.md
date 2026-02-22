---
phase: 04-integration-wiring
verified: 2026-02-10T06:30:00Z
status: gaps_found
score: 2/4 requirements verified
gaps:
  - truth: 'User can run integration tests with real LUKSO block fixtures and see data flow through all 6 pipeline steps'
    status: failed
    reason: 'Integration tests exist only in open PR #139, not merged to base branch'
    artifacts:
      - path: 'packages/indexer-v2/test/integration/pipeline.test.ts'
        issue: 'File does not exist on refactor/indexer-v2 base branch'
      - path: 'packages/indexer-v2/test/fixtures/blocks/*.json'
        issue: 'Fixture files do not exist on refactor/indexer-v2 base branch'
    missing:
      - 'Merge PR #138 (block fixtures) to base branch'
      - 'Merge PR #139 (integration tests with 401 lines, 10 test cases) to base branch'
      - 'Run integration tests to verify they pass: pnpm test:integration'
  - truth: "User can verify handler execution order matches V1's dependency graph"
    status: partial
    reason: 'Handler ordering infrastructure exists but no test validates the actual order'
    artifacts:
      - path: 'packages/indexer-v2/src/app/bootstrap.ts'
        issue: 'getAllEntityHandlers() returns handlers but order is not explicitly tested'
    missing:
      - 'Test case in integration tests that validates handler execution order'
      - 'Assertion comparing handler order against expected V1 dependency graph'
---

# Phase 4: Integration & Wiring Verification Report

**Phase Goal:** All EventPlugins and EntityHandlers are discovered, registered, and wired into a bootable application that processes blocks through all 6 pipeline steps end-to-end.

**Verified:** 2026-02-10T06:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                     | Status     | Evidence                                           |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| 1   | User can boot the V2 application and see all EventPlugins and EntityHandlers discovered and registered    | ✓ VERIFIED | All 4 app files exist, bootstrap wired correctly   |
| 2   | User can see processor configured with topic subscriptions matching V1 event coverage                     | ✓ VERIFIED | processor.addLog() loop exists, subscriptions flow |
| 3   | User can run integration tests with real block fixtures verifying all 6 pipeline steps                    | ✗ FAILED   | Tests only in open PR #139, not on base branch     |
| 4   | User can verify handler execution order matches V1's dependency graph (NFT before FormattedTokenId, etc.) | ⚠️ PARTIAL | Infrastructure exists but no test validates order  |

**Score:** 2/4 truths verified (50%)

### Required Artifacts

| Artifact                                                | Expected                     | Status     | Details                                           |
| ------------------------------------------------------- | ---------------------------- | ---------- | ------------------------------------------------- |
| `packages/indexer-v2/src/app/processor.ts`              | EvmBatchProcessor configured | ✓ VERIFIED | 25 lines, exports processor instance              |
| `packages/indexer-v2/src/app/bootstrap.ts`              | Registry discovery module    | ✓ VERIFIED | 62 lines, createRegistry() with discovery         |
| `packages/indexer-v2/src/app/config.ts`                 | Pipeline config factory      | ✓ VERIFIED | 46 lines, assembles PipelineConfig                |
| `packages/indexer-v2/src/app/index.ts`                  | Main entry point with wiring | ✓ VERIFIED | 42 lines, complete bootstrap → run flow           |
| `packages/indexer-v2/test/fixtures/blocks/*.json`       | Real LUKSO block fixtures    | ✗ MISSING  | Only in PR #138, not merged                       |
| `packages/indexer-v2/test/integration/pipeline.test.ts` | End-to-end integration tests | ✗ MISSING  | Only in PR #139 (401 lines, 10 tests), not merged |

### Key Link Verification

| From              | To               | Via                           | Status      | Details                                       |
| ----------------- | ---------------- | ----------------------------- | ----------- | --------------------------------------------- |
| `index.ts`        | `bootstrap.ts`   | `createRegistry(logger)`      | ✓ WIRED     | Registry instantiated before processor.run()  |
| `bootstrap.ts`    | `PluginRegistry` | `registry.discover()`         | ✓ WIRED     | EventPlugins discovered from plugins/events/  |
| `bootstrap.ts`    | `PluginRegistry` | `registry.discoverHandlers()` | ✓ WIRED     | EntityHandlers discovered from handlers/      |
| `index.ts`        | `processor`      | `processor.addLog()` loop     | ✓ WIRED     | All log subscriptions applied from registry   |
| `index.ts`        | `processBatch`   | `processor.run()` handler     | ✓ WIRED     | Pipeline processes each batch through 6 steps |
| Integration tests | Block fixtures   | `loadFixture()`               | ✗ NOT_WIRED | Test file doesn't exist on base branch        |
| Integration tests | `processBatch`   | Direct call in test           | ✗ NOT_WIRED | Test file doesn't exist on base branch        |

### Requirements Coverage

| Requirement | Description                                                                      | Status      | Blocking Issue                                |
| ----------- | -------------------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| INTG-01     | Processor configured with all EventPlugin log subscriptions from registry        | ✓ SATISFIED | All wiring complete                           |
| INTG-02     | Application boots with all EventPlugins and EntityHandlers discovered/registered | ✓ SATISFIED | Bootstrap complete with structured logging    |
| INTG-03     | Integration tests with real block fixtures verify all 6 pipeline steps           | ✗ BLOCKED   | Tests in PR #139, not merged                  |
| INTG-04     | Handler ordering preserves V1's dependency graph                                 | ⚠️ PARTIAL  | Infrastructure exists but order not validated |

### Anti-Patterns Found

No anti-patterns found in merged code. The implementation quality is high:

- Clean separation of concerns (processor, bootstrap, config, entry)
- Proper dependency injection via createPipelineConfig()
- Structured logging throughout
- No TODOs, placeholders, or empty implementations
- All TypeScript compilation passes

### Human Verification Required

#### 1. Boot the Application

**Test:** Run `pnpm --filter=@chillwhales/indexer-v2 start` and observe logs  
**Expected:** Application boots successfully, logs show:

- "Discovered EventPlugins" with count (should be 11)
- "Discovered EntityHandlers in dependency order" with names
- "Generated log subscriptions" with count
- "Processor configured with log subscriptions from registry"
- "Starting processor — V2 indexer ready"

**Why human:** Need to verify actual boot behavior and log output format

#### 2. Verify Handler Order

**Test:** Boot the application and inspect `handlerOrder` array in boot logs  
**Expected:** Handler order matches V1 dependency graph:

- NFT handler before FormattedTokenId
- Transfer handlers before totalSupply and ownedAssets
- Core handlers before metadata handlers

**Why human:** Need to validate the specific order against V1 implementation

### Gaps Summary

**Phase 4 is 50% complete (2/4 requirements satisfied).**

The application wiring is **fully functional** on the base branch:

- ✅ Processor configuration complete
- ✅ Registry discovery complete
- ✅ Pipeline integration complete
- ✅ All 3 merged PRs have high-quality implementations

**However, verification is incomplete:**

- ❌ Integration tests **only exist in open PR #139**
- ❌ Block fixtures **only exist in open PR #138**

This creates a **verification gap**: The code exists and appears correct, but we cannot prove the phase goal is achieved without the integration tests.

**The issue is NOT code quality** — the merged PRs (#135, #136, #137) are excellent:

- Clean architecture
- Proper wiring
- No stubs or placeholders
- Good documentation

**The issue IS incomplete PR merging:**

- PR #138 adds fixtures but remains OPEN
- PR #139 adds 401-line integration test suite but remains OPEN
- Without these merged, INTG-03 (integration tests verify 6 steps) FAILS

**Impact:**

- Phase 4 cannot be marked "Complete" until PRs #138 and #139 are merged
- Phase 5 should NOT start until Phase 4 verification passes
- Roadmap shows Phase 4 as "Not Started" but should show "In Progress (2/4 complete)"

---

_Verified: 2026-02-10T06:30:00Z_  
_Verifier: Claude (gsd-verifier)_
