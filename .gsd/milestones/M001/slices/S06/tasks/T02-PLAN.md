# T02: 05-deployment-validation 02

**Slice:** S06 — **Milestone:** M001

## Description

Build the comparison engine, colored terminal reporter, and CLI entry point that ties everything together. The user will be able to run `pnpm --filter=@chillwhales/indexer-v2 compare --v1=URL --v2=URL` and get a full parity report with pass/fail verdict.

Purpose: This is the core deliverable of Phase 5 — the production cutover gate. It proves V2 produces identical data to V1.
Output: Comparison engine, reporter, CLI entry point, and a `compare` script in package.json.

## Must-Haves

- [ ] 'User can run a single CLI command with two Hasura URLs and get a comparison report'
- [ ] 'Report shows per-entity-type row counts (V1 count vs V2 count)'
- [ ] 'Report shows sampled content diffs with field-level detail'
- [ ] 'Known divergences are displayed separately with reasons'
- [ ] 'Final PASS/FAIL verdict printed with exit code 0 or 1'
- [ ] 'Unexpected field differences are clearly flagged as failures'

## Files

- `packages/indexer-v2/src/comparison/comparisonEngine.ts`
- `packages/indexer-v2/src/comparison/reporter.ts`
- `packages/indexer-v2/src/comparison/cli.ts`
- `packages/indexer-v2/src/comparison/index.ts`
- `packages/indexer-v2/package.json`
