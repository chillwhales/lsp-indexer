# S02: Remove old packages and verify parity — Research

**Date:** 2026-04-01
**Depth:** Light research — straightforward deletion and cleanup of known files with clear verification.

## Summary

S01 already moved all codegen machinery, dependencies, and imports into `packages/indexer/`. Both `packages/abi/` and `packages/typeorm/` are now dead code — no indexer source file imports from them. The full `pnpm build` (all workspace packages + docs) already succeeds.

S02 is a clean-up slice: delete the two old package directories, fix a stale comment in `eslint.config.ts`, fix one remaining import in a test file, and confirm the workspace still builds. The `pnpm-workspace.yaml` uses a glob (`packages/*`) so removing directories is sufficient — no yaml edit needed.

## Recommendation

Execute as two tasks: (1) delete old packages + fix remaining references, (2) full verification. Task 1 is the only code-change task. Task 2 is pure verification — root `pnpm build`, grep for stale references, confirm directory deletion.

## Implementation Landscape

### Key Files

- `packages/abi/` — **Delete entirely.** No longer imported by any source file.
- `packages/typeorm/` — **Delete entirely.** No longer imported by any source file.
- `packages/indexer/test/integration/pipeline.test.ts` line 13 — **Fix import:** `import { DigitalAsset, UniversalProfile } from '@chillwhales/typeorm'` → `from '@/model'`
- `eslint.config.ts` line 108 — **Fix comment:** mentions `@chillwhales/typeorm` — update to reference `@chillwhales/indexer` codegen or just say "codegen enums"
- `pnpm-workspace.yaml` — **No change needed.** Uses `packages/*` glob, so deleting dirs is sufficient.
- `package.json` (root) — **No change needed.** Already delegates to `@chillwhales/indexer` (confirmed in S01).
- `docker/Dockerfile` — **No change needed.** Already updated in S01 to reference only `packages/indexer/`.

### Build Order

1. Delete `packages/abi/` and `packages/typeorm/` directories
2. Fix the one stale import in `pipeline.test.ts`
3. Fix the stale comment in `eslint.config.ts`
4. Run `pnpm install` to update the lockfile (two fewer workspace packages)
5. Run `pnpm --filter=@chillwhales/indexer build` to confirm indexer still builds
6. Run `pnpm build` from root to confirm full workspace parity
7. Grep entire repo for any remaining `@chillwhales/abi` or `@chillwhales/typeorm` references

### Verification Approach

1. `ls packages/abi packages/typeorm` → both should not exist
2. `pnpm --filter=@chillwhales/indexer build` → exit 0
3. `pnpm build` → exit 0 (all workspace packages + docs)
4. `rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/` → zero matches
5. `ls packages/` → should show: comparison-tool, indexer, next, node, react, types (6 packages, not 8)

## Constraints

- Must run `pnpm install` after deleting package directories so the lockfile no longer references them — otherwise CI would fail on lockfile mismatch.
- The test file uses path alias `@/*` which maps to `src/*` in the indexer tsconfig, so `@/model` is the correct replacement import path (same pattern used by S01 for all other imports).
