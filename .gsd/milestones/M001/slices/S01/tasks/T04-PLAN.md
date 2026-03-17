# T04: 01-handler-migration 04

**Slice:** S01 — **Milestone:** M001

## Description

Delete all legacy code that has been superseded by the V2 EntityHandler pattern and enrichment queue pipeline (HMIG-05). This includes handlerHelpers.ts (dead code replaced by standalone handlers in Plans 02-03), populateHelpers.ts (populate pattern replaced by enrichment queue), and persistHelpers.ts (persist pattern replaced by pipeline Steps 2/4). Update the barrel export and verify zero dangling references.

## Must-Haves

- [ ] 'No legacy code remains — DataKeyPlugin interface, populate helpers, handler helpers all deleted'
- [ ] 'Zero references to deleted files remain in the codebase'
- [ ] 'core/index.ts barrel export updated to remove deleted modules'

## Files

- `packages/indexer-v2/src/core/handlerHelpers.ts`
- `packages/indexer-v2/src/core/populateHelpers.ts`
- `packages/indexer-v2/src/core/persistHelpers.ts`
- `packages/indexer-v2/src/core/index.ts`
