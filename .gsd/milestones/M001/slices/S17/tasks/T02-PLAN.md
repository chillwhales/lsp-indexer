# T02: 13-indexer-v1-cleanup 02

**Slice:** S17 — **Milestone:** M001

## Description

Clean up the comparison tool to remove v1-v2 mode and sweep all documentation to eliminate v1/v2 references — making the repo read as if v1 never existed.

Purpose: Complete the cleanup by handling secondary code (comparison-tool) and all documentation. Plan 01 handled the structural renames — this plan updates everything that references the old structure.
Output: Version-neutral comparison tool, clean documentation across README and docs/.

## Must-Haves

- [ ] 'comparison-tool has no v1/v2 mode distinction — just source vs target'
- [ ] 'comparison-tool CLI accepts --source/--target (not --v1/--v2)'
- [ ] 'Root README describes single-indexer reality'
- [ ] "Zero operational docs reference 'indexer-v2' or 'v1-v2' (excluding .planning/)"

## Files

- `packages/comparison-tool/package.json`
- `packages/comparison-tool/src/types.ts`
- `packages/comparison-tool/src/cli.ts`
- `packages/comparison-tool/src/comparisonEngine.ts`
- `packages/comparison-tool/src/entityRegistry.ts`
- `packages/comparison-tool/src/reporter.ts`
- `README.md`
- `docs/AGENTS.md`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRIBUTING.md`
- `docs/docker/README.md`
- `docs/docker/QUICKSTART.md`
- `docs/docker/REFERENCE.md`
- `PR_CLEANUP_PLAN.md (DELETE)`
- `IMPROVEMENTS_ROADMAP.md (DELETE)`
