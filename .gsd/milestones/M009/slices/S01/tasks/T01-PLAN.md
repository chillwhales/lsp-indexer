---
estimated_steps: 25
estimated_files: 3
skills_used: []
---

# T01: Create chain config registry, add network column to schema.graphql, regenerate models

## Description

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

## Inputs

- ``packages/indexer/src/constants/index.ts` — current hardcoded LUKSO constants to extract into ChainConfig`
- ``packages/indexer/schema.graphql` — current 51 entity definitions to add network column to`
- ``packages/typeorm/schema.graphql` — must stay identical to indexer schema`

## Expected Output

- ``packages/indexer/src/config/chainConfig.ts` — ChainConfig type, LUKSO_MAINNET, LUKSO_TESTNET, CHAIN_CONFIGS registry, getChainConfig()`
- ``packages/indexer/schema.graphql` — all 51 entities with network: String! @index`
- ``packages/typeorm/schema.graphql` — identical copy of updated schema`
- ``packages/typeorm/src/model/generated/*.model.ts` — regenerated entity classes with network column`

## Verification

pnpm --filter=@chillwhales/typeorm build && grep -c 'network: String! @index' packages/indexer/schema.graphql | grep -q 51 && diff packages/indexer/schema.graphql packages/typeorm/schema.graphql && test -f packages/indexer/src/config/chainConfig.ts
