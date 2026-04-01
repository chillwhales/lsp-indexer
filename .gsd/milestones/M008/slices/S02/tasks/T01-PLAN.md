---
estimated_steps: 17
estimated_files: 5
skills_used: []
---

# T01: Delete old packages, fix stale references, and update lockfile

Remove the now-dead packages/abi/ and packages/typeorm/ directories, fix the one remaining stale import in the integration test file, fix the stale comment in eslint.config.ts, and run pnpm install to update the lockfile.

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

## Inputs

- ``packages/abi/` — directory to delete`
- ``packages/typeorm/` — directory to delete`
- ``packages/indexer/test/integration/pipeline.test.ts` — contains stale @chillwhales/typeorm import on line ~13`
- ``eslint.config.ts` — contains stale @chillwhales/typeorm comment on line ~108`

## Expected Output

- ``packages/indexer/test/integration/pipeline.test.ts` — import changed to @/model`
- ``eslint.config.ts` — comment updated to remove @chillwhales/typeorm reference`
- ``pnpm-lock.yaml` — updated with two fewer workspace packages`

## Verification

test ! -d packages/abi && test ! -d packages/typeorm && pnpm --filter=@chillwhales/indexer build && pnpm build
