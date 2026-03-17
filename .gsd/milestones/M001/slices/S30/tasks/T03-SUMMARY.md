---
id: T03
parent: S30
milestone: M001
provides:
  - docs/docker/BACKUP.md — complete backup/recovery runbook with strategy, automation, recovery, retention, troubleshooting, and off-site backup sections
  - docker/README.md updated with backup.sh, restore.sh entries and BACKUP.md cross-reference
  - apps/test/src/app/docs/indexer/page.mdx updated with Database Backup & Recovery section
key_files:
  - docs/docker/BACKUP.md
  - docker/README.md
  - apps/test/src/app/docs/indexer/page.mdx
key_decisions:
  - MDX backup section uses standard markdown only (no JSX components) for maximum compatibility
patterns_established:
  - Documentation cross-referencing: new docs linked from docker/README.md Documentation section and indexer MDX page
observability_surfaces:
  - none (documentation-only task)
duration: 12m
verification_result: passed
completed_at: 2026-03-17
blocker_discovered: false
---

# T03: Write backup runbook documentation and update indexer docs page

**Created backup/recovery runbook at docs/docker/BACKUP.md, added backup script entries and cross-references to docker/README.md, and added Database Backup & Recovery section to indexer docs MDX page**

## What Happened

Created the comprehensive backup runbook at `docs/docker/BACKUP.md` covering: strategy rationale (pg_dump over WAL archiving for re-derivable data), automated backup sidecar configuration (cron schedule, retention, Docker volume), manual backup via `manage.sh`, listing/verifying backups, full 6-step recovery procedure matching `manage.sh backup-restore` flow, retention policy with storage estimation, troubleshooting table for common issues, off-site backup with bind-mount volume override example, and full re-sync alternative.

Updated `docker/README.md` with `backup.sh` and `restore.sh` entries in the Files list, a Backup section in Management Commands showing all 4 backup commands, and a link to BACKUP.md in the Documentation section.

Added a `## Database Backup & Recovery` section to the indexer docs MDX page before `## Next Steps`, covering env vars table, management commands, and a link to the full runbook.

## Verification

All task-level checks passed:
- `test -f docs/docker/BACKUP.md` — PASS
- `grep -q 'Recovery Procedure' docs/docker/BACKUP.md` — PASS
- `grep -q 'Troubleshooting' docs/docker/BACKUP.md` — PASS
- `grep -q 'backup.sh' docker/README.md` — PASS
- `grep -q 'BACKUP.md' docker/README.md` — PASS
- `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx` — PASS
- `pnpm build` exits 0 — PASS (MDX page compiled, all packages built)

All slice-level verification checks passed:
- `shellcheck docker/backup.sh docker/restore.sh` — PASS
- `bash -n docker/backup.sh && bash -n docker/restore.sh` — PASS
- `docker compose -f docker/docker-compose.prod.yml config --quiet` — PASS (env-var warnings only, expected)
- `grep -c 'backup' docker/manage.sh` — 28 (≥4 required) — PASS
- `grep -q 'BACKUP_SCHEDULE' .env.example` — PASS
- `test -f docs/docker/BACKUP.md` — PASS
- `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx` — PASS
- `pnpm build` — PASS

## Diagnostics

Documentation-only task. To inspect:
- `cat docs/docker/BACKUP.md` — view the full runbook
- `grep -A5 'backup.sh' docker/README.md` — confirm backup script entries in README
- `grep -A30 'Database Backup' apps/test/src/app/docs/indexer/page.mdx` — confirm MDX section

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `docs/docker/BACKUP.md` — New file: complete backup/recovery runbook (~200 lines)
- `docker/README.md` — Added backup.sh/restore.sh to Files list, backup commands to Management Commands, BACKUP.md link to Documentation
- `apps/test/src/app/docs/indexer/page.mdx` — Added "Database Backup & Recovery" section with env vars table, commands, and runbook link
- `.gsd/milestones/M001/slices/S30/tasks/T03-PLAN.md` — Added Observability Impact section (pre-flight fix)
