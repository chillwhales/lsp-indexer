---
id: T03
parent: S01
milestone: M009
provides: []
requires: []
affects: []
key_files: ["packages/indexer/src/app/processorFactory.ts", "packages/indexer/src/app/index.ts", "packages/indexer/src/app/config.ts", "packages/indexer/src/app/bootstrap.ts", "packages/indexer/src/core/types/batchContext.ts", "packages/indexer/src/core/batchContext.ts", "packages/indexer/src/core/pipeline.ts", "packages/indexer/src/core/multicall.ts", "packages/indexer/src/core/verification.ts", "packages/indexer/src/core/registry.ts", "packages/indexer/src/constants/index.ts"]
key_decisions: ["Contract-scoped plugin addresses inlined in plugin files (intrinsic to plugin identity, identical on both chains)", "HandlerContext extended with multicallAddress for chain-specific multicall", "PluginRegistry accepts optional chainId for supportedChains filtering during discovery"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "All task must-haves verified: no chain-specific constants in constants/index.ts (rg finds 0 matches), network field present in batchContext.ts, processor.ts deleted, processorFactory.ts exists. All 4 slice-level checks pass: typeorm build exits 0, network count is 51, schema diff is empty, chainConfig.ts exists. Build succeeds with only pre-existing @chillwhales/abi errors unrelated to this change."
completed_at: 2026-04-02T05:57:18.765Z
blocker_discovered: false
---

# T03: Replaced singleton processor with parameterized factory, threaded network through BatchContext/pipeline, made multicall/verification config-aware, and removed all chain-specific constants from constants/index.ts

> Replaced singleton processor with parameterized factory, threaded network through BatchContext/pipeline, made multicall/verification config-aware, and removed all chain-specific constants from constants/index.ts

## What Happened
---
id: T03
parent: S01
milestone: M009
key_files:
  - packages/indexer/src/app/processorFactory.ts
  - packages/indexer/src/app/index.ts
  - packages/indexer/src/app/config.ts
  - packages/indexer/src/app/bootstrap.ts
  - packages/indexer/src/core/types/batchContext.ts
  - packages/indexer/src/core/batchContext.ts
  - packages/indexer/src/core/pipeline.ts
  - packages/indexer/src/core/multicall.ts
  - packages/indexer/src/core/verification.ts
  - packages/indexer/src/core/registry.ts
  - packages/indexer/src/constants/index.ts
key_decisions:
  - Contract-scoped plugin addresses inlined in plugin files (intrinsic to plugin identity, identical on both chains)
  - HandlerContext extended with multicallAddress for chain-specific multicall
  - PluginRegistry accepts optional chainId for supportedChains filtering during discovery
duration: ""
verification_result: passed
completed_at: 2026-04-02T05:57:18.765Z
blocker_discovered: false
---

# T03: Replaced singleton processor with parameterized factory, threaded network through BatchContext/pipeline, made multicall/verification config-aware, and removed all chain-specific constants from constants/index.ts

**Replaced singleton processor with parameterized factory, threaded network through BatchContext/pipeline, made multicall/verification config-aware, and removed all chain-specific constants from constants/index.ts**

## What Happened

Executed the full 12-step plan to make the indexer structurally multi-chain: created processorFactory.ts, added network to IBatchContext/BatchContext, extended PipelineConfig with network/chainConfig, parameterized multicall with multicallAddress, made verification config-aware with network on new UP/DA entities, updated config.ts/bootstrap.ts to accept ChainConfig, extended PluginRegistry with supportedChains filtering, rewrote app/index.ts to read CHAIN_ID env with per-chain stateSchema, cleaned constants/index.ts of all chain-specific values, inlined contract addresses in 4 plugins, updated 3 handlers to pass multicallAddress, fixed all test files, and deleted the old processor.ts.

## Verification

All task must-haves verified: no chain-specific constants in constants/index.ts (rg finds 0 matches), network field present in batchContext.ts, processor.ts deleted, processorFactory.ts exists. All 4 slice-level checks pass: typeorm build exits 0, network count is 51, schema diff is empty, chainConfig.ts exists. Build succeeds with only pre-existing @chillwhales/abi errors unrelated to this change.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `! rg 'SQD_GATEWAY|MULTICALL_ADDRESS|LSP26_ADDRESS|LSP23_ADDRESS|IPFS_GATEWAY' packages/indexer/src/constants/index.ts` | 0 | ✅ pass | 100ms |
| 2 | `rg 'network' packages/indexer/src/core/batchContext.ts` | 0 | ✅ pass | 50ms |
| 3 | `test ! -f packages/indexer/src/app/processor.ts` | 0 | ✅ pass | 10ms |
| 4 | `test -f packages/indexer/src/app/processorFactory.ts` | 0 | ✅ pass | 10ms |
| 5 | `pnpm --filter=@chillwhales/typeorm build` | 0 | ✅ pass | 2000ms |
| 6 | `grep -c 'network: String! @index' packages/indexer/schema.graphql` | 0 | ✅ pass | 50ms |
| 7 | `diff packages/indexer/schema.graphql packages/typeorm/schema.graphql` | 0 | ✅ pass | 50ms |
| 8 | `test -f packages/indexer/src/config/chainConfig.ts` | 0 | ✅ pass | 10ms |


## Deviations

Contract-scoped plugin addresses (LSP23, LSP26) were inlined in plugin files rather than accessed via BatchContext/ChainConfig as the plan suggested — the contractFilter is set at module-definition time before any runtime context exists, and both chains use identical addresses.

## Known Issues

Pre-existing: @chillwhales/abi module resolution errors in src/abi/ codegen files (unrelated to multi-chain work).

## Files Created/Modified

- `packages/indexer/src/app/processorFactory.ts`
- `packages/indexer/src/app/index.ts`
- `packages/indexer/src/app/config.ts`
- `packages/indexer/src/app/bootstrap.ts`
- `packages/indexer/src/core/types/batchContext.ts`
- `packages/indexer/src/core/batchContext.ts`
- `packages/indexer/src/core/pipeline.ts`
- `packages/indexer/src/core/multicall.ts`
- `packages/indexer/src/core/verification.ts`
- `packages/indexer/src/core/registry.ts`
- `packages/indexer/src/constants/index.ts`


## Deviations
Contract-scoped plugin addresses (LSP23, LSP26) were inlined in plugin files rather than accessed via BatchContext/ChainConfig as the plan suggested — the contractFilter is set at module-definition time before any runtime context exists, and both chains use identical addresses.

## Known Issues
Pre-existing: @chillwhales/abi module resolution errors in src/abi/ codegen files (unrelated to multi-chain work).
