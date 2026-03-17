# S17: Indexer V1 Cleanup

**Goal:** Delete all v1 indexer code, rename v2 to canonical, promote Docker files, and update all configs so the repo has a single indexer with zero "v2" suffixes.
**Demo:** Delete all v1 indexer code, rename v2 to canonical, promote Docker files, and update all configs so the repo has a single indexer with zero "v2" suffixes.

## Must-Haves


## Tasks

- [x] **T01: 13-indexer-v1-cleanup 01** `est:6min`
  - Delete all v1 indexer code, rename v2 to canonical, promote Docker files, and update all configs so the repo has a single indexer with zero "v2" suffixes.

Purpose: Eliminate all v1 remnants and "v2" naming so the repo reads as if v1 never existed. This is the structural cleanup that all subsequent documentation updates depend on.
Output: Single packages/indexer/ with @chillwhales/indexer name, flat docker/ directory, updated root configs and CI.
- [x] **T02: 13-indexer-v1-cleanup 02** `est:8min`
  - Clean up the comparison tool to remove v1-v2 mode and sweep all documentation to eliminate v1/v2 references — making the repo read as if v1 never existed.

Purpose: Complete the cleanup by handling secondary code (comparison-tool) and all documentation. Plan 01 handled the structural renames — this plan updates everything that references the old structure.
Output: Version-neutral comparison tool, clean documentation across README and docs/.

## Files Likely Touched

- `packages/indexer/ (DELETE v1)`
- `packages/indexer-v2/ (RENAME to packages/indexer/)`
- `packages/indexer/package.json`
- `docker/v1/ (DELETE)`
- `docker/v2/docker-compose.yml (MOVE to docker/)`
- `docker/v2/Dockerfile (MOVE to docker/)`
- `docker/v2/docker-v2.sh (MOVE+RENAME to docker/manage.sh)`
- `docker/v2/entrypoint.sh (MOVE to docker/)`
- `docker/README.md`
- `package.json`
- `eslint.config.ts`
- `.github/workflows/ci.yml`
- `.env.example`
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
