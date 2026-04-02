# S01: Chain-Aware Indexer Core

**Goal:** Make the indexer structurally multi-chain: typed chain config registry, network column on all 51 entities, network-prefixed deterministic IDs, supportedChains on every plugin/handler, parameterized processor factory. Zero hardcoded LUKSO constants in src/.
**Demo:** After this: Start indexer with CHAIN_ID=lukso — it boots, processes blocks, writes entities with network='lukso'. pnpm build passes with all 51 entities having network field. Zero hardcoded LUKSO constants remain in src/.

## Tasks
- [x] **T01: Created typed ChainConfig registry with LUKSO mainnet/testnet configs, added network: String! @index to all 51 entities, and regenerated TypeORM models** — ## Description

Create the typed ChainConfig interface and LUKSO mainnet/testnet configs. Add `network: String! @index` to all 51 entity types in both schema.graphql files. Run codegen to regenerate entity model classes with the new column. This is the foundational task — everything else depends on the generated models having the `network` field.

## Steps

1. Create `packages/indexer/src/config/chainConfig.ts` with:
   - `ChainConfig` interface: `{ id: string; network: string; rpcUrl: string; rpcRateLimit: number; finalityConfirmation: number; gateway?: string; multicallAddress: string; ipfsGateway: string; contracts: { lsp26Address: string; lsp23Address: string; lsp23FromBlock: number; lsp26FromBlock: number; } }`
   - `LUKSO_MAINNET` config object with all current hardcoded values from `constants/index.ts`
   - `LUKSO_TESTNET` config object with testnet values (RPC: https://rpc.testnet.lukso.network, no gateway per D017, same multicall address)
   - `CHAIN_CONFIGS: Record<string, ChainConfig>` registry mapping `'lukso'` and `'lukso-testnet'` to their configs
   - `getChainConfig(chainId: string): ChainConfig` function that throws on unknown chainId with helpful error

2. Add `network: String! @index` field to ALL 51 `@entity` types in `packages/indexer/schema.graphql`. Place it right after the `id` field in each entity. The field must be present on every single entity — no exceptions.

3. Copy the updated schema.graphql to `packages/typeorm/schema.graphql` (they must stay identical).

4. Run `pnpm --filter=@chillwhales/typeorm build` to regenerate entity classes from schema.

5. Run `pnpm --filter=@chillwhales/indexer build` to verify the indexer still compiles (it will fail on missing `network` assignments — that's expected and will be fixed in T02/T03, but codegen itself must succeed).

## Must-Haves

- [ ] ChainConfig type covers all fields currently hardcoded in constants/index.ts
- [ ] LUKSO_MAINNET config has exact same values as current constants
- [ ] LUKSO_TESTNET config has no gateway (per D017)
- [ ] All 51 entities in schema.graphql have network: String! @index
- [ ] Both schema.graphql files are identical
- [ ] @chillwhales/typeorm codegen succeeds

## Verification

- `pnpm --filter=@chillwhales/typeorm build` exits 0
- `grep -c 'network: String! @index' packages/indexer/schema.graphql` returns 51
- `diff packages/indexer/schema.graphql packages/typeorm/schema.graphql` returns empty
- `test -f packages/indexer/src/config/chainConfig.ts`
  - Estimate: 1h30m
  - Files: packages/indexer/src/config/chainConfig.ts, packages/indexer/schema.graphql, packages/typeorm/schema.graphql
  - Verify: pnpm --filter=@chillwhales/typeorm build && grep -c 'network: String! @index' packages/indexer/schema.graphql | grep -q 51 && diff packages/indexer/schema.graphql packages/typeorm/schema.graphql && test -f packages/indexer/src/config/chainConfig.ts
- [x] **T02: Added supportedChains to EventPlugin/EntityHandler interfaces, declared chains on all 40 plugins/handlers, and created prefixId helper with optional network param on generateTokenId/generateFollowId** — ## Description

Add `supportedChains` to EventPlugin and EntityHandler interfaces. Update all 11 plugins and 29 handlers to declare which chains they support. Create the network-prefixed ID helper. Update all deterministic ID generation to use the network prefix. UUID-based IDs stay as-is (per D015).

## Steps

1. Add `readonly supportedChains: string[]` to `EventPlugin` interface in `packages/indexer/src/core/types/plugins.ts`.

2. Add `readonly supportedChains: string[]` to `EntityHandler` interface in `packages/indexer/src/core/types/handler.ts`.

3. Create `prefixId(network: string, id: string): string` helper in `packages/indexer/src/utils/index.ts` that returns `${network}:${id}`. Also update `generateTokenId` to accept optional `network` param: `generateTokenId({ network, address, tokenId })` → `${network}:${address} - ${tokenId}` when network is provided, or legacy format without. Similarly update `generateFollowId` to accept optional `network`.

4. Update all 11 EventPlugin files in `packages/indexer/src/plugins/events/` to add `supportedChains: ['lukso', 'lukso-testnet']` (all standard LSP events apply to all LUKSO chains). The follow.plugin.ts and unfollow.plugin.ts use LSP26_ADDRESS which is LUKSO-specific — for now still declare both chains since the address will come from ChainConfig in T03.

5. Update all 25 generic EntityHandler files in `packages/indexer/src/handlers/` to add `supportedChains: ['lukso', 'lukso-testnet']`.

6. Update all 4 ChillWhales handlers in `packages/indexer/src/handlers/chillwhales/` to add `supportedChains: ['lukso']` only (per D013).

7. This task does NOT need to make the code compile — the `network` field assignments on entities and the processor factory wiring happen in T03. The interface and declaration changes are purely additive.

## Must-Haves

- [ ] EventPlugin interface has supportedChains field
- [ ] EntityHandler interface has supportedChains field
- [ ] All 11 plugins declare supportedChains
- [ ] All 29 handlers declare supportedChains
- [ ] ChillWhales handlers are lukso-only (D013)
- [ ] prefixId helper exists in utils
- [ ] generateTokenId and generateFollowId accept optional network param

## Verification

- `grep -rl 'supportedChains' packages/indexer/src/plugins/events/ | wc -l` returns 11
- `grep -rl 'supportedChains' packages/indexer/src/handlers/ | wc -l` returns 29
- `grep -c "supportedChains: \['lukso'\]" packages/indexer/src/handlers/chillwhales/*.handler.ts` returns 4
- `grep -q 'prefixId' packages/indexer/src/utils/index.ts`
  - Estimate: 2h
  - Files: packages/indexer/src/core/types/plugins.ts, packages/indexer/src/core/types/handler.ts, packages/indexer/src/utils/index.ts, packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts, packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts, packages/indexer/src/plugins/events/dataChanged.plugin.ts, packages/indexer/src/plugins/events/executed.plugin.ts, packages/indexer/src/plugins/events/follow.plugin.ts, packages/indexer/src/plugins/events/unfollow.plugin.ts, packages/indexer/src/plugins/events/deployedContracts.plugin.ts, packages/indexer/src/plugins/events/deployedProxies.plugin.ts, packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts, packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts, packages/indexer/src/plugins/events/universalReceiver.plugin.ts, packages/indexer/src/handlers/follower.handler.ts, packages/indexer/src/handlers/nft.handler.ts, packages/indexer/src/handlers/lsp4TokenName.handler.ts, packages/indexer/src/handlers/chillwhales/orbLevel.handler.ts
  - Verify: grep -rl 'supportedChains' packages/indexer/src/plugins/events/ | wc -l | grep -q 11 && grep -rl 'supportedChains' packages/indexer/src/handlers/ | wc -l | grep -q 29 && grep -q 'prefixId' packages/indexer/src/utils/index.ts
- [x] **T03: Replaced singleton processor with parameterized factory, threaded network through BatchContext/pipeline, made multicall/verification config-aware, and removed all chain-specific constants from constants/index.ts** — ## Description

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
  - Estimate: 2h30m
  - Files: packages/indexer/src/app/processorFactory.ts, packages/indexer/src/app/index.ts, packages/indexer/src/app/config.ts, packages/indexer/src/app/bootstrap.ts, packages/indexer/src/app/processor.ts, packages/indexer/src/core/types/batchContext.ts, packages/indexer/src/core/batchContext.ts, packages/indexer/src/core/pipeline.ts, packages/indexer/src/core/multicall.ts, packages/indexer/src/core/verification.ts, packages/indexer/src/constants/index.ts, packages/indexer/src/plugins/events/follow.plugin.ts, packages/indexer/src/plugins/events/unfollow.plugin.ts, packages/indexer/src/plugins/events/deployedContracts.plugin.ts, packages/indexer/src/plugins/events/deployedProxies.plugin.ts
  - Verify: pnpm --filter=@chillwhales/indexer build && test ! -f packages/indexer/src/app/processor.ts && test -f packages/indexer/src/app/processorFactory.ts
- [ ] **T04: Set network field on all entity creation sites, fix tests, verify build and zero hardcoded constants** — ## Description

After T03 wires the network through BatchContext and pipeline, every entity creation site across all plugins and handlers must set `network: ctx.network` (or `hctx.batchCtx.network`). Update existing vitest tests to account for the new network field. Run final build and audit.

## Steps

1. Update all 11 EventPlugin `extract()` methods to set `network: ctx.network` on every entity constructor call. In plugins, ctx is the IBatchContext which now has `.network`.

2. Update all 29 EntityHandler `handle()` methods to set `network: hctx.batchCtx.network` on every entity constructor call. This includes both `new Entity({...})` calls and spread patterns like `new Entity({ ...existing, id, network: hctx.batchCtx.network, ... })`.

3. Update all deterministic ID generation calls in handlers to use the network prefix:
   - Handlers using `id: event.address` or `id: address` → `id: prefixId(hctx.batchCtx.network, address)`
   - Handlers using `generateTokenId({ address, tokenId })` → `generateTokenId({ network: hctx.batchCtx.network, address, tokenId })`
   - Handlers using `generateFollowId(...)` → `generateFollowId({ network: hctx.batchCtx.network, ... })`
   - Other composite IDs like `${address} - ${dataKey}` → `${prefixId(network, address)} - ${dataKey}` or use prefixId on the full composite
   - Do NOT prefix UUID-based IDs (per D015) — these are in plugins (uuidv4 calls), not handlers

4. Update `packages/indexer/src/core/verification.ts` where `new UniversalProfile({...})` and `new DigitalAsset({...})` are created — ensure `network` is set. Also update NFT creation in `packages/indexer/src/core/pipeline.ts` if it creates NFT entities.

5. Update all existing vitest test files in `packages/indexer/src/core/__tests__/` and `packages/indexer/src/handlers/__tests__/` to include `network` field in test entity fixtures and assertions.

6. Run `pnpm --filter=@chillwhales/indexer build` — must exit 0.

7. Run `pnpm --filter=@chillwhales/indexer test` — all existing tests must pass.

8. Run audit: `rg 'SQD_GATEWAY|rpc\.lukso|archive\.subsquid.*lukso|MULTICALL_ADDRESS.*=.*0x|LSP26_ADDRESS.*=.*0x|LSP23_ADDRESS.*=.*0x' packages/indexer/src/ -g '*.ts' -g '!__tests__/*'` — must return zero matches (no hardcoded LUKSO constants remain).

## Must-Haves

- [ ] Every `new Entity({...})` call sets network field
- [ ] Every deterministic ID uses network prefix
- [ ] UUID IDs are NOT prefixed (D015)
- [ ] All vitest tests updated and passing
- [ ] `pnpm --filter=@chillwhales/indexer build` exits 0
- [ ] Zero hardcoded LUKSO constants in src/ (audit passes)

## Verification

- `pnpm --filter=@chillwhales/indexer build` exits 0
- `pnpm --filter=@chillwhales/indexer test` exits 0
- `rg 'SQD_GATEWAY|rpc\.lukso|archive\.subsquid.*lukso|MULTICALL_ADDRESS.*=.*0x144|LSP26_ADDRESS.*=.*0xf01|LSP23_ADDRESS.*=.*0x230' packages/indexer/src/ -g '*.ts' -g '!__tests__/*' -g '!config/*'` returns no matches
  - Estimate: 2h
  - Files: packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts, packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts, packages/indexer/src/plugins/events/dataChanged.plugin.ts, packages/indexer/src/plugins/events/executed.plugin.ts, packages/indexer/src/plugins/events/follow.plugin.ts, packages/indexer/src/plugins/events/unfollow.plugin.ts, packages/indexer/src/plugins/events/deployedContracts.plugin.ts, packages/indexer/src/plugins/events/deployedProxies.plugin.ts, packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts, packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts, packages/indexer/src/plugins/events/universalReceiver.plugin.ts, packages/indexer/src/handlers/follower.handler.ts, packages/indexer/src/handlers/nft.handler.ts, packages/indexer/src/handlers/totalSupply.handler.ts, packages/indexer/src/handlers/lsp4TokenName.handler.ts, packages/indexer/src/core/__tests__/batchContext.test.ts, packages/indexer/src/core/__tests__/pipeline.test.ts, packages/indexer/src/core/__tests__/fkResolution.test.ts, packages/indexer/src/core/verification.ts
  - Verify: pnpm --filter=@chillwhales/indexer build && pnpm --filter=@chillwhales/indexer test
