---
phase: 15-ci-cd-workflows-shared-infra
plan: 02
subsystem: ci-cd
tags: [release, preview, changesets, docker, ghcr, pkg-pr-new, github-actions]
dependency_graph:
  requires: [changesets-config, ci-pipeline]
  provides: [release-workflow, preview-workflow, docker-ghcr-publish]
  affects: [15-03]
tech_stack:
  added: []
  patterns: ["changesets/action@v1 release automation", "pkg-pr-new preview releases", "docker/build-push-action@v6 GHCR publish", "npm provenance attestation"]
key_files:
  created:
    - .github/workflows/release.yml
    - .github/workflows/preview.yml
  modified: []
decisions:
  - "npm provenance via npm config set (avoids modifying changesets publish command)"
  - "Docker image tagged with version from publishedPackages[0].version (fixed group ensures all packages share version)"
  - "Preview releases use explicit package list (not glob) to exclude internal packages"
metrics:
  duration: "5m"
  completed: "2026-03-08T11:28:00Z"
  tasks: 2
  files_created: 2
  files_modified: 0
---

# Phase 15 Plan 02: Release & Preview Workflows Summary

Changesets-based release workflow with Docker image publishing to GHCR on npm publish, plus pkg-pr-new preview releases for installable PR-based pre-release packages with fork security guard.

## Task Results

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Release workflow with changesets + Docker image | `08488ba` | .github/workflows/release.yml |
| 2 | Preview release workflow with pkg-pr-new | `02b6b8b` | .github/workflows/preview.yml |

## Changes Made

### Task 1: Release Workflow

Created `.github/workflows/release.yml` — fully automated release pipeline triggered on push to main:

- **Changesets action** (`changesets/action@v1`): Creates "Version Packages" PR when unreleased changesets exist, publishes to npm when the PR is merged
- **npm provenance**: Enabled via `npm config set provenance true` with `id-token: write` permission for supply chain attestation
- **Docker image**: Built and pushed to GHCR only when packages are actually published (conditional on `steps.changesets.outputs.published == 'true'`)
- **Version tagging**: Extracts version from `publishedPackages[0].version` (all 4 packages share version via fixed group), tags Docker image as both `latest` and `v{version}`
- **Concurrency**: `cancel-in-progress: false` — CRITICAL: never cancel a release mid-flight
- **Permissions**: `contents: write`, `pull-requests: write`, `packages: write` (GHCR), `id-token: write` (provenance)

### Task 2: Preview Release Workflow

Created `.github/workflows/preview.yml` — PR-based preview package publishing:

- **Trigger**: PRs to main only (not other branches)
- **Fork security**: `github.event.pull_request.head.repo.full_name == github.repository` guard excludes fork PRs
- **Selective publishing**: Only 4 publishable packages listed explicitly (`types`, `node`, `react`, `next`) — NOT the full `./packages/*` glob which would include internal packages (indexer, abi, typeorm, comparison-tool)
- **pkg-pr-new flags**: `--compact` for condensed PR comments, `--comment=update` to update existing comment instead of creating new ones, `--packageManager=pnpm` for correct registry interaction
- **No NPM_TOKEN needed**: pkg-pr-new uses its own infrastructure, not the npm registry

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| release.yml has changesets/action | ✅ |
| release.yml has docker/build-push-action | ✅ |
| release.yml has cancel-in-progress: false | ✅ |
| Docker image conditional on published == true (3 steps) | ✅ |
| preview.yml has pkg-pr-new | ✅ |
| preview.yml has fork security guard | ✅ |
| preview.yml lists exactly 4 packages | ✅ |
| Both workflows use pnpm cache | ✅ |

## Self-Check: PASSED

All 2 created files verified on disk. Both task commits (08488ba, 02b6b8b) verified in git log.
