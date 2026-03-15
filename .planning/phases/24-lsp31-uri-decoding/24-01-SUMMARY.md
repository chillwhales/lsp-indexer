---
phase: 24-lsp31-uri-decoding
plan: 01
subsystem: indexer
tags: [lsp31, lsp29, uri-decoding, ipfs, multi-backend]

# Dependency graph
requires:
  - phase: 23-lsp29-lsp31-decoding-update
    provides: "@chillwhales/lsp31 package installed, LSP29 handler rewritten with v2.0.0 entities"
provides:
  - "LSP31 multi-backend URI decoding in LSP29 extractFromIndex"
  - "IPFS-preferred backend selection via selectBackend"
  - "VerifiableURI fallback for backward compatibility"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: ["LSP31-first decode with VerifiableURI fallback via decodeLsp29DataValue helper"]

key-files:
  created: []
  modified:
    - "packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts"
    - "packages/indexer/src/handlers/__tests__/lsp29EncryptedAsset.handler.test.ts"

key-decisions:
  - "IPFS backend preferred via selectBackend(entries, 'ipfs') — IPFS is the primary storage for encrypted asset metadata"

patterns-established:
  - "decodeLsp29DataValue: LSP31-first decode with VerifiableURI fallback pattern for backward compatibility"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 24 Plan 01: LSP31 URI Decoding Summary

**LSP31 multi-backend URI decoding in extractFromIndex with IPFS preference and VerifiableURI fallback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T19:24:21Z
- **Completed:** 2026-03-15T19:29:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Switched extractFromIndex from VerifiableURI-only to LSP31-first decoding with VerifiableURI fallback
- Added decodeLsp29DataValue helper using isLsp31Uri → parseLsp31Uri → selectBackend → resolveUrl chain
- IPFS backend preferred via selectBackend(entries, 'ipfs')
- 3 new test cases covering LSP31 decode, VerifiableURI fallback, and malformed input error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Add LSP31 URI decoding to extractFromIndex with VerifiableURI fallback** - `0d7ed9b` (feat)
2. **Task 2: Add LSP31 decode test cases to handler test file** - `e6a764e` (test)

## Files Created/Modified
- `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts` - Added decodeLsp29DataValue helper, LSP31 imports, updated extractFromIndex to use LSP31-first decode
- `packages/indexer/src/handlers/__tests__/lsp29EncryptedAsset.handler.test.ts` - Added 3 LSP31 decode tests with encoded fixtures

## Decisions Made
- IPFS backend preferred via selectBackend(entries, 'ipfs') — IPFS is the primary storage backend for encrypted asset metadata in the LUKSO ecosystem

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures in `lsp29EncryptedAssetFetch.handler.test.ts` (12 failures) and `lsp4MetadataFetch.handler.test.ts` (2 failures) — these are unrelated to this plan's changes and pre-date this execution. All 17 tests in the handler file modified by this plan pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 24 complete (single plan) — LSP29 handler now correctly decodes LSP31 multi-backend URIs
- No blockers for future work

## Self-Check: PASSED

- ✅ `packages/indexer/src/handlers/lsp29EncryptedAsset.handler.ts` — exists
- ✅ `packages/indexer/src/handlers/__tests__/lsp29EncryptedAsset.handler.test.ts` — exists
- ✅ `.planning/phases/24-lsp31-uri-decoding/24-01-SUMMARY.md` — exists
- ✅ Commit `0d7ed9b` — found
- ✅ Commit `e6a764e` — found

---
*Phase: 24-lsp31-uri-decoding*
*Completed: 2026-03-15*
