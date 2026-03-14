# @chillwhales/indexer

## 2.1.4

### Patch Changes

- [#310](https://github.com/chillwhales/lsp-indexer/pull/310) [`2f025d6`](https://github.com/chillwhales/lsp-indexer/commit/2f025d667829b0442a3a8ac054a2ff8db8bc4da6) Thanks [@b00ste](https://github.com/b00ste)! - Internal structured logging migration — migrated all console.\* calls to structured (attrs, message) pattern for Grafana/Loki queryability. All logs now emit structured fields queryable in Grafana/Loki, worker thread logs relay through parent, and LOGGING.md documents field conventions.

## 2.1.3

### Patch Changes

- [#303](https://github.com/chillwhales/lsp-indexer/pull/303) [`0c40b55`](https://github.com/chillwhales/lsp-indexer/commit/0c40b5519e6fdcb6bc455975076a807b959e63c0) Thanks [@b00ste](https://github.com/b00ste)! - Add timestamp field to all 36 entities that were missing it after Phase 19 block ordering changes. All entities now carry blockNumber, transactionIndex, logIndex, and timestamp for complete block position tracking.

## 2.1.2

### Patch Changes

- [#298](https://github.com/chillwhales/lsp-indexer/pull/298) [`122c754`](https://github.com/chillwhales/lsp-indexer/commit/122c754efcaf2535aa7775925c03cb239f71a3dc) Thanks [@b00ste](https://github.com/b00ste)! - Add structured blockNumber field to pipeline logs for Grafana filtering
