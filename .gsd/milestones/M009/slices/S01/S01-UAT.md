# S01: Chain-Aware Indexer Core — UAT

**Milestone:** M009
**Written:** 2026-04-02T06:54:14.571Z

## UAT: Chain-Aware Indexer Core

### Test 1: Build
1. `pnpm --filter=@chillwhales/indexer build` → exit 0

### Test 2: Tests
1. `pnpm --filter=@chillwhales/indexer test` → 306 pass, 0 fail

### Test 3: Schema
1. `grep -c 'network: String! @index' packages/indexer/schema.graphql` → 71
2. `diff packages/indexer/schema.graphql packages/typeorm/schema.graphql` → empty

### Test 4: ChainConfig
1. `test -f packages/indexer/src/config/chainConfig.ts` → exists
2. Exports LUKSO_MAINNET (with gateway), LUKSO_TESTNET (no gateway per D017)

### Test 5: Processor Factory
1. `test -f packages/indexer/src/app/processorFactory.ts` → exists
2. `test ! -f packages/indexer/src/app/processor.ts` → deleted

### Test 6: No Hardcoded Constants
1. `rg 'SQD_GATEWAY|MULTICALL_ADDRESS.*=.*0x144' packages/indexer/src/ -g '*.ts' -g '!__tests__/*' -g '!config/*'` → no matches

### Test 7: SupportedChains
1. `grep -rl 'supportedChains' packages/indexer/src/plugins/events/ | wc -l` → 11
2. `grep -rl 'supportedChains' packages/indexer/src/handlers/ | wc -l` → 29
