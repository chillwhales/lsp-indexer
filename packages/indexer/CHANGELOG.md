# @chillwhales/indexer

## 2.3.4

### Patch Changes

- [#332](https://github.com/chillwhales/lsp-indexer/pull/332) [`5431425`](https://github.com/chillwhales/lsp-indexer/commit/543142514b65b6176ccdde7d985c0934c3cddf64) Thanks [@b00ste](https://github.com/b00ste)! - Fix OrbLevel/OrbCooldownExpiry FK enrichment failure when updated via TokenIdDataChanged events. TypeORM relation properties loaded from DB are not own enumerable properties, so spreading the entity missed digitalAsset and nft fields, causing the enrichment pipeline to skip FK assignment.

## 2.3.3

### Patch Changes

- [#329](https://github.com/chillwhales/lsp-indexer/pull/329) [`47c5917`](https://github.com/chillwhales/lsp-indexer/commit/47c59177a36dc12cb7b7ddfd959ab7f5d8b5f9b7) Thanks [@b00ste](https://github.com/b00ste)! - Fix critical integer overflow errors in hex conversion handlers

  Resolves crashes caused by `hexToNumber()` failing on large uint256 hex values in LSP8TokenIdFormat, LSP4TokenType, and decimals handlers. Replaces direct `hexToNumber()` calls with a safe `safeHexToNumber()` utility that validates values against explicit upper bounds per handler (token type ≤ 2, token ID format ≤ 104, decimals ≤ 255) and treats out-of-range values as invalid (null or throw) instead of crashing.

## 2.3.2

### Patch Changes

- [#323](https://github.com/chillwhales/lsp-indexer/pull/323) [`1cc1dbc`](https://github.com/chillwhales/lsp-indexer/commit/1cc1dbccb8519bddaea2e2e306c2f52501700320) Thanks [@b00ste](https://github.com/b00ste)! - Switch LSP29 handler to LSP31 multi-backend URI decoding with VerifiableURI fallback for backward compatibility

## 2.3.1

### Patch Changes

- [#324](https://github.com/chillwhales/lsp-indexer/pull/324) [`9807f3f`](https://github.com/chillwhales/lsp-indexer/commit/9807f3f3951d3f05ede489034d7d94c2085e1422) Thanks [@b00ste](https://github.com/b00ste)! - Fix IntegerOutOfRangeError when processing large hex values in viem v2.47.4

  Replace `hexToNumber()` with `BigInt()` in `decodeVerifiableUri` and `formatTokenId` functions to handle arbitrarily large hex numbers that exceed JavaScript's safe integer range. This resolves crashes at block 641099 where extremely large hex values caused viem's hexToNumber to throw IntegerOutOfRangeError.

## 2.3.0

### Minor Changes

- [#318](https://github.com/chillwhales/lsp-indexer/pull/318) [`35eb9b3`](https://github.com/chillwhales/lsp-indexer/commit/35eb9b3eb3fe7bf462958e08b89e353f6fca68c5) Thanks [@b00ste](https://github.com/b00ste)! - LSP29 v2.0.0 encrypted asset spec: replace AccessControlCondition with EncryptionParams, provider-first encryption model, per-backend chunk storage (ipfs/lumera/s3/arweave)

## 2.2.0

### Minor Changes

- [#313](https://github.com/chillwhales/lsp-indexer/pull/313) [`45a09c0`](https://github.com/chillwhales/lsp-indexer/commit/45a09c02780619cccebb9b54affb453d42ca9776) Thanks [@b00ste](https://github.com/b00ste)! - Add pipeline instrumentation with step timing and batch summary logging

  - Add performance timing to all 9 pipeline steps (EXTRACT through RESOLVE)
  - Emit structured durationMs logs for each step completion
  - Add BATCH_SUMMARY log at end of processBatch() with comprehensive timing data
  - Add missing createStepLogger loggers for EXTRACT and HANDLE steps
  - Add getTotalEntityCount() method to BatchContext for entity metrics

## 2.1.4

### Patch Changes

- [#310](https://github.com/chillwhales/lsp-indexer/pull/310) [`2f025d6`](https://github.com/chillwhales/lsp-indexer/commit/2f025d667829b0442a3a8ac054a2ff8db8bc4da6) Thanks [@b00ste](https://github.com/b00ste)! - Internal structured logging migration — migrated all console.\* calls to structured (attrs, message) pattern for Grafana/Loki queryability. All logs now emit structured fields queryable in Grafana/Loki, worker thread logs relay through parent, and LOGGING.md documents field conventions.

## 2.1.3

### Patch Changes

- [#303](https://github.com/chillwhales/lsp-indexer/pull/303) [`0c40b55`](https://github.com/chillwhales/lsp-indexer/commit/0c40b5519e6fdcb6bc455975076a807b959e63c0) Thanks [@b00ste](https://github.com/b00ste)! - Add timestamp field to all 36 entities that were missing it after Phase 19 block ordering changes. All entities now carry blockNumber, transactionIndex, logIndex, and timestamp for complete block position tracking.

## 2.1.2

### Patch Changes

- [#298](https://github.com/chillwhales/lsp-indexer/pull/298) [`122c754`](https://github.com/chillwhales/lsp-indexer/commit/122c754efcaf2535aa7775925c03cb239f71a3dc) Thanks [@b00ste](https://github.com/b00ste)! - Add structured blockNumber field to pipeline logs for Grafana filtering
