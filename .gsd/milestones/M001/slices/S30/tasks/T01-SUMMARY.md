---
id: T01
parent: S30
milestone: M001
provides:
  - docker/backup.sh — automated pg_dump backup with integrity verification and retention cleanup
  - docker/restore.sh — interactive database restore with safety confirmation and step-by-step logging
key_files:
  - docker/backup.sh
  - docker/restore.sh
key_decisions:
  - POSIX sh (not bash) for Alpine/BusyBox compatibility
  - find -exec for retention cleanup instead of for-loop (shellcheck SC2044)
  - pg_isready polling with 30s timeout for database readiness
patterns_established:
  - "[BACKUP]" and "[RESTORE]" log prefixes with ISO-8601 timestamps for Loki parsing
  - Exit non-zero with descriptive ERROR log on any failure step
observability_surfaces:
  - Structured log lines: "[BACKUP] <ISO-8601> message" and "[RESTORE] <ISO-8601> message"
  - Error lines: "[BACKUP] <ISO-8601> ERROR: ..." on stderr
  - Exit codes: 0 on success, 1 on any failure (missing env, pg_dump fail, integrity fail, timeout)
duration: 12m
verification_result: passed
completed_at: 2026-03-17
blocker_discovered: false
---

# T01: Create backup and restore shell scripts

**Created docker/backup.sh and docker/restore.sh — POSIX sh scripts for automated PostgreSQL backup with pg_dump custom format, integrity verification, configurable retention, and interactive restore with safety confirmation.**

## What Happened

Created two shell scripts in `docker/`:

**backup.sh** (~130 lines): Reads `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, and standard PG env vars. Validates `PGHOST`/`PGPASSWORD` are set. Waits for PostgreSQL readiness via `pg_isready` (30s timeout, 2s intervals). Runs `pg_dump --format=custom --compress=6` with timestamped filename (`backup-YYYYMMDD-HHMMSS.dump`). Verifies integrity with `pg_restore --list`. Logs file size and duration on success. Runs retention cleanup with `find -exec` for files older than `BACKUP_RETENTION_DAYS`. All output uses `[BACKUP]` prefix with ISO-8601 timestamps.

**restore.sh** (~140 lines): Accepts a backup filename argument. Without an argument, lists available backups with sizes/dates. Verifies integrity first, then shows a prominent WARNING box and requires typing "restore" to confirm. Drops and recreates the database, then runs `pg_restore --no-owner --no-privileges`. Logs step-by-step progress with `[RESTORE]` prefix. Comments note that manage.sh handles service orchestration.

Both scripts use `#!/bin/sh` for Alpine compatibility, include `--help` flags, and pass shellcheck with zero warnings.

## Verification

- `shellcheck docker/backup.sh docker/restore.sh` → exit 0 (zero warnings)
- `bash -n docker/backup.sh && bash -n docker/restore.sh` → exit 0 (syntax valid)
- `test -x docker/backup.sh && test -x docker/restore.sh` → both executable
- `grep -q 'pg_dump.*--format=custom' docker/backup.sh` → confirmed custom format
- `grep -q 'pg_restore.*--list' docker/backup.sh` → confirmed integrity verification
- `grep -q 'BACKUP_RETENTION_DAYS' docker/backup.sh` → confirmed retention config
- `grep -q "Type 'restore'" docker/restore.sh` → confirmed interactive confirmation
- `sh docker/backup.sh --help` → exit 0 (help mode works)
- `sh docker/restore.sh --help` → exit 0 (help mode works)

Slice-level checks: 2/8 pass (shellcheck + bash -n). Remaining 6 are for T02 (compose, manage.sh, env vars) and T03 (docs).

## Diagnostics

- `docker logs <backup-container>` — shows `[BACKUP]` lines with timestamps, file sizes, durations
- `grep '[BACKUP] ERROR' <logs>` — surfaces backup failures with specific reason
- `grep '[RESTORE]' <logs>` — surfaces restore operation steps
- Scripts exit 1 with descriptive error for: missing env vars, pg_isready timeout, pg_dump failure, integrity check failure, user cancellation

## Deviations

- Used `find -exec` with a pre-count (`wc -l`) for retention cleanup instead of a `for` loop — shellcheck SC2044 flagged the for-loop-over-find pattern as fragile. The replacement counts files before deletion and uses `find -exec rm -f {} +` for safe execution.

## Known Issues

None.

## Files Created/Modified

- `docker/backup.sh` — automated backup script with pg_dump, integrity verification, retention cleanup, and structured logging (~130 lines)
- `docker/restore.sh` — interactive restore script with safety confirmation, database drop/recreate, pg_restore, and step-by-step logging (~140 lines)
