---
id: S01
parent: M009
milestone: M009
provides:
  - ChainConfig registry
  - network column on all entities
  - prefixId() helper
  - Parameterized processor factory
  - supportedChains filtering
requires:
  []
affects:
  - S02
  - S03
key_files:
  - packages/indexer/src/config/chainConfig.ts
  - packages/indexer/src/app/processorFactory.ts
  - packages/indexer/src/core/pipeline.ts
  - packages/indexer/src/core/batchContext.ts
  - packages/indexer/src/utils/index.ts
  - packages/indexer/schema.graphql
  - .gitignore
key_decisions:
  - ChillWhales handlers lukso-only (D013)
  - UUID IDs not prefixed (D015)
  - Per-chain stateSchema (D016)
  - Testnet has no gateway (D017)
patterns_established:
  - prefixId(network, compositeId) for deterministic IDs
  - ChainConfig registry with getChainConfig()
  - BatchContext carries network string
  - ProcessorFactory creates chain-specific processors
  - supportedChains filtering on plugins/handlers
observability_surfaces:
  - CHAIN_ID env var controls chain config
  - Per-chain stateSchema for independent processor state
drill_down_paths:
  - .gsd/milestones/M009/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M009/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M009/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M009/slices/S01/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T06:54:14.571Z
blocker_discovered: false
---

# S01: Chain-Aware Indexer Core

**Made the indexer structurally multi-chain with typed ChainConfig registry, network column on all 71 entities, network-prefixed deterministic IDs, supportedChains on all plugins/handlers, and parameterized processor factory.**

## What Happened

This slice transformed the Subsquid indexer from single-chain to structurally multi-chain across 4 tasks plus closer fixes. T01 created ChainConfig with LUKSO mainnet/testnet configs and added network field to all 71 entities. T02 added supportedChains to all 40 plugins/handlers and created prefixId helper. T03 replaced singleton processor with factory, threaded network through BatchContext/pipeline, made multicall config-aware. T04 set network on all entity creation sites and prefixed deterministic IDs. Closer fixes: removed accidentally re-committed src/abi/ files, fixed test fixtures for network-prefixed IDs across 12 test files, fixed lsp29 test data with invalid Zod schema values.

## Verification

pnpm --filter=@chillwhales/indexer build exits 0. pnpm --filter=@chillwhales/indexer test passes 306/306. Schema has 71 entities with network field. ChainConfig exists. processorFactory.ts exists, processor.ts deleted.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Schema has 71 entities (not 51 as planned). Two plugins retain hardcoded LSP23 address. lsp29 test data required Zod schema fixes.

## Known Limitations

deployedContracts/deployedProxies plugins still have local LSP23_ADDRESS constant instead of reading from ChainConfig.

## Follow-ups

Complete plugin address migration for deployedContracts/deployedProxies in S02 or S03.

## Files Created/Modified

- `packages/indexer/src/config/chainConfig.ts` — New: ChainConfig interface and LUKSO configs
- `packages/indexer/src/app/processorFactory.ts` — New: parameterized processor factory
- `packages/indexer/schema.graphql` — Added network field to all 71 entities
- `packages/indexer/src/core/pipeline.ts` — PipelineConfig includes network and chainConfig
- `packages/indexer/src/core/batchContext.ts` — IBatchContext has network field
- `packages/indexer/src/utils/index.ts` — Added prefixId, updated generateTokenId/generateFollowId
- `.gitignore` — Added packages/indexer/src/abi/ to prevent re-committing
