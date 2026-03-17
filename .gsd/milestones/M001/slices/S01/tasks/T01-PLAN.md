# T01: 01-handler-migration 01

**Slice:** S01 — **Milestone:** M001

## Description

Add infrastructure changes that all Phase 1 handlers depend on: async handler support, a delete queue for DB-level entity removal, a post-verification handler hook (Step 5.5), and topological handler ordering in the registry. These are prerequisite capabilities — no handlers are created in this plan.

## Must-Haves

- [ ] 'Async handlers complete their DB/RPC operations before pipeline proceeds to next step'
- [ ] 'Entities can be deleted from the database via the pipeline (not just removed from in-memory bag)'
- [ ] 'Handlers can opt into running after verification (Step 5.5) when they need verified entity data'
- [ ] 'Handlers with dependency declarations execute in correct order — dependents always run after their dependencies'
- [ ] 'Existing handlers continue working without changes (all new features are opt-in via optional properties)'

## Files

- `packages/indexer-v2/src/core/types/handler.ts`
- `packages/indexer-v2/src/core/types/batchContext.ts`
- `packages/indexer-v2/src/core/batchContext.ts`
- `packages/indexer-v2/src/core/pipeline.ts`
- `packages/indexer-v2/src/core/registry.ts`
