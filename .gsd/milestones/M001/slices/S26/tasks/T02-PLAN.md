# T02: 20.1-structured-logging-overhaul 02

**Slice:** S26 — **Milestone:** M001

## Description

Migrate all remaining unstructured log calls in handlers, utilities, and worker threads to the structured `(attrs, message)` pattern.

Purpose: Eliminates the last JSON.stringify anti-pattern, template string logs, and console.* calls — completing the structured logging migration for Grafana/Loki queryability.
Output: Zero JSON.stringify in log args, zero template string logs in metadataFetch, worker logs relayed through parent.

## Must-Haves

- [ ] "orbsClaimed and chillClaimed handler logs emit structured attrs (not JSON.stringify)"
- [ ] "totalSupply handler uses context.log.warn with structured attrs instead of console.warn"
- [ ] "All metadataFetch.ts log calls use (attrs, message) pattern with extractable fields"
- [ ] "Worker thread console.error calls are relayed as LOG messages to parent for structured output"

## Files

- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
- `packages/indexer/src/handlers/totalSupply.handler.ts`
- `packages/indexer/src/utils/metadataFetch.ts`
- `packages/indexer/src/core/metadataWorker.ts`
- `packages/indexer/src/core/metadataWorkerPool.ts`
