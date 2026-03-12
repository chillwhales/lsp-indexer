---
'@chillwhales/indexer': patch
---

Add timestamp field to all 36 entities that were missing it after Phase 19 block ordering changes. All entities now carry blockNumber, transactionIndex, logIndex, and timestamp for complete block position tracking.
