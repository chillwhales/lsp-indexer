# T03: 15-ci-cd-workflows-shared-infra 03

**Slice:** S19 — **Milestone:** M001

## Description

Create the `chillwhales/.github` org repo with working reusable workflows and composite actions, then refactor lsp-indexer's CI workflow to consume them — proving the shared infra pattern works end-to-end.

Purpose: CICD-04 in ROADMAP scoped as "investigation + decision documented". User expanded scope in CONTEXT.md to "full implementation — create `chillwhales/.github` repo with working reusable workflows, lsp-indexer consuming them by end of phase". This plan follows CONTEXT.md (locked decisions override ROADMAP placeholders). The scope expansion adds risk — external repo creation requires org admin permissions. A prerequisite checkpoint verifies access before proceeding.

Output: `chillwhales/.github` repo created with reusable workflows + composite actions, lsp-indexer CI refactored to consume them, architecture decision document.

## Must-Haves

- [ ] "chillwhales/.github org repo exists with working reusable workflows and composite actions"
- [ ] "lsp-indexer CI workflow consumes shared workflows or composite actions from chillwhales/.github"
- [ ] "A documented decision exists on shared workflow architecture with migration path for LSPs"
- [ ] "The CI pipeline still passes all checks after refactoring to use shared infra"

## Files

- `.planning/phases/15-ci-cd-workflows-shared-infra/SHARED-INFRA-DECISION.md`
- `.github/workflows/ci.yml`
