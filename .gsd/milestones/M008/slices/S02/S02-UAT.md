# S02: Remove old packages and verify parity — UAT

**Milestone:** M008
**Written:** 2026-04-01T08:43:39.231Z

# S02: Remove old packages and verify parity — UAT

**Milestone:** M008
**Written:** 2026-04-01

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice is a pure deletion + build verification — no runtime behavior to test.

## Preconditions

- Fresh clone or up-to-date working tree on the milestone branch
- Node.js 22+ and pnpm available
- `pnpm install` has been run

## Smoke Test

Run `pnpm build` from repo root — should exit 0 with all workspace projects building successfully.

## Test Cases

### 1. Deleted directories do not exist

1. Run `ls packages/abi packages/typeorm`
2. **Expected:** Command fails with exit code 2 (No such file or directory)

### 2. Exactly 6 packages remain

1. Run `ls -d packages/*/`
2. **Expected:** Exactly 6 directories listed: comparison-tool, indexer, next, node, react, types

### 3. No stale package references in code

1. Run `rg '@chillwhales/abi|@chillwhales/typeorm' --type ts --type json --type yaml -l | grep -v node_modules | grep -v .gsd/`
2. **Expected:** Zero matches (empty output)

### 4. pipeline.test.ts uses internal import

1. Open `packages/indexer/test/integration/pipeline.test.ts`
2. Find the import for `DigitalAsset` and `UniversalProfile`
3. **Expected:** Import path is `@/model`, NOT `@chillwhales/typeorm`

### 5. eslint.config.ts has no stale reference

1. Run `grep -c '@chillwhales/typeorm' eslint.config.ts`
2. **Expected:** Output is `0`

### 6. Indexer build passes with integrated codegen

1. Run `pnpm --filter=@chillwhales/indexer build`
2. **Expected:** Exit 0 — runs codegen:abi, codegen:typeorm, and tsc successfully

### 7. Full workspace build passes

1. Run `pnpm build`
2. **Expected:** Exit 0 — all 7 workspace projects (types, node, react, next, indexer, comparison-tool, docs) build successfully

## Edge Cases

### Lockfile has no references to deleted packages

1. Run `grep -c '@chillwhales/abi\|@chillwhales/typeorm' pnpm-lock.yaml | head -1`
2. **Expected:** Output is `0` — lockfile contains no workspace references to deleted packages

## Failure Signals

- `pnpm build` fails with "Cannot find module @chillwhales/typeorm" or similar
- `ls packages/abi` or `ls packages/typeorm` succeeds (directories not deleted)
- `rg` finds stale references in .ts/.json/.yaml files

## Not Proven By This UAT

- Runtime indexer behavior (block processing, enrichment pipeline) — that's an operational concern for M008 completion
- Stale references in non-code files (AGENTS.md, CI workflows, docs) — documentation cleanup is deferred

## Notes for Tester

The workspace project count is 7 (6 packages + 1 app) even though there are 6 package directories — `apps/docs` is the 7th workspace project.
