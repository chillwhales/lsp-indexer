---
estimated_steps: 28
estimated_files: 7
skills_used: []
---

# T01: Move codegen assets, dependencies, and scripts into indexer package

Move all codegen machinery from `@chillwhales/abi` and `@chillwhales/typeorm` into `@chillwhales/indexer`. This is the highest-risk task — if codegen runs successfully in the new location, the rest of the slice is mechanical.

## Steps

1. Copy `packages/abi/custom/` → `packages/indexer/abi/custom/` (3 JSON files: CHILL.json, Multicall3.json, ORBS.json)
2. Create `packages/indexer/scripts/abi-codegen.sh` adapted from `packages/abi/scripts/codegen.sh`:
   - Change output dir from `src/abi` to `src/abi` (same — relative to indexer root)
   - Change input globs to read custom ABIs from `abi/custom/*.json` instead of `custom/*.json`
   - **Critical:** Change the barrel generation loop to write to `src/abi/index.ts` instead of `src/index.ts` — the original script writes `src/index.ts` which would overwrite the indexer's app entry point
   - Change export paths from `./abi/$fileName` to `./$fileName` since the barrel is now inside `src/abi/`
3. Copy `packages/typeorm/schema.graphql` → `packages/indexer/schema.graphql` (must be at package root for `squid-typeorm-codegen`)
4. **Delete** `packages/indexer/src/model.ts` — this file (`export * from '@chillwhales/typeorm'`) conflicts with the `src/model/` directory that `squid-typeorm-codegen` creates. The codegen will generate `src/model/index.ts` as the new barrel.
5. Update `packages/indexer/package.json`:
   - Add dependencies from abi package (skip those already present): `@erc725/smart-contracts`, `@lukso/lsp14-contracts`, `@lukso/lsp23-contracts`, `@lukso/lsp26-contracts`, `@subsquid/evm-abi`, `@subsquid/evm-codec`
   - Add dependencies from typeorm package: `@subsquid/hasura-configuration`, `@subsquid/typeorm-migration`
   - Add devDependencies: `@subsquid/evm-typegen`, `@subsquid/typeorm-codegen`
   - Add scripts: `codegen:abi`, `codegen:typeorm`, `codegen`, `hasura:generate`, `hasura:apply`, `migration:generate`, `migration:apply`
   - Update `build` script from `tsc` to `pnpm codegen && tsc`
   - Keep workspace deps (`@chillwhales/abi`, `@chillwhales/typeorm`) for now — they're removed in T02 after imports are rewritten
6. Run `pnpm install` to resolve new dependencies
7. Run `pnpm --filter=@chillwhales/indexer codegen` to verify both codegen steps produce output
8. Verify `src/abi/index.ts` exists as barrel and `src/model/index.ts` exists as barrel

## Must-Haves

- [ ] `packages/indexer/abi/custom/` contains 3 JSON files
- [ ] `packages/indexer/scripts/abi-codegen.sh` writes barrel to `src/abi/index.ts` (NOT `src/index.ts`)
- [ ] `packages/indexer/schema.graphql` exists at package root (1179 lines)
- [ ] `packages/indexer/src/model.ts` is deleted (replaced by `src/model/index.ts` from codegen)
- [ ] `pnpm --filter=@chillwhales/indexer codegen` exits 0
- [ ] `ls packages/indexer/src/abi/*.ts | wc -l` shows 40+ files
- [ ] `ls packages/indexer/src/model/generated/*.ts | wc -l` shows 70+ files

## Inputs

- `packages/abi/scripts/codegen.sh`
- `packages/abi/custom/CHILL.json`
- `packages/abi/custom/Multicall3.json`
- `packages/abi/custom/ORBS.json`
- `packages/abi/package.json`
- `packages/typeorm/schema.graphql`
- `packages/typeorm/package.json`
- `packages/indexer/package.json`
- `packages/indexer/src/model.ts`

## Expected Output

- `packages/indexer/abi/custom/CHILL.json`
- `packages/indexer/abi/custom/Multicall3.json`
- `packages/indexer/abi/custom/ORBS.json`
- `packages/indexer/scripts/abi-codegen.sh`
- `packages/indexer/schema.graphql`
- `packages/indexer/package.json`
- `packages/indexer/src/abi/index.ts`
- `packages/indexer/src/model/index.ts`

## Verification

pnpm --filter=@chillwhales/indexer codegen && ls packages/indexer/src/abi/index.ts && ls packages/indexer/src/model/index.ts && test $(ls packages/indexer/src/abi/*.ts | wc -l) -gt 40 && test $(ls packages/indexer/src/model/generated/*.ts | wc -l) -gt 70
