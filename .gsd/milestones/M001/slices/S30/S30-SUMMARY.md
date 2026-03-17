---
id: S30
parent: M001
milestone: M001
provides:
  - docker/backup.sh — automated pg_dump backup with integrity verification, retention cleanup, and structured log output
  - docker/restore.sh — interactive database restore with safety confirmation, database drop/recreate, and step-by-step logging
  - Backup sidecar service in docker-compose.prod.yml with cron-scheduled pg_dump and backup-data volume
  - manage.sh commands: backup, backup-list, backup-verify, backup-restore
  - .env.example backup configuration section (BACKUP_SCHEDULE, BACKUP_RETENTION_DAYS, BACKUP_DIR, BACKUP_ENABLED)
  - docs/docker/BACKUP.md — complete backup/recovery runbook
  - Backup section in indexer docs MDX page
requires:
  - slice: S29
    provides: Sorting across all 12 domains, consumer package releases
affects: []
key_files:
  - docker/backup.sh
  - docker/restore.sh
  - docker/docker-compose.prod.yml
  - docker/manage.sh
  - .env.example
  - docs/docker/BACKUP.md
  - docker/README.md
  - apps/test/src/app/docs/indexer/page.mdx
key_decisions:
  - POSIX sh (not bash) for Alpine/BusyBox compatibility in Docker containers
  - pg_dump --format=custom with --compress=6 for efficient backups with random-access restore
  - pg_restore --list for integrity verification (validates TOC without restoring)
  - find -exec for retention cleanup instead of for-loop (shellcheck SC2044 compliance)
  - pg_isready polling with 30s timeout for database readiness before backup
  - Backup sidecar uses postgres:17-alpine image (matches DB version, includes all pg_* tools)
  - Manual backup runs in backup container (not postgres) since that's where backup.sh is mounted
  - pg_dump strategy chosen over WAL archiving — blockchain data is re-derivable, fast recovery prioritized over zero-loss
patterns_established:
  - "[BACKUP]" and "[RESTORE]" log prefixes with ISO-8601 timestamps for Loki parsing
  - manage.sh cmd_ function pattern extended with 4 backup commands
  - Compose service comment block pattern for sidecar services
  - Documentation cross-referencing: new docs linked from docker/README.md and indexer MDX page
observability_surfaces:
  - "docker logs <backup-container> — cron execution history and [BACKUP] log lines with timestamps, file sizes, durations"
  - "./manage.sh backup-list — lists available backup files with sizes and dates"
  - "./manage.sh backup-verify <file> — re-runs pg_restore --list integrity check on demand"
  - "docker exec <backup-container> crontab -l — shows active cron schedule"
  - "Exit codes: 0 on success, 1 on any failure (missing env, pg_dump fail, integrity fail, timeout)"
drill_down_paths:
  - .gsd/milestones/M001/slices/S30/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S30/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S30/tasks/T03-SUMMARY.md
duration: 34m
verification_result: passed
completed_at: 2026-03-17
---

# S30: Database Operations — Backup strategy, automation, and recovery procedure

**Production PostgreSQL backup/restore infrastructure with automated cron scheduling, configurable retention, integrity verification, and a documented recovery runbook — completing the operational layer of the production stack.**

## What Happened

Three tasks delivered the complete backup infrastructure:

**T01 (Scripts):** Created `docker/backup.sh` (~130 lines) and `docker/restore.sh` (~140 lines) as POSIX sh scripts for Alpine compatibility. The backup script runs `pg_dump --format=custom --compress=6` with timestamped filenames, waits for PostgreSQL readiness via `pg_isready` (30s timeout), verifies integrity with `pg_restore --list`, and cleans up old backups based on `BACKUP_RETENTION_DAYS` using `find -exec`. The restore script accepts a backup filename, verifies integrity, requires typing "restore" for interactive confirmation, then drops/recreates the database and runs `pg_restore --no-owner --no-privileges`. Both scripts use structured log prefixes (`[BACKUP]`/`[RESTORE]`) with ISO-8601 timestamps for Loki parsing, and exit non-zero with descriptive errors on any failure.

**T02 (Infrastructure Wiring):** Added a `backup` sidecar service (10th service) to `docker-compose.prod.yml` using `postgres:17-alpine` with a crond entrypoint that installs a cron job from `$BACKUP_SCHEDULE` (default: daily 2 AM UTC). The service depends on postgres health, mounts a `backup-data` volume, and passes standard PG env vars. Added four `cmd_` functions to `manage.sh`: `backup` (on-demand), `backup-list` (file listing), `backup-verify` (integrity check), and `backup-restore` (full recovery with service orchestration — stops indexer → stops hasura → restores → restarts). Updated `.env.example` with `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, and `BACKUP_ENABLED`.

**T03 (Documentation):** Created `docs/docker/BACKUP.md` (~276 lines) covering strategy rationale, automated schedule configuration, manual backup, recovery procedure, retention policy with storage estimation, troubleshooting, and off-site backup options. Updated `docker/README.md` with backup script entries and cross-references. Added a "Database Backup & Recovery" section to the indexer docs MDX page with env vars table, management commands, and a link to the full runbook.

## Verification

All 9 slice-level verification checks passed:

| # | Check | Result |
|---|-------|--------|
| V1 | `shellcheck docker/backup.sh docker/restore.sh` | ✅ exit 0 (zero warnings) |
| V2 | `bash -n docker/backup.sh && bash -n docker/restore.sh` | ✅ exit 0 |
| V3 | `docker compose -f docker/docker-compose.prod.yml config --quiet` | ✅ exit 0 (with required env vars) |
| V4 | `grep -c 'backup' docker/manage.sh` | ✅ 28 (≥4 required) |
| V5 | `grep -q 'BACKUP_SCHEDULE' .env.example` | ✅ found |
| V6 | `test -f docs/docker/BACKUP.md` | ✅ exists |
| V7 | `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx` | ✅ found |
| V8 | `pnpm build` | ✅ exit 0 (all packages + MDX page compile) |
| V9 | `sh docker/backup.sh --help` | ✅ exit 0 (help mode works) |

## Requirements Advanced

- OPS-01 — PostgreSQL backup strategy defined and documented in `docs/docker/BACKUP.md`
- OPS-02 — Backup automation configured via cron sidecar with `BACKUP_SCHEDULE` env var
- OPS-03 — Recovery procedure documented in runbook and implemented in `restore.sh` + `manage.sh backup-restore`

## Requirements Validated

- OPS-01 — `docs/docker/BACKUP.md` contains complete strategy rationale, schedule, retention policy, and troubleshooting
- OPS-02 — Backup sidecar in `docker-compose.prod.yml` runs `pg_dump` on cron schedule with configurable retention
- OPS-03 — 6-step recovery procedure documented in runbook, implemented with service orchestration in `manage.sh backup-restore`

## New Requirements Surfaced

- none

## Requirements Invalidated or Re-scoped

- none

## Deviations

- none — all three tasks completed as planned with no blockers or design changes

## Known Limitations

- Backup scripts require a running PostgreSQL container — they cannot be used outside Docker
- Restore requires interactive confirmation (typing "restore") — cannot be fully automated without modifying the script
- No encryption of backup files at rest — off-site backup section in runbook covers manual bind-mount for external storage but does not implement encryption
- Backup sidecar does not push alerts on failure — relies on log monitoring (Alloy → Loki → Grafana) to surface failures

## Follow-ups

- none — this is the final slice in M001

## Files Created/Modified

- `docker/backup.sh` — New: automated backup script with pg_dump, integrity verification, retention cleanup (~130 lines)
- `docker/restore.sh` — New: interactive restore script with safety confirmation, database drop/recreate (~140 lines)
- `docker/docker-compose.prod.yml` — Added backup sidecar service (10th service) and backup-data volume (6th volume)
- `docker/manage.sh` — Added 4 backup command functions, case dispatcher entries, and help text section
- `.env.example` — Added backup configuration section with 4 env vars
- `docs/docker/BACKUP.md` — New: complete backup/recovery runbook (~276 lines)
- `docker/README.md` — Added backup script entries, backup commands, and BACKUP.md cross-reference
- `apps/test/src/app/docs/indexer/page.mdx` — Added "Database Backup & Recovery" section

## Forward Intelligence

### What the next slice should know
- This is the final slice of M001. All production operational infrastructure is in place: Docker Compose, monitoring (Grafana/Loki/Alloy/Prometheus), structured logging, and now database backups. The next milestone (M002) focuses on documentation site and AI agent compatibility — no more infrastructure work.

### What's fragile
- The backup sidecar's cron entrypoint installs the cron job at container startup via shell script — if the entrypoint script has issues, the cron job silently won't run. Check `crontab -l` inside the container to verify.
- Restore procedure assumes the database name matches `PGDATABASE` exactly — misconfiguration silently drops the wrong database.

### Authoritative diagnostics
- `docker logs <backup-container>` — shows `[BACKUP]` prefixed lines with ISO-8601 timestamps; any failure includes `ERROR:` with a specific reason
- `./manage.sh backup-list` — quick inventory of available backups with sizes and dates
- `shellcheck docker/backup.sh docker/restore.sh` — catches any script quality regressions

### What assumptions changed
- No assumptions changed — the slice delivered exactly what was planned with no deviations.
