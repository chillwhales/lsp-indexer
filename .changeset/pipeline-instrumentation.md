---
'@chillwhales/indexer': minor
---

Add pipeline instrumentation with step timing and batch summary logging

- Add performance timing to all 9 pipeline steps (EXTRACT through RESOLVE)
- Emit structured durationMs logs for each step completion
- Add BATCH_SUMMARY log at end of processBatch() with comprehensive timing data
- Add missing createStepLogger loggers for EXTRACT and HANDLE steps
- Add getTotalEntityCount() method to BatchContext for entity metrics
