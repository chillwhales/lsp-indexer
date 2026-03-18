---
id: S01
milestone: M002
provides:
  - apps/docs/ — complete working app renamed from apps/test/
  - package name "docs" — usable via pnpm --filter docs
  - Dockerfile updated — all paths and filters reference apps/docs
  - docker-compose.yml updated — service docs-app, correct dockerfile path
  - pnpm-lock.yaml — no apps/test references remaining
requires: []
affects: [S02, S03, S04]
key_files:
  - apps/docs/package.json
  - apps/docs/Dockerfile
  - apps/docs/docker-compose.yml
  - pnpm-lock.yaml
key_decisions:
  - "No CI workflow files referenced apps/test — zero CI changes needed"
  - "pnpm-workspace.yaml apps/* glob auto-picks-up apps/docs"
patterns_established:
  - "All downstream slices use pnpm --filter docs to target the app"
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
duration: 10min
verification_result: pass
completed_at: 2026-03-18T07:50:00Z
---

# S01: Rename apps/test → apps/docs

**Pure rename — `apps/test` is gone, `apps/docs` is present, `pnpm --filter docs build` exits 0**

## What Was Built

Renamed `apps/test` → `apps/docs`, updated the package name to `docs`, updated all references in Dockerfile and docker-compose.yml. No CI files needed updating. Lockfile regenerated cleanly. Build passes with all 12 playground pages and 5 docs pages rendering correctly.

## Tasks Completed

- T01: Rename directory and update all references — done

## Verification Evidence

- `ls apps/test` → no such directory
- `grep '"name": "docs"' apps/docs/package.json` → passes
- `pnpm --filter docs build` → exits 0, 20 routes built successfully
- No `apps/test` references in .github/, lockfile, or source files
