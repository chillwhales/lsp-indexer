# S02: Remove old packages and verify parity

**Goal:** Delete packages/abi/ and packages/typeorm/, fix all remaining stale references, and confirm the full workspace builds identically.
**Demo:** After this: packages/abi/ and packages/typeorm/ deleted, pnpm build succeeds from root, indexer starts and processes blocks identically

## Tasks
- [x] **T01: Deleted packages/abi/ and packages/typeorm/, fixed stale @chillwhales/typeorm import and comment, full workspace build passes** — Remove the now-dead packages/abi/ and packages/typeorm/ directories, fix the one remaining stale import in the integration test file, fix the stale comment in eslint.config.ts, and run pnpm install to update the lockfile.

## Steps

1. Delete `packages/abi/` directory: `rm -rf packages/abi/`
2. Delete `packages/typeorm/` directory: `rm -rf packages/typeorm/`
3. Fix the stale import in `packages/indexer/test/integration/pipeline.test.ts` line ~13: change `import { DigitalAsset, UniversalProfile } from '@chillwhales/typeorm'` to `import { DigitalAsset, UniversalProfile } from '@/model'`
4. Fix the stale comment in `eslint.config.ts` line ~108: change `Codegen enums from @chillwhales/typeorm resolve as error types in CI` to `Codegen enums from indexer codegen resolve as error types in CI` (or similar wording that removes the @chillwhales/typeorm reference)
5. Run `pnpm install` to update the lockfile (two fewer workspace packages)
6. Run `pnpm --filter=@chillwhales/indexer build` to confirm indexer builds
7. Run `pnpm build` from root to confirm full workspace builds

## Must-Haves

- [ ] packages/abi/ deleted
- [ ] packages/typeorm/ deleted
- [ ] pipeline.test.ts import uses @/model not @chillwhales/typeorm
- [ ] eslint.config.ts has no @chillwhales/typeorm reference
- [ ] pnpm-lock.yaml updated (no references to deleted packages)
- [ ] pnpm --filter=@chillwhales/indexer build exits 0
- [ ] pnpm build exits 0
  - Estimate: 15m
  - Files: packages/abi/, packages/typeorm/, packages/indexer/test/integration/pipeline.test.ts, eslint.config.ts, pnpm-lock.yaml
  - Verify: test ! -d packages/abi && test ! -d packages/typeorm && pnpm --filter=@chillwhales/indexer build && pnpm build
- [x] **T02: Confirmed 6-package workspace with zero stale @chillwhales/abi or @chillwhales/typeorm references and full build passing** — Run comprehensive verification to confirm the workspace is clean: no stale references remain anywhere, the correct 6 packages exist, and builds pass.

## Steps

1. Confirm deleted: `ls packages/abi packages/typeorm` should fail (not exist)
2. Confirm package count: `ls packages/` should show exactly 6 directories: comparison-tool, indexer, next, node, react, types
3. Grep entire repo for stale refs: `rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/` must return zero matches
4. Confirm indexer build: `pnpm --filter=@chillwhales/indexer build` exits 0
5. Confirm full workspace build: `pnpm build` exits 0

## Must-Haves

- [ ] packages/abi/ does not exist
- [ ] packages/typeorm/ does not exist
- [ ] Zero grep matches for stale package references
- [ ] 6 packages in packages/ directory
- [ ] Full workspace build passes
  - Estimate: 10m
  - Files: packages/
  - Verify: rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/ | wc -l | grep -q '^0$' && test $(ls -d packages/*/ | wc -l) -eq 6
