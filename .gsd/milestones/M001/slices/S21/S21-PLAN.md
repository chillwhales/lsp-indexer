# S21: Version Normalization

**Goal:** Normalize all private package versions to 0.
**Demo:** Normalize all private package versions to 0.

## Must-Haves


## Tasks

- [x] **T01: 17-version-normalization 01** `est:1min`
  - Normalize all private package versions to 0.1.0 across the monorepo.

Purpose: Establish clean, consistent versioning as the baseline for the v1.2 Production Readiness milestone. Private packages had accumulated arbitrary version numbers (1.0.4, 1.2.1) from development — resetting to 0.1.0 signals a fresh semantic versioning baseline.

Output: All 4 private packages at version 0.1.0 with consistent workspace references and passing builds.

## Files Likely Touched

- `packages/abi/package.json`
- `packages/typeorm/package.json`
- `packages/indexer/package.json`
- `pnpm-lock.yaml`
