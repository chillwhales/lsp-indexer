---
id: T01
parent: S01
milestone: M002
provides:
  - apps/docs/ — renamed from apps/test/, identical behavior under new name
  - apps/docs/package.json — name: "docs"
  - apps/docs/Dockerfile — all apps/test refs updated to apps/docs; filter=test → filter=docs
  - apps/docs/docker-compose.yml — service name test-app → docs-app; dockerfile path updated
  - pnpm-lock.yaml — regenerated with docs package name; no apps/test references
requires: []
affects: [S02, S03, S04]
key_files:
  - apps/docs/package.json
  - apps/docs/Dockerfile
  - apps/docs/docker-compose.yml
  - pnpm-lock.yaml
key_decisions:
  - "No CI workflow files referenced apps/test — zero CI changes needed"
  - "pnpm-workspace.yaml uses apps/* glob — picked up apps/docs automatically"
  - ".next/ build artifacts had stale apps/test paths but overwritten on rebuild (not a problem)"
patterns_established:
  - "git mv preserves rename history as R (rename) in git status — confirms no file content loss"
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/S01-PLAN.md
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
duration: 10min
verification_result: pass
completed_at: 2026-03-18T07:50:00Z
---

# T01: Rename directory and update all references

**`apps/test` renamed to `apps/docs` with package name `docs`; Dockerfile, docker-compose, and lockfile all updated; `pnpm --filter docs build` exits 0**

## What Happened

Executed `mv apps/test apps/docs`, updated package.json name from `"test"` to `"docs"`, updated all `apps/test` references in Dockerfile (comments + functional paths + pnpm filter), updated docker-compose.yml (service name + dockerfile path). No CI workflows referenced `apps/test` — zero CI changes needed. `pnpm-workspace.yaml` uses `apps/*` glob so `apps/docs` is picked up automatically. Ran `pnpm install` to regenerate lockfile, then `pnpm --filter docs build` — exits 0, all 12 playground pages and 5 docs pages rendered successfully.

## Deviations

None — plan executed exactly as written.

## Files Created/Modified

- `apps/docs/` — renamed from `apps/test/` (91 files, git shows as R renames)
- `apps/docs/package.json` — name changed from "test" to "docs"
- `apps/docs/Dockerfile` — all apps/test → apps/docs; pnpm --filter=test → pnpm --filter=docs
- `apps/docs/docker-compose.yml` — service test-app → docs-app; dockerfile path updated
- `pnpm-lock.yaml` — regenerated (apps/test entry replaced by apps/docs)
