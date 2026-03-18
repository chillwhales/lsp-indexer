---
id: S04
milestone: M002
provides:
  - apps/docs/public/context7.json — Context7 MCP library index (libraryId, version, 5 pages)
  - .github/workflows/ci.yml — docs-check job running pnpm --filter docs generate:check on every PR
  - ci-pass gate updated to include docs-check
requires:
  - slice: S03
    provides: scripts/generate-md.mjs --check flag + public/llm/*.md static files
affects: []
key_files:
  - apps/docs/public/context7.json
  - .github/workflows/ci.yml
key_decisions:
  - "context7.json uses placeholder domain lsp-indexer.chillwhales.io — update when domain finalized"
  - "docs-check runs in parallel with build-test (no needs dependency) — fast, no build required"
  - "ci-pass gate updated to require docs-check in addition to build-test and quality"
patterns_established:
  - "Sidecar freshness enforced by CI — developers must run generate before committing MDX changes"
drill_down_paths:
  - .gsd/milestones/M002/slices/S04/S04-PLAN.md
duration: 20min
verification_result: pass
completed_at: 2026-03-18T09:00:00Z
---

# S04: context7.json + CI Sidecar Validation

**context7.json at public/context7.json; CI docs-check job wired; pnpm --filter docs generate:check exits 0**

## What Was Built

**T01:** Created `public/context7.json` with `libraryId: "chillwhales/lsp-indexer"`, version `2.0.0` (matching `@lsp-indexer/node`), and 5 pages with `lsp-indexer.chillwhales.io` placeholder URLs. JSON validates cleanly.

**T02:** Added `docs-check` job to `.github/workflows/ci.yml` — installs deps and runs `pnpm --filter docs generate:check`. Updated `ci-pass` gate to require this job. Running locally exits 0 on clean state.

## Deviations

None.

## Files Created/Modified

- `apps/docs/public/context7.json` — new
- `.github/workflows/ci.yml` — docs-check job + ci-pass gate updated
