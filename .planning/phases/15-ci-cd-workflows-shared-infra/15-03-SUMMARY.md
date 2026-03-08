---
phase: 15-ci-cd-workflows-shared-infra
plan: 03
subsystem: ci-cd
tags: [shared-infra, reusable-workflows, composite-actions, github-actions, org-repo]
dependency_graph:
  requires: [ci-pipeline, changesets-config, release-workflow, preview-workflow]
  provides: [shared-workflows, composite-actions, org-repo, shared-infra-decision]
  affects: []
tech_stack:
  added: []
  patterns: ["reusable workflow_call pattern", "composite action using: composite", "org-wide .github repo", "artifact sharing across reusable workflows"]
key_files:
  created:
    - .planning/phases/15-ci-cd-workflows-shared-infra/SHARED-INFRA-DECISION.md
  modified:
    - .github/workflows/ci.yml
  external:
    - chillwhales/.github/.github/actions/setup-pnpm/action.yml
    - chillwhales/.github/.github/actions/build-and-upload/action.yml
    - chillwhales/.github/.github/workflows/ci-build-lint-test.yml
    - chillwhales/.github/.github/workflows/ci-quality.yml
    - chillwhales/.github/.github/workflows/ci-publish-validation.yml
    - chillwhales/.github/README.md
decisions:
  - "Full reusable workflow approach (not composite action fallback) — artifact sharing works across workflow_call boundaries"
  - "CI reduced from 9 inline jobs (~253 lines) to 2 reusable workflow calls (~40 lines)"
  - "Version pinning via @main for rapid iteration — @v1 tags recommended once workflows stabilize"
  - "Shared workflows are generic — no lsp-indexer-specific logic in chillwhales/.github"
metrics:
  duration: "14m"
  completed: "2026-03-08T12:03:00Z"
  tasks: 4
  files_created: 7
  files_modified: 1
---

# Phase 15 Plan 03: Shared Infra — chillwhales/.github Org Repo Summary

Created `chillwhales/.github` org repo with 2 composite actions and 3 reusable workflows, refactored lsp-indexer CI from 9 inline jobs to 2 reusable workflow calls consuming shared infra, documented architecture decision with LSPs migration path.

## Task Results

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Verify org admin access | (checkpoint — passed) | — |
| 2 | Create chillwhales/.github with composite actions | `bfa7164` (external) | setup-pnpm/action.yml, build-and-upload/action.yml |
| 3 | Add reusable workflows + README | `7f1bb79` (external) | ci-build-lint-test.yml, ci-quality.yml, ci-publish-validation.yml, README.md |
| 4 | Refactor CI + document decision | `ad9fb75` | .github/workflows/ci.yml, SHARED-INFRA-DECISION.md |

## Changes Made

### Task 1: Org Admin Access Verification (Checkpoint)

Verified GitHub CLI has `repo` + `workflow` scopes and org access to `chillwhales`. The checkpoint was self-resolving — access was already available via the authenticated `gh` CLI (b00ste account with `gist`, `read:org`, `repo`, `workflow` scopes).

### Task 2: Composite Actions (chillwhales/.github)

Created `chillwhales/.github` public org repo and populated with two composite actions:

- **`setup-pnpm`** (`.github/actions/setup-pnpm/action.yml`): 4-step boilerplate eliminator — checkout → pnpm/action-setup → setup-node with cache → install. Inputs: `node-version` (default: 22), `fetch-depth` (default: 1).
- **`build-and-upload`** (`.github/actions/build-and-upload/action.yml`): Build + artifact upload pattern. Inputs: `build-command` (required), `artifact-name` (default: build-output), `artifact-paths` (required), `retention-days` (default: 1).

Both use `using: 'composite'` with `shell: bash` on run steps. Generic — no repo-specific logic.

### Task 3: Reusable Workflows + README (chillwhales/.github)

Added three reusable workflows:

- **`ci-build-lint-test.yml`**: 7 jobs — install, format, lint, build, typecheck, test (Node version matrix), coverage report (PR only). 10 inputs with sensible defaults. Optional jobs skip when command input is empty string.
- **`ci-quality.yml`**: 2 jobs — pkg-verify (downloads build artifact, runs publint/attw), changeset-check (PR only). Downloads artifacts from caller workflow run context.
- **`ci-publish-validation.yml`**: 1 job — preview releases via pkg-pr-new on PRs.

README documents all composite actions and reusable workflows with input tables, example caller workflow, and versioning guidance.

### Task 4: lsp-indexer CI Refactoring + Decision Document

**CI Refactoring:** Replaced 9 inline jobs (~253 lines) with 2 reusable workflow calls (~40 lines):

```yaml
jobs:
  ci:
    uses: chillwhales/.github/.github/workflows/ci-build-lint-test.yml@main
    with: { build-command, lint-command, format-command, typecheck-command, test-command, pre-lint-command, artifact-paths }

  quality:
    needs: [ci]
    uses: chillwhales/.github/.github/workflows/ci-quality.yml@main
    with: { verify-command, changeset-check }
```

The reusable workflow approach worked without needing the composite action fallback — artifact sharing across `workflow_call` boundaries operates within the same workflow run context.

**Decision Document:** `SHARED-INFRA-DECISION.md` covers architecture (3-layer: composite actions → reusable workflows → consumer repos), what was implemented, what works well (boilerplate reduction, consistent setup, configurable without forking), limitations (nesting depth, secrets propagation, debugging complexity), LSPs migration path with example caller, and rationale (vs copy-paste, vs nx/turborepo).

## Deviations from Plan

None — plan executed exactly as written. The reusable workflow approach worked without hitting limitations that would require falling back to composite actions for inline jobs.

## Verification Results

| Check | Result |
|-------|--------|
| chillwhales/.github repo exists | ✅ |
| setup-pnpm + build-and-upload composite actions | ✅ |
| 3 reusable workflows (ci-build-lint-test, ci-quality, ci-publish-validation) | ✅ |
| README.md in org repo | ✅ |
| lsp-indexer CI references chillwhales/.github | ✅ |
| SHARED-INFRA-DECISION.md exists with architecture + migration path | ✅ |

## Self-Check: PASSED

All files verified on disk. Task 4 commit (ad9fb75) verified in git log. External repo commits (bfa7164, 7f1bb79) verified via GitHub API.
