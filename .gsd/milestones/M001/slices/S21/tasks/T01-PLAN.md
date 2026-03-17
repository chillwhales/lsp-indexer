# T01: 17-version-normalization 01

**Slice:** S21 — **Milestone:** M001

## Description

Normalize all private package versions to 0.1.0 across the monorepo.

Purpose: Establish clean, consistent versioning as the baseline for the v1.2 Production Readiness milestone. Private packages had accumulated arbitrary version numbers (1.0.4, 1.2.1) from development — resetting to 0.1.0 signals a fresh semantic versioning baseline.

Output: All 4 private packages at version 0.1.0 with consistent workspace references and passing builds.

## Must-Haves

- [ ] "@chillwhales/abi package.json shows version 0.1.0"
- [ ] "@chillwhales/typeorm package.json shows version 0.1.0"
- [ ] "@chillwhales/indexer package.json shows version 0.1.0"
- [ ] "apps/test package.json shows version 0.1.0"
- [ ] "All packages build successfully after version change"

## Files

- `packages/abi/package.json`
- `packages/typeorm/package.json`
- `packages/indexer/package.json`
- `pnpm-lock.yaml`
