# S19: Ci Cd Workflows Shared Infra

**Goal:** Set up changesets infrastructure and expand the existing CI workflow from the current 3-job format/lint/build to a full layered pipeline with install → parallel lint/format/build → parallel typecheck/test/pkg-verify → coverage report.
**Demo:** Set up changesets infrastructure and expand the existing CI workflow from the current 3-job format/lint/build to a full layered pipeline with install → parallel lint/format/build → parallel typecheck/test/pkg-verify → coverage report.

## Must-Haves


## Tasks

- [x] **T01: 15-ci-cd-workflows-shared-infra 01**
  - Set up changesets infrastructure and expand the existing CI workflow from the current 3-job format/lint/build to a full layered pipeline with install → parallel lint/format/build → parallel typecheck/test/pkg-verify → coverage report. Add minimal smoke tests and vitest coverage config for all 4 publishable packages.

Purpose: This is the foundation for all CI/CD. Without layered CI, the release and preview workflows have nothing to build on. Without changesets config, the release workflow can't manage versions.

Output: Working `.changeset/config.json`, expanded `.github/workflows/ci.yml` with 8+ jobs, vitest workspace config with coverage thresholds, smoke tests for 4 packages, root package.json scripts for CI.
- [x] **T02: 15-ci-cd-workflows-shared-infra 02**
  - Create the release workflow (changesets-based npm publish + Docker image to GHCR) and preview release workflow (pkg-pr-new for PR-based pre-release packages). These are the two remaining workflow files needed to match the `chillwhales/LSPs` CI/CD pattern.

Purpose: Enables fully automated releases on merge to main (npm publish + Docker image + GitHub Releases) and installable preview packages from any PR.

Output: `.github/workflows/release.yml` and `.github/workflows/preview.yml` — both following the LSPs reference patterns with lsp-indexer-specific adaptations.
- [x] **T03: 15-ci-cd-workflows-shared-infra 03**
  - Create the `chillwhales/.github` org repo with working reusable workflows and composite actions, then refactor lsp-indexer's CI workflow to consume them — proving the shared infra pattern works end-to-end.

Purpose: CICD-04 in ROADMAP scoped as "investigation + decision documented". User expanded scope in CONTEXT.md to "full implementation — create `chillwhales/.github` repo with working reusable workflows, lsp-indexer consuming them by end of phase". This plan follows CONTEXT.md (locked decisions override ROADMAP placeholders). The scope expansion adds risk — external repo creation requires org admin permissions. A prerequisite checkpoint verifies access before proceeding.

Output: `chillwhales/.github` repo created with reusable workflows + composite actions, lsp-indexer CI refactored to consume them, architecture decision document.

## Files Likely Touched

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
- `.github/workflows/release.yml`
- `.github/workflows/preview.yml`
- `.planning/phases/15-ci-cd-workflows-shared-infra/SHARED-INFRA-DECISION.md`
- `.github/workflows/ci.yml`
