# S01: Merge abi + typeorm into indexer — UAT

**Milestone:** M008
**Written:** 2026-04-01T08:26:07.039Z

## UAT: S01 — Merge abi + typeorm into indexer

### Preconditions
- Fresh clone or clean working tree on the milestone branch
- Node.js and pnpm installed
- `pnpm install` completed

---

### TC-01: Full build succeeds in one step
1. Run `pnpm --filter=@chillwhales/indexer build`
2. **Expected:** Exit code 0. Output shows codegen:abi, codegen:typeorm, and tsc all complete without errors.

### TC-02: ABI codegen produces expected output
1. Run `pnpm --filter=@chillwhales/indexer codegen:abi`
2. Run `ls packages/indexer/src/abi/*.ts | wc -l`
3. **Expected:** 48 files (3 custom + 45 from node_modules contracts)
4. Run `cat packages/indexer/src/abi/index.ts | head -5`
5. **Expected:** Barrel file with `export * as ...` lines, does NOT re-export itself

### TC-03: TypeORM codegen produces expected output
1. Run `pnpm --filter=@chillwhales/indexer codegen:typeorm`
2. Run `ls packages/indexer/src/model/generated/*.ts | wc -l`
3. **Expected:** 80 files
4. Run `ls packages/indexer/src/model/index.ts`
5. **Expected:** File exists (barrel for all entities)

### TC-04: No cross-package imports remain
1. Run `rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/src/ --type ts`
2. **Expected:** Zero matches
3. Run `rg '@chillwhales/abi|@chillwhales/typeorm' packages/indexer/package.json`
4. **Expected:** Zero matches (no workspace:* deps)

### TC-05: Custom ABIs present
1. Run `ls packages/indexer/abi/custom/`
2. **Expected:** CHILL.json, Multicall3.json, ORBS.json (exactly 3 files)

### TC-06: Schema at package root
1. Run `wc -l packages/indexer/schema.graphql`
2. **Expected:** 1179 lines

### TC-07: Dockerfile references only indexer
1. Run `rg 'packages/abi|packages/typeorm|@chillwhales/abi|@chillwhales/typeorm' docker/Dockerfile`
2. **Expected:** Zero matches
3. Run `grep 'schema.graphql' docker/Dockerfile`
4. **Expected:** One COPY line referencing `packages/indexer/schema.graphql`

### TC-08: Entrypoint uses indexer path
1. Run `grep 'packages/indexer' docker/entrypoint.sh`
2. **Expected:** At least one match (cd /app/packages/indexer)
3. Run `grep 'packages/typeorm' docker/entrypoint.sh`
4. **Expected:** Zero matches

### TC-09: Root package.json delegates to indexer
1. Run `grep -E 'hasura:|migration:' package.json`
2. **Expected:** All scripts reference `@chillwhales/indexer`, none reference `@chillwhales/typeorm`

### TC-10: ABI barrel skip-self guard
1. Run `grep 'index' packages/indexer/src/abi/index.ts`
2. **Expected:** No line re-exports `index.ts` itself — the barrel should only export named ABI modules

### Edge Cases
- **EC-01:** Run `pnpm --filter=@chillwhales/indexer codegen` twice consecutively. Second run should succeed (idempotent — overwrites generated files).
- **EC-02:** Delete `packages/indexer/src/abi/` and `packages/indexer/src/model/` directories, then run build. Build should regenerate both from codegen step before tsc.
