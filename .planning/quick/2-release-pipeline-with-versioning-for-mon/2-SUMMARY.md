---
phase: quick-2
plan: 2
subsystem: release-pipeline
tags: [changesets, docker, ci-cd, versioning]
dependency_graph:
  requires: []
  provides: [changeset-versioning, docker-tag-trigger]
  affects: [.changeset/config.json, packages/indexer/package.json, .github/workflows/docker.yml]
tech_stack:
  added: []
  patterns: [changeset-private-package-versioning, scoped-tag-docker-trigger]
key_files:
  created: []
  modified:
    - .changeset/config.json
    - packages/indexer/package.json
    - .github/workflows/docker.yml
decisions:
  - Version baseline set to 2.1.1 to match current Docker image
  - Ignore list covers abi, typeorm, and comparison-tool (only indexer gets versioned)
  - workflow_dispatch simplified to no-input emergency rebuild
metrics:
  duration: 72s
  completed: "2026-03-11T19:34:26Z"
  tasks: 2/2
  files_modified: 3
---

# Quick Task 2: Release Pipeline with Versioning Summary

Changeset versioning for `@chillwhales/indexer` with tag-triggered Docker builds to GHCR.

## What Was Done

### Task 1: Enable changeset versioning for indexer (7da9f51)

- Set `privatePackages` to `{ "version": true, "tag": true }` in `.changeset/config.json`
- Added ignore list: `@chillwhales/abi`, `@chillwhales/typeorm`, `@chillwhales/comparison-tool`
- Updated `packages/indexer/package.json` version from `0.1.0` to `2.1.1`

### Task 2: Update Docker workflow for changeset tags (b5ee811)

- Changed tag trigger from `indexer-v*` to `@chillwhales/indexer@*` to match changeset's scoped package tag format
- Removed `version` input from `workflow_dispatch` (changesets handle versioning now)
- Updated version extraction: `GITHUB_REF_NAME#@chillwhales/indexer@` strips scope prefix to get semver
- Simplified tag logic: tag push → SHA + versioned + latest; manual dispatch → SHA only

## Release Flow

```
1. Dev adds changeset: pnpm changeset → selects @chillwhales/indexer
2. PR merged to main → release.yml creates Release PR (version bump + CHANGELOG)
3. Release PR merged → changeset publish creates git tag @chillwhales/indexer@X.Y.Z
4. Tag push triggers docker.yml → builds + pushes image to GHCR
```

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- [x] `.changeset/config.json` has `privatePackages: { version: true, tag: true }`
- [x] `.changeset/config.json` ignore list contains 3 non-indexer packages
- [x] `packages/indexer/package.json` version is `"2.1.1"`
- [x] `.github/workflows/docker.yml` triggers on `@chillwhales/indexer@*` tags
- [x] `workflow_dispatch` has no version input
- [ ] `pnpm build` passes — N/A (no Node.js runtime in environment; changes are config-only)

## Self-Check: PASSED

All 3 modified files exist, SUMMARY.md created, both task commits (7da9f51, b5ee811) verified.
