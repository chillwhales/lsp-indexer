# S01: Merge abi + typeorm into indexer

**Goal:** ABI codegen, entity codegen, and TypeScript compilation all run inside `packages/indexer/` as a single `pnpm --filter=@chillwhales/indexer build` — no imports from `@chillwhales/abi` or `@chillwhales/typeorm` remain.
**Demo:** After this: pnpm --filter=@chillwhales/indexer build runs ABI codegen, entity codegen, and TypeScript compilation in one step — all imports resolve internally

## Tasks
- [x] **T01: Move ABI codegen, TypeORM entity codegen, and all dependencies into packages/indexer — both codegen steps produce 48 ABI and 80 entity files** — Move all codegen machinery from `@chillwhales/abi` and `@chillwhales/typeorm` into `@chillwhales/indexer`. This is the highest-risk task — if codegen runs successfully in the new location, the rest of the slice is mechanical.

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
  - Estimate: 45m
  - Files: packages/indexer/package.json, packages/indexer/scripts/abi-codegen.sh, packages/indexer/schema.graphql, packages/indexer/abi/custom/CHILL.json, packages/indexer/abi/custom/Multicall3.json, packages/indexer/abi/custom/ORBS.json, packages/indexer/src/model.ts
  - Verify: pnpm --filter=@chillwhales/indexer codegen && ls packages/indexer/src/abi/index.ts && ls packages/indexer/src/model/index.ts && test $(ls packages/indexer/src/abi/*.ts | wc -l) -gt 40 && test $(ls packages/indexer/src/model/generated/*.ts | wc -l) -gt 70
- [ ] **T02: Rewrite all imports and remove workspace dependencies** — Replace every `@chillwhales/abi` and `@chillwhales/typeorm` import in the indexer with local path aliases, remove the workspace dependencies, and verify the full build passes.

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
  - Estimate: 30m
  - Files: packages/indexer/package.json, packages/indexer/src/model.ts, packages/indexer/src/plugins/events/lsp7Transfer.plugin.ts, packages/indexer/src/plugins/events/lsp8Transfer.plugin.ts, packages/indexer/src/plugins/events/dataChanged.plugin.ts, packages/indexer/src/handlers/decimals.handler.ts, packages/indexer/src/handlers/chillwhales/orbsClaimed.handler.ts, packages/indexer/src/handlers/chillwhales/chillClaimed.handler.ts
  - Verify: pnpm --filter=@chillwhales/indexer build && test $(rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/src/ --type ts | wc -l) -eq 0 && ! rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/package.json -q
- [ ] **T03: Update Docker, entrypoint, and root package.json references** — Update all infrastructure files that reference the old `packages/abi/` and `packages/typeorm/` paths to point at `packages/indexer/` instead.

## Steps

1. Update `docker/Dockerfile`:
   - **deps stage:** Remove `COPY packages/abi/package.json` and `COPY packages/typeorm/package.json` lines. Keep only `COPY packages/indexer/package.json`.
   - **builder stage:** Remove `COPY --from=deps .../packages/abi/node_modules` and `packages/typeorm/node_modules` lines. Remove `COPY packages/abi` and `COPY packages/typeorm` source copy lines. Remove `pnpm --filter=@chillwhales/abi build` and `pnpm --filter=@chillwhales/typeorm build` from the RUN chain — only `pnpm --filter=@chillwhales/indexer build` remains.
   - **runner stage:** Remove all `packages/abi/` and `packages/typeorm/` COPY and package.json lines. Add `COPY --from=builder /app/packages/indexer/schema.graphql ./packages/indexer/` (needed for migrations at runtime). Remove the `packages/typeorm/schema.graphql` COPY line.
2. Update `docker/entrypoint.sh`:
   - Change `cd /app/packages/typeorm` to `cd /app/packages/indexer`
3. Update root `package.json`:
   - Change `hasura:generate` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `hasura:apply` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `migration:generate` from `@chillwhales/typeorm` to `@chillwhales/indexer`
   - Change `migration:apply` from `@chillwhales/typeorm` to `@chillwhales/indexer`
4. Verify `pnpm --filter=@chillwhales/indexer build` still passes
5. Verify no remaining references to `@chillwhales/typeorm` in `docker/` or root `package.json`

## Must-Haves

- [ ] Dockerfile references only `packages/indexer/` (no abi or typeorm)
- [ ] Entrypoint runs migrations/Hasura from `packages/indexer/`
- [ ] Root package.json delegates migration/Hasura scripts to `@chillwhales/indexer`
- [ ] `pnpm --filter=@chillwhales/indexer build` still exits 0
  - Estimate: 20m
  - Files: docker/Dockerfile, docker/entrypoint.sh, package.json
  - Verify: pnpm --filter=@chillwhales/indexer build && ! rg '@chillwhales/typeorm|packages/typeorm|@chillwhales/abi|packages/abi' docker/ package.json --type-not yaml -q
