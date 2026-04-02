---
estimated_steps: 27
estimated_files: 19
skills_used: []
---

# T04: Set network field on all entity creation sites, fix tests, verify build and zero hardcoded constants

## Description

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

## Inputs

- ``packages/indexer/src/app/processorFactory.ts` — processor factory from T03`
- ``packages/indexer/src/core/batchContext.ts` — BatchContext with network from T03`
- ``packages/indexer/src/core/pipeline.ts` — network-aware pipeline from T03`
- ``packages/indexer/src/utils/index.ts` — prefixId, generateTokenId, generateFollowId from T02`
- ``packages/indexer/src/plugins/events/*.plugin.ts` — plugins with supportedChains from T02`
- ``packages/indexer/src/handlers/*.handler.ts` — handlers with supportedChains from T02`
- ``packages/indexer/src/core/__tests__/*.test.ts` — existing test files to update`
- ``packages/indexer/src/handlers/__tests__/*.test.ts` — existing handler test files to update`

## Expected Output

- ``packages/indexer/src/plugins/events/*.plugin.ts` — all plugins setting network on entities`
- ``packages/indexer/src/handlers/*.handler.ts` — all handlers setting network and using prefixed IDs`
- ``packages/indexer/src/handlers/chillwhales/*.handler.ts` — ChillWhales handlers with network`
- ``packages/indexer/src/core/__tests__/batchContext.test.ts` — updated tests with network`
- ``packages/indexer/src/core/__tests__/pipeline.test.ts` — updated tests with network`
- ``packages/indexer/src/core/__tests__/fkResolution.test.ts` — updated tests with network`
- ``packages/indexer/src/core/verification.ts` — UP/DA creation with network field`

## Verification

pnpm --filter=@chillwhales/indexer build && pnpm --filter=@chillwhales/indexer test
