---
estimated_steps: 17
estimated_files: 8
skills_used: []
---

# T02: Rewrite all imports and remove workspace dependencies

Replace every `@chillwhales/abi` and `@chillwhales/typeorm` import in the indexer with local path aliases, remove the workspace dependencies, and verify the full build passes.

## Steps

1. Replace all `from '@chillwhales/typeorm'` → `from '@/model'` across ~58 files. The `@/*` path alias maps to `src/*`, so `@/model` resolves to `src/model/index.ts` (generated barrel).
2. Replace all `from '@chillwhales/abi'` → `from '@/abi'` across ~11 files. The codegen barrel at `src/abi/index.ts` re-exports all ABI namespaces.
3. Replace 3 deep imports `from '@chillwhales/abi/lib/abi/Multicall3'` → `from '@/abi/Multicall3'` in:
   - `packages/indexer/src/handlers/decimals.handler.ts`
   - `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
   - `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`
4. Remove `"@chillwhales/abi": "workspace:*"` and `"@chillwhales/typeorm": "workspace:*"` from `packages/indexer/package.json` dependencies
5. Run `pnpm install` to update the lockfile
6. Run `pnpm --filter=@chillwhales/indexer build` to verify full compilation (codegen + tsc)
7. Run `rg "@chillwhales/abi|@chillwhales/typeorm" packages/indexer/src/ --type ts` to confirm zero remaining imports

## Must-Haves

- [ ] Zero `@chillwhales/abi` imports in `packages/indexer/src/`
- [ ] Zero `@chillwhales/typeorm` imports in `packages/indexer/src/`
- [ ] Workspace deps removed from `packages/indexer/package.json`
- [ ] `pnpm --filter=@chillwhales/indexer build` exits 0

## Inputs

- `packages/indexer/package.json`
- `packages/indexer/src/abi/index.ts`
- `packages/indexer/src/model/index.ts`

## Expected Output

- `packages/indexer/package.json`
- `packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts`
- `packages/indexer/src/plugins/events/dataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/executed.plugin.ts`
- `packages/indexer/src/plugins/events/ownershipTransferred.plugin.ts`
- `packages/indexer/src/plugins/events/follow.plugin.ts`
- `packages/indexer/src/plugins/events/unfollow.plugin.ts`
- `packages/indexer/src/plugins/events/deployedContracts.plugin.ts`
- `packages/indexer/src/plugins/events/deployedProxies.plugin.ts`
- `packages/indexer/src/plugins/events/tokenIdDataChanged.plugin.ts`
- `packages/indexer/src/plugins/events/universalReceiver.plugin.ts`
- `packages/indexer/src/handlers/decimals.handler.ts`
- `packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts`
- `packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts`

## Verification

pnpm --filter=@chillwhales/indexer build && test $(rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/src/ --type ts | wc -l) -eq 0 && ! rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/package.json -q
