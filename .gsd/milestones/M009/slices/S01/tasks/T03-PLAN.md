---
estimated_steps: 40
estimated_files: 15
skills_used: []
---

# T03: Wire processor factory, thread network through BatchContext and pipeline, replace hardcoded constants

## Description

Replace the singleton processor with a parameterized factory. Thread `network` through BatchContext so all plugins/handlers can set it on entities. Make multicall and verification use ChainConfig instead of hardcoded constants. Update the entry point to read CHAIN_ID env var. Replace all hardcoded constant usage with ChainConfig lookups.

## Steps

1. Create `packages/indexer/src/app/processorFactory.ts`:
   - `createProcessor(config: ChainConfig): EvmBatchProcessor` that builds processor from config
   - If `config.gateway` is undefined, skip `setGateway()` (per D017 for testnet)
   - Set RPC, finality, block range, fields exactly as current processor.ts does

2. Update `packages/indexer/src/core/types/batchContext.ts` — add `readonly network: string` to `IBatchContext` interface.

3. Update `packages/indexer/src/core/batchContext.ts` — add `network` constructor param and property to `BatchContext` class.

4. Update `packages/indexer/src/core/pipeline.ts` — `processBatch` must accept `network` (from PipelineConfig or directly) and pass it to `new BatchContext({ network, ... })`. Update PipelineConfig to include `network: string` and `chainConfig: ChainConfig`.

5. Update `packages/indexer/src/core/multicall.ts` — change `aggregate3StaticLatest` to accept `multicallAddress: string` parameter instead of importing from constants. All callers must pass it.

6. Update `packages/indexer/src/core/verification.ts` — the `createVerifyFn` must accept `multicallAddress` param and pass it to multicall. Update the function to create UP/DA entities with the `network` field set.

7. Update `packages/indexer/src/app/config.ts` — `createPipelineConfig` takes `ChainConfig` and passes `network`, `chainConfig`, and multicall-aware verifyFn.

8. Update `packages/indexer/src/app/bootstrap.ts` — `createRegistry` should accept `ChainConfig` and filter plugins/handlers by `supportedChains.includes(config.id)`. The registry needs a method to filter by chain.

9. Update `packages/indexer/src/app/index.ts` — read `CHAIN_ID` from env (default 'lukso'), call `getChainConfig(chainId)`, create processor via factory, wire everything through. Use `stateSchema: \`squid_processor_${config.network}\`` per D016. Delete `packages/indexer/src/app/processor.ts` (replaced by factory).

10. Update `packages/indexer/src/constants/index.ts` — remove all chain-specific constants (SQD_GATEWAY, RPC_URL, RPC_RATE_LIMIT, FINALITY_CONFIRMATION, IPFS_GATEWAY, MULTICALL_ADDRESS, LSP26_ADDRESS, LSP23_ADDRESS). Keep only chain-agnostic constants (FETCH_LIMIT, FETCH_BATCH_SIZE, etc., ZERO_ADDRESS, DEAD_ADDRESS). Move CHILLWHALES constants to stay in chillwhales.ts.

11. Update all plugin files that import from `@/constants` (follow, unfollow, deployedContracts, deployedProxies) to get contract addresses from ChainConfig via BatchContext or constructor param.

12. Update all handler files that call `aggregate3StaticLatest` to pass multicall address from handler context.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| CHAIN_ID env var | Throw descriptive error listing available chains | N/A | Same as error — reject unknown string |
| ChainConfig registry | getChainConfig throws | N/A | N/A |

## Must-Haves

- [ ] Processor created from ChainConfig, not hardcoded constants
- [ ] BatchContext carries network string
- [ ] All entity creation sets network field
- [ ] Multicall uses config address, not constant
- [ ] Verification creates UP/DA with network field
- [ ] Entry point reads CHAIN_ID, defaults to 'lukso'
- [ ] TypeormDatabase uses per-chain stateSchema (D016)
- [ ] Plugin registry filters by supportedChains
- [ ] No chain-specific constants remain in constants/index.ts
- [ ] processor.ts deleted (replaced by processorFactory.ts)

## Verification

- `pnpm --filter=@chillwhales/indexer build` exits 0
- `! rg 'SQD_GATEWAY|RPC_URL.*lukso|MULTICALL_ADDRESS|LSP26_ADDRESS|LSP23_ADDRESS' packages/indexer/src/constants/index.ts` (no chain-specific constants)
- `rg 'network' packages/indexer/src/core/batchContext.ts` finds the field
- `test ! -f packages/indexer/src/app/processor.ts` (deleted)
- `test -f packages/indexer/src/app/processorFactory.ts`

## Inputs

- ``packages/indexer/src/config/chainConfig.ts` — ChainConfig type and registry from T01`
- ``packages/indexer/src/core/types/plugins.ts` — EventPlugin with supportedChains from T02`
- ``packages/indexer/src/core/types/handler.ts` — EntityHandler with supportedChains from T02`
- ``packages/indexer/src/utils/index.ts` — prefixId helper from T02`
- ``packages/indexer/src/app/processor.ts` — current singleton processor to replace`
- ``packages/indexer/src/app/index.ts` — current entry point to parameterize`
- ``packages/indexer/src/core/batchContext.ts` — BatchContext to add network to`
- ``packages/indexer/src/core/pipeline.ts` — pipeline to thread network through`
- ``packages/indexer/src/core/multicall.ts` — multicall to make config-aware`
- ``packages/indexer/src/core/verification.ts` — verification to make config-aware`
- ``packages/indexer/src/constants/index.ts` — constants to clean up`

## Expected Output

- ``packages/indexer/src/app/processorFactory.ts` — createProcessor(config) factory`
- ``packages/indexer/src/app/index.ts` — parameterized entry point with CHAIN_ID`
- ``packages/indexer/src/app/config.ts` — updated createPipelineConfig with ChainConfig`
- ``packages/indexer/src/app/bootstrap.ts` — chain-filtered registry creation`
- ``packages/indexer/src/core/types/batchContext.ts` — IBatchContext with network field`
- ``packages/indexer/src/core/batchContext.ts` — BatchContext with network property`
- ``packages/indexer/src/core/pipeline.ts` — network-aware pipeline`
- ``packages/indexer/src/core/multicall.ts` — config-aware multicall`
- ``packages/indexer/src/core/verification.ts` — config-aware verification with network on entities`
- ``packages/indexer/src/constants/index.ts` — chain-agnostic constants only`

## Verification

pnpm --filter=@chillwhales/indexer build && test ! -f packages/indexer/src/app/processor.ts && test -f packages/indexer/src/app/processorFactory.ts
