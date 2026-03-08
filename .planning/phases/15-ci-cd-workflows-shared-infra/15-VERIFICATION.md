---
phase: 15-ci-cd-workflows-shared-infra
verified: 2026-03-08T12:07:51Z
status: passed
score: 5/5 success criteria verified
must_haves:
  truths:
    - "PRs trigger multi-layer CI pipeline matching LSPs pattern"
    - "Merging to main triggers changesets-based release flow"
    - "Documented decision on shared workflows"
    - "At least one reusable workflow extracted and consumed"
    - "pnpm test:coverage runs in CI with coverage reports as PR comments"
  artifacts:
    - path: ".changeset/config.json"
      provides: "Changesets configuration with fixed group versioning"
    - path: ".github/workflows/ci.yml"
      provides: "Layered CI pipeline consuming shared workflows"
    - path: ".github/workflows/release.yml"
      provides: "Changesets release automation with Docker image publishing"
    - path: ".github/workflows/preview.yml"
      provides: "PR-based preview releases via pkg-pr-new"
    - path: "vitest.config.ts"
      provides: "Vitest workspace configuration for coverage"
    - path: "SHARED-INFRA-DECISION.md"
      provides: "Architecture decision record for shared workflow infrastructure"
  key_links:
    - from: ".github/workflows/ci.yml"
      to: "chillwhales/.github"
      via: "uses: chillwhales/.github/.github/workflows/*@main"
    - from: ".github/workflows/release.yml"
      to: ".changeset/config.json"
      via: "changesets/action@v1 reads config"
    - from: ".github/workflows/release.yml"
      to: "docker/Dockerfile"
      via: "docker/build-push-action@v6"
    - from: ".github/workflows/preview.yml"
      to: "packages/{types,node,react,next}"
      via: "pkg-pr-new publish with explicit package list"
requirements:
  - CICD-01
  - CICD-02
  - CICD-03
  - CICD-04
---

# Phase 15: CI/CD Workflows & Shared Infra Verification Report

**Phase Goal:** This repo has the same CI/CD workflow quality as `chillwhales/LSPs` — layered CI (lint, typecheck, build, test, package verification), changesets-based release, and preview releases. Shared workflow logic is abstracted into a reusable third repo so both repos (and future repos) use identical pipeline patterns.
**Verified:** 2026-03-08T12:07:51Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PRs trigger multi-layer CI pipeline matching LSPs pattern | ✓ VERIFIED | `ci.yml` calls `ci-build-lint-test.yml@main` (7 jobs: install → format/lint/build → typecheck/test → coverage) + `ci-quality.yml@main` (2 jobs: pkg-verify + changeset-check). Total ~9 logical jobs across the two reusable workflows. Triggers on push/PR to main + refactor/indexer-v2-react. |
| 2 | Merging to main triggers changesets-based release flow | ✓ VERIFIED | `release.yml` triggers on `push: branches: [main]`, uses `changesets/action@v1` with `publish: pnpm ci:publish`. Creates "Version Packages" PR or publishes npm + Docker image to GHCR. `cancel-in-progress: false` prevents release mid-flight cancellation. |
| 3 | Documented decision on shared workflows | ✓ VERIFIED | `SHARED-INFRA-DECISION.md` (149 lines) documents: architecture (3-layer), what was implemented, what works well (5 items), limitations (5 items), LSPs migration path with example caller, consumer pattern, maintenance considerations, rationale vs alternatives. |
| 4 | At least one reusable workflow extracted and consumed | ✓ VERIFIED | `chillwhales/.github` repo exists with 3 reusable workflows (`ci-build-lint-test.yml`, `ci-quality.yml`, `ci-publish-validation.yml`) + 2 composite actions (`setup-pnpm`, `build-and-upload`). lsp-indexer's `ci.yml` consumes 2 of these workflows via `uses: chillwhales/.github/.github/workflows/*@main`. |
| 5 | pnpm test:coverage runs in CI with coverage reports as PR comments | ✓ VERIFIED | Root `package.json` has `"test:coverage": "vitest run --coverage"`. CI passes `test-command: pnpm test:coverage` to shared workflow. Shared workflow's coverage job uses `davelosert/vitest-coverage-report-action@v2` reading `coverage-summary.json` and `coverage-final.json`. Coverage uploads from Node 22 matrix only. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.changeset/config.json` | Changesets config with fixed group | ✓ VERIFIED | 12 lines. `fixed` array contains all 4 `@lsp-indexer/*` packages. `access: "public"`, `baseBranch: "main"`, `privatePackages: { version: false, tag: false }`. |
| `.github/workflows/ci.yml` | Layered CI consuming shared workflows | ✓ VERIFIED | 44 lines. References `chillwhales/.github` (4 occurrences). 2 jobs: `ci` (ci-build-lint-test) and `quality` (ci-quality). Quality `needs: [ci]`. |
| `.github/workflows/release.yml` | Changesets release + Docker | ✓ VERIFIED | 82 lines. Contains `changesets/action@v1`, `docker/build-push-action@v6`, `cancel-in-progress: false`, GHCR login, version extraction from `publishedPackages`. Conditional Docker publish on `published == 'true'`. |
| `.github/workflows/preview.yml` | PR preview releases | ✓ VERIFIED | 36 lines. Contains `pkg-pr-new publish` with explicit 4 package paths, fork security guard (`head.repo.full_name == github.repository`), `--compact --comment=update --packageManager=pnpm`. |
| `vitest.config.ts` | Root vitest workspace config | ✓ VERIFIED | 19 lines. Uses `test.projects` (vitest 4 API) referencing 4 packages. Coverage: v8 provider, `json-summary` + `json` reporters. |
| `packages/*/vitest.config.ts` | Per-package vitest configs | ✓ VERIFIED | 4 files exist (types, node, react, next), each with v8 coverage provider and 80% thresholds. |
| `packages/*/src/__tests__/smoke.test.ts` | Smoke tests for 4 packages | ✓ VERIFIED | 4 files: types (427 lines), node (249 lines), react (214 lines), next (167 lines). Total 1057 lines / 88 tests. |
| `SHARED-INFRA-DECISION.md` | Architecture decision record | ✓ VERIFIED | 149 lines. Contains architecture, implementation details, limitations, LSPs migration path, consumer pattern, rationale. |
| `chillwhales/.github` (external) | Org repo with shared workflows | ✓ VERIFIED | Repo exists on GitHub with description "Org-wide GitHub Actions workflows and composite actions". Contains 2 composite actions (setup-pnpm, build-and-upload) and 3 reusable workflows (ci-build-lint-test, ci-quality, ci-publish-validation) + README. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ci.yml` | `chillwhales/.github` | `uses: chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main` | ✓ WIRED | Line 18: `uses:` with 9 inputs (node-version, build-command, lint-command, format-command, typecheck-command, test-command, pre-lint-command, test-node-versions, artifact-paths) |
| `ci.yml` | `chillwhales/.github` | `uses: chillwhales/.github/.github/workflows/ci-quality.yml@main` | ✓ WIRED | Line 41: `uses:` with 2 inputs (verify-command, changeset-check), `needs: [ci]` |
| `ci.yml` → shared workflow | `package.json` | `pnpm test:coverage` | ✓ WIRED | CI passes `test-command: pnpm test:coverage`, package.json has matching script: `"test:coverage": "vitest run --coverage"` |
| Shared `ci-quality.yml` | `.changeset/config.json` | `pnpm changeset status --since=origin/main` | ✓ WIRED | Changeset-check job runs the status command. Config exists with `baseBranch: "main"`. |
| `release.yml` | `.changeset/config.json` | `changesets/action@v1` reads config | ✓ WIRED | Action reads fixed group from config to create Version Packages PR and publish |
| `release.yml` | `docker/Dockerfile` | `docker/build-push-action@v6` | ✓ WIRED | Builds from `file: docker/Dockerfile`, pushes to `ghcr.io/chillwhales/lsp-indexer`, conditional on `published == 'true'` |
| `preview.yml` | 4 publishable packages | `pkg-pr-new publish` with explicit paths | ✓ WIRED | `'./packages/types' './packages/node' './packages/react' './packages/next'` — explicit, not glob |
| `SHARED-INFRA-DECISION.md` | `ci.yml` | Documents refactoring approach | ✓ WIRED | Decision doc references the CI refactoring: "9 inline jobs (~253 lines) to 2 reusable workflow calls (~40 lines)" |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CICD-01 | 15-01 | CI workflow matches LSPs pattern: layered install → (lint, typecheck, build in parallel) → (test with coverage, package verification with publint+attw) → coverage PR report | ✓ SATISFIED | `ci.yml` calls shared `ci-build-lint-test.yml` which implements the full 7-job layered pipeline (install → format/lint/build → typecheck/test → coverage). Quality workflow adds pkg-verify + changeset-check. Coverage report via `vitest-coverage-report-action@v2` on PRs. |
| CICD-02 | 15-01, 15-02 | Release workflow using changesets: automated version PRs on main push, npm publish on merge, GitHub Releases created | ✓ SATISFIED | `.changeset/config.json` with fixed group versioning. `release.yml` uses `changesets/action@v1` with `publish: pnpm ci:publish`. Creates "Version Packages" PR or publishes npm + Docker image. Root scripts: `changeset`, `ci:publish`. |
| CICD-03 | 15-02 | Preview release workflow for pre-release npm tags from non-main branches | ✓ SATISFIED | `preview.yml` uses `pkg-pr-new` on PRs to main. Fork security guard prevents malicious fork PRs. Only 4 publishable packages explicitly listed. `--compact --comment=update` flags for clean PR comments. |
| CICD-04 | 15-03 | Investigation completed on abstracting shared workflow patterns into a reusable third repo — with decision documented | ✓ SATISFIED | Scope exceeded investigation: `chillwhales/.github` repo created with 2 composite actions + 3 reusable workflows. lsp-indexer CI refactored to consume them. `SHARED-INFRA-DECISION.md` (149 lines) documents architecture, implementation, limitations, migration path, and rationale. |

**Orphaned requirements:** None. REQUIREMENTS.md does not map any CICD-* IDs to Phase 15 (it was last updated before Phase 15 existed). ROADMAP.md maps CICD-01 through CICD-04 to Phase 15 (lines 718-721, 851-856). All 4 are covered by plans and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No anti-patterns found | — | — |

No TODO/FIXME/PLACEHOLDER/HACK markers found in any workflow files (`.github/workflows/*.yml`), `vitest.config.ts`, `.changeset/config.json`, or `SHARED-INFRA-DECISION.md`. No empty implementations or stub patterns detected.

### Human Verification Required

### 1. CI Pipeline End-to-End Run

**Test:** Open a PR to `main` or `refactor/indexer-v2-react` and observe the GitHub Actions run.
**Expected:** 9 logical jobs execute in layered order: install → format/lint/build (parallel) → typecheck/test (parallel) → coverage report + pkg-verify + changeset-check. Coverage report appears as a PR comment.
**Why human:** Requires pushing a branch and observing GitHub Actions execution. Shared workflow wiring across repos can only be fully validated in a live run.

### 2. Release Workflow Execution

**Test:** Merge a PR with a `.changeset/*.md` file to `main` and observe the release workflow.
**Expected:** `changesets/action` creates a "Version Packages" PR (or publishes to npm if version PR was already merged). On publish, Docker image is built and pushed to GHCR.
**Why human:** Requires actual npm publish credentials and live GitHub Actions execution. Cannot be verified via static analysis.

### 3. Preview Release PR Comment

**Test:** Open a non-fork PR to `main` and observe the preview workflow.
**Expected:** `pkg-pr-new` publishes preview packages for all 4 `@lsp-indexer/*` packages and posts/updates a PR comment with installable URLs.
**Why human:** Requires live GitHub Actions run with pkg-pr-new infrastructure. Fork security guard behavior can only be verified with an actual fork PR.

### 4. Shared Workflow Cross-Repo Artifact Sharing

**Test:** Trigger a CI run and verify that build artifacts from `ci-build-lint-test` are available to `ci-quality`'s pkg-verify job.
**Expected:** `download-artifact@v4` in the quality workflow successfully downloads artifacts uploaded by the build-lint-test workflow. Artifacts share the same workflow run context.
**Why human:** Artifact sharing across reusable workflow boundaries is a known GitHub Actions edge case. Static analysis confirms the pattern, but runtime verification is needed.

### Gaps Summary

No gaps found. All 5 success criteria are verified with concrete codebase evidence:

1. **Layered CI pipeline** — `ci.yml` consumes `ci-build-lint-test.yml@main` (7-job pipeline) and `ci-quality.yml@main` (2-job quality checks). The shared workflow has 6 `needs:` dependency links implementing the layered pattern.
2. **Changesets release flow** — `release.yml` with `changesets/action@v1`, conditional Docker publish to GHCR, `cancel-in-progress: false`.
3. **Documented decision** — `SHARED-INFRA-DECISION.md` (149 lines) with architecture, limitations, migration path, rationale.
4. **Reusable workflow extracted and consumed** — 3 reusable workflows + 2 composite actions in `chillwhales/.github`. lsp-indexer consumes 2 workflows.
5. **Coverage in CI** — `pnpm test:coverage` → vitest → coverage JSON → `vitest-coverage-report-action@v2` → PR comments. 88 smoke tests across 4 packages (1057 lines).

Phase 15 goal is achieved. The CI/CD infrastructure matches the LSPs pattern with the additional benefit of shared reusable workflows.

---

_Verified: 2026-03-08T12:07:51Z_
_Verifier: Claude (gsd-verifier)_
