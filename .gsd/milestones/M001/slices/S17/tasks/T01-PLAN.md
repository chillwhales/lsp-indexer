# T01: 13-indexer-v1-cleanup 01

**Slice:** S17 — **Milestone:** M001

## Description

Delete all v1 indexer code, rename v2 to canonical, promote Docker files, and update all configs so the repo has a single indexer with zero "v2" suffixes.

Purpose: Eliminate all v1 remnants and "v2" naming so the repo reads as if v1 never existed. This is the structural cleanup that all subsequent documentation updates depend on.
Output: Single packages/indexer/ with @chillwhales/indexer name, flat docker/ directory, updated root configs and CI.

## Must-Haves

- [ ] 'Only one packages/indexer/ directory exists — no packages/indexer-v2/'
- [ ] 'No docker/v1/ directory exists — only one Docker setup at docker/'
- [ ] '`pnpm start` runs the indexer (no start:v2 script exists)'
- [ ] 'pnpm --filter=@chillwhales/indexer build succeeds'
- [ ] "No 'indexer-v2' string appears in operational config files"

## Files

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
