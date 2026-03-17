# T01: 15-ci-cd-workflows-shared-infra 01

**Slice:** S19 — **Milestone:** M001

## Description

Set up changesets infrastructure and expand the existing CI workflow from the current 3-job format/lint/build to a full layered pipeline with install → parallel lint/format/build → parallel typecheck/test/pkg-verify → coverage report. Add minimal smoke tests and vitest coverage config for all 4 publishable packages.

Purpose: This is the foundation for all CI/CD. Without layered CI, the release and preview workflows have nothing to build on. Without changesets config, the release workflow can't manage versions.

Output: Working `.changeset/config.json`, expanded `.github/workflows/ci.yml` with 8+ jobs, vitest workspace config with coverage thresholds, smoke tests for 4 packages, root package.json scripts for CI.

## Must-Haves

- [ ] "PRs trigger a layered CI pipeline matching the LSPs pattern: install → lint/format/build in parallel → typecheck/test/pkg-verify → coverage report"
- [ ] "Changesets config exists with fixed group versioning for all 4 @lsp-indexer packages"
- [ ] "CI runs tests with coverage on publishable packages and posts coverage summary as PR comment"
- [ ] "PRs that modify publishable package code without a changeset fail the changeset-check job"

## Files

- `.changeset/config.json`
- `.github/workflows/ci.yml`
- `package.json`
- `vitest.workspace.ts`
- `packages/types/vitest.config.ts`
- `packages/node/vitest.config.ts`
- `packages/react/vitest.config.ts`
- `packages/next/vitest.config.ts`
- `packages/types/src/__tests__/smoke.test.ts`
- `packages/node/src/__tests__/smoke.test.ts`
- `packages/react/src/__tests__/smoke.test.ts`
- `packages/next/src/__tests__/smoke.test.ts`
