# S27: Pipeline Instrumentation

**Goal:** Add performance timing to every pipeline step and emit a batch summary log at the end of processBatch().
**Demo:** Add performance timing to every pipeline step and emit a batch summary log at the end of processBatch().

## Must-Haves


## Tasks

- [x] **T01: 20.2-pipeline-instrumentation 01** `est:4min`
  - Add performance timing to every pipeline step and emit a batch summary log at the end of processBatch().

Purpose: Enable at-a-glance health monitoring — operators can see which pipeline steps are slow and track overall batch processing time in Grafana/Loki.
Output: Modified pipeline.ts with timing wraps on all 9 steps, EXTRACT/HANDLE loggers, and a BATCH_SUMMARY log.

## Files Likely Touched

- `packages/indexer/src/core/logger.ts`
- `packages/indexer/src/core/batchContext.ts`
- `packages/indexer/src/core/pipeline.ts`
