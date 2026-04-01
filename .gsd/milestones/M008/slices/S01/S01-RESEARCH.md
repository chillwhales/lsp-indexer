# S01: Merge abi + typeorm into indexer — Research

**Date:** 2026-04-01
**Depth:** Targeted

## Summary

Both `@chillwhales/abi` and `@chillwhales/typeorm` are pure codegen packages consumed exclusively by `@chillwhales/indexer`. The merge is mechanical: move source files, codegen scripts, and dependencies into the indexer package, rewrite ~74 import statements across ~60 files, update the build script to run both codegen steps before `tsc`, and update Docker/entrypoint files.

The two codegen tools (`squid-evm-typegen` and `squid-typeorm-codegen`) are cwd-sensitive. `squid-typeorm-codegen` calls `resolveGraphqlSchema()` which looks for `schema.graphql` in process.cwd(). `squid-evm-typegen` takes an explicit output dir and input globs. Both will work correctly when run from `packages/indexer/` with the right paths.

The riskiest part is the Docker entrypoint — it currently `cd`s into `packages/typeorm` for migrations and Hasura config. Those scripts and their dependencies must move to the indexer package.

## Recommendation

Execute as three tasks: (1) move files + deps + codegen scripts into indexer, verify `pnpm --filter=@chillwhales/indexer build` works, (2) rewrite all imports from `@chillwhales/abi` and `@chillwhales/typeorm` to local paths, (3) update Docker, entrypoint, and root package.json references. Task 1 is the riskiest — if codegen works in the new location, the rest is mechanical find-and-replace.

## Implementation Landscape

### Key Files

#### ABI package (source — to be absorbed)
- `packages/abi/scripts/codegen.sh` — runs `squid-evm-typegen src/abi custom/*.json node_modules/@erc725/...` and generates barrel `src/index.ts`. Must be adapted for new paths.
- `packages/abi/custom/` — 3 custom ABI JSON files (CHILL.json, Multicall3.json, ORBS.json). Move to `packages/indexer/abi/custom/`.
- `packages/abi/package.json` — dependencies to absorb: `@erc725/smart-contracts`, `@lukso/lsp0-contracts` (already in indexer), `@lukso/lsp14-contracts`, `@lukso/lsp23-contracts`, `@lukso/lsp26-contracts`, `@lukso/lsp6-contracts` (already in indexer), `@lukso/lsp7-contracts` (already), `@lukso/lsp8-contracts` (already), `@subsquid/evm-abi`, `@subsquid/evm-codec`. DevDep: `@subsquid/evm-typegen`.

#### TypeORM package (source — to be absorbed)
- `packages/typeorm/schema.graphql` — 1179 lines, 51 entity types. Move to `packages/indexer/schema.graphql` (must be at package root for `squid-typeorm-codegen`).
- `packages/typeorm/package.json` — dependencies to absorb: `@subsquid/hasura-configuration`, `@subsquid/typeorm-migration` (migrations + Hasura). DevDep: `@subsquid/typeorm-codegen`. Scripts to absorb: `codegen`, `hasura:generate`, `hasura:apply`, `migration:generate`, `migration:apply`.

#### Indexer package (target)
- `packages/indexer/package.json` — currently depends on `"@chillwhales/abi": "workspace:*"` and `"@chillwhales/typeorm": "workspace:*"`. These workspace deps get removed; their transitive deps get added directly.
- `packages/indexer/tsconfig.json` — no changes needed (rootDir: `src`, paths: `@/*` → `src/*`).
- `packages/indexer/src/model.ts` — currently `export * from '@chillwhales/typeorm'`. Will become `export * from './model/index'` (pointing at codegen output).

#### Import rewrite targets
- **14 files** import from `@chillwhales/abi` (10 unique named imports + 3 deep imports from `@chillwhales/abi/lib/abi/Multicall3`)
- **60 files** import from `@chillwhales/typeorm` (entity classes and enums)
- **1 file** (`eslint.config.ts`) mentions `@chillwhales/typeorm` in a comment

#### Docker / infrastructure
- `docker/Dockerfile` — references `packages/abi/` and `packages/typeorm/` in COPY commands, deps stage, and build stage. Must be simplified to only `packages/indexer/`.
- `docker/entrypoint.sh` — `cd /app/packages/typeorm` for `migration:generate`, `migration:apply`, `hasura:generate`, `hasura:apply`. Must change to `cd /app/packages/indexer`.
- Root `package.json` — 4 scripts delegate to `@chillwhales/typeorm` (`hasura:generate`, `hasura:apply`, `migration:generate`, `migration:apply`). Must change filter to `@chillwhales/indexer`.

### Build Order

**Task 1: Move codegen into indexer (risk: high)**
1. Copy `packages/abi/custom/` → `packages/indexer/abi/custom/`
2. Create `packages/indexer/scripts/abi-codegen.sh` adapted from `packages/abi/scripts/codegen.sh` — output to `src/abi/`, read custom ABIs from `abi/custom/`, resolve contract ABIs from `node_modules/` 
3. Copy `packages/typeorm/schema.graphql` → `packages/indexer/schema.graphql`
4. Absorb dependencies from both packages into `packages/indexer/package.json`:
   - From abi: `@erc725/smart-contracts`, `@lukso/lsp14-contracts`, `@lukso/lsp23-contracts`, `@lukso/lsp26-contracts`, `@subsquid/evm-abi`, `@subsquid/evm-codec`
   - From abi devDeps: `@subsquid/evm-typegen`
   - From typeorm: `@subsquid/hasura-configuration`, `@subsquid/typeorm-migration`
   - From typeorm devDeps: `@subsquid/typeorm-codegen`
   - Skip deps already present in indexer (check versions match)
5. Add scripts to `packages/indexer/package.json`:
   - `"codegen:abi": "sh scripts/abi-codegen.sh"`
   - `"codegen:typeorm": "squid-typeorm-codegen"`
   - `"codegen": "pnpm codegen:abi && pnpm codegen:typeorm"`
   - `"hasura:generate": "squid-hasura-configuration regenerate --force"`
   - `"hasura:apply": "squid-hasura-configuration apply"`
   - `"migration:generate": "squid-typeorm-migration generate"`
   - `"migration:apply": "squid-typeorm-migration apply"`
   - Update `"build"` to `"pnpm codegen && tsc"`
6. Run `pnpm install` to resolve new deps
7. Run `pnpm --filter=@chillwhales/indexer codegen` to verify both codegen steps produce output
8. Verify `src/abi/` and `src/model/generated/` exist with expected files

**Task 2: Rewrite imports (risk: low)**
1. Update `packages/indexer/src/model.ts` from `export * from '@chillwhales/typeorm'` to `export * from './model/index'`
2. Replace all `from '@chillwhales/typeorm'` → `from '@/model'` (60 files). The `@/*` path alias maps to `src/*`, so `@/model` resolves to `src/model.ts` → `src/model/index.ts` → `src/model/generated/`.
3. Replace all `from '@chillwhales/abi'` → `from '@/abi'` (11 files). The codegen barrel at `src/abi/index.ts` (auto-generated) re-exports all ABI namespaces. Need to verify `src/index.ts` gets generated as barrel or create `src/abi/index.ts` manually.
4. Replace 3 deep imports `from '@chillwhales/abi/lib/abi/Multicall3'` → `from '@/abi/Multicall3'`
5. Remove `@chillwhales/abi` and `@chillwhales/typeorm` from indexer's dependencies
6. Run `pnpm --filter=@chillwhales/indexer build` to verify compilation

**Task 3: Update Docker, root scripts, and cleanup references (risk: low)**
1. Update `docker/Dockerfile` — remove abi/typeorm COPY lines, simplify build to single `pnpm --filter=@chillwhales/indexer build`
2. Update `docker/entrypoint.sh` — change `cd /app/packages/typeorm` to `cd /app/packages/indexer`
3. Update root `package.json` — change 4 scripts from `@chillwhales/typeorm` filter to `@chillwhales/indexer`
4. Update `eslint.config.ts` comment if relevant
5. Verify `pnpm --filter=@chillwhales/indexer build` still passes

### Verification Approach

1. **Codegen check:** After Task 1, verify `ls packages/indexer/src/abi/*.ts` produces ~25+ generated files and `ls packages/indexer/src/model/generated/*.ts` produces ~80 generated files
2. **Build check:** `pnpm --filter=@chillwhales/indexer build` exits 0 — this runs codegen + tsc and catches all import resolution failures
3. **Import check:** `rg '@chillwhales/abi|@chillwhales/typeorm' --type ts` returns zero matches (excluding any comments in eslint config)
4. **Test check:** `pnpm --filter=@chillwhales/indexer test` passes (existing tests import entity types)

## Constraints

- `squid-typeorm-codegen` expects `schema.graphql` at the package root (cwd). It cannot be configured to look elsewhere. The schema file MUST be at `packages/indexer/schema.graphql`.
- `squid-typeorm-codegen` outputs to `src/model/generated/` relative to cwd and creates `src/model/index.ts` if it doesn't exist. This matches the existing indexer structure since `packages/indexer/src/model.ts` re-exports from the model directory.
- The ABI codegen script resolves contract ABIs from `node_modules/`. Since those deps move to the indexer package, hoisting behavior may change — the script should reference them without assuming a specific `node_modules` location (pnpm hoists to root by default).
- `packages/indexer/src/model.ts` already exists as a barrel (`export * from '@chillwhales/typeorm'`). The typeorm codegen will create `src/model/index.ts` inside a `model/` directory. These must not conflict — `src/model.ts` should be removed and imports should go through `src/model/index.ts` (generated).

## Common Pitfalls

- **model.ts vs model/ directory conflict** — The indexer currently has `src/model.ts` (a file) that re-exports typeorm. The typeorm codegen creates `src/model/` (a directory) with `index.ts` inside it. These cannot coexist. Delete `src/model.ts` before running codegen, then update all `from '@/model'` imports to work with the directory.
- **ABI barrel index.ts placement** — The abi codegen script writes `src/index.ts` as the barrel. In the indexer context, that would overwrite the app entry point. The script must be modified to write the barrel to `src/abi/index.ts` instead of `src/index.ts`.
- **Workspace dep removal before install** — Remove `"@chillwhales/abi": "workspace:*"` and `"@chillwhales/typeorm": "workspace:*"` from indexer's dependencies AFTER adding the absorbed deps, then run `pnpm install`. If removed first, the install will fail because codegen devDeps reference subsquid packages.
- **Entrypoint working directory** — `docker/entrypoint.sh` runs `pnpm migration:generate`, `pnpm migration:apply`, `pnpm hasura:generate`, and `pnpm hasura:apply` from `packages/typeorm/`. After the merge, these scripts live in `packages/indexer/` — the `cd` must change or Docker builds will fail silently (empty migrations).

## Open Risks

- The ABI codegen script uses glob patterns like `node_modules/@lukso/lsp0-contracts/artifacts/*.json`. Under pnpm strict mode, these contract packages might not be in the indexer's own `node_modules/` but hoisted to the root. The script may need to handle both locations, or we rely on pnpm's default hoisting. Test this after `pnpm install`.
