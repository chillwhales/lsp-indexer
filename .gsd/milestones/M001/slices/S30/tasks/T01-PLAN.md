---
estimated_steps: 6
estimated_files: 2
---

# T01: Create backup and restore shell scripts

**Slice:** S30 — Database Operations — Backup strategy, automation, and recovery procedure
**Milestone:** M001

## Description

Create the two core shell scripts that implement the backup and recovery operations. `docker/backup.sh` handles automated backups with `pg_dump --format=custom`, timestamped filenames, configurable retention cleanup, and integrity verification. `docker/restore.sh` handles the full recovery procedure with interactive safety confirmations and service orchestration. These scripts are designed to run inside Docker containers (Alpine Linux with PostgreSQL 17 client tools) and use standard PostgreSQL environment variables (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).

## Steps

1. **Create `docker/backup.sh`** with these capabilities:
   - Shebang: `#!/bin/sh` (Alpine/BusyBox — not bash)
   - Accept an optional `--help` flag that prints usage and exits 0
   - Read environment variables: `BACKUP_DIR` (default: `/backups`), `BACKUP_RETENTION_DAYS` (default: `7`), `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (standard PostgreSQL client vars)
   - Validate that `PGHOST` and `PGPASSWORD` are set; exit 1 with descriptive error if missing
   - Wait for PostgreSQL to be ready using `pg_isready` with a timeout loop (max 30 seconds, 2-second intervals)
   - Generate timestamped filename: `backup-YYYYMMDD-HHMMSS.dump`
   - Run `pg_dump --format=custom --compress=6 --file=$BACKUP_DIR/$FILENAME`
   - On failure: log error with timestamp and exit 1
   - On success: verify integrity by running `pg_restore --list $BACKUP_DIR/$FILENAME > /dev/null`
   - On verification failure: log error, delete corrupt file, exit 1
   - Log success with filename, file size (using `du -h` or `ls -lh`), and duration
   - Run retention cleanup: `find $BACKUP_DIR -name "backup-*.dump" -mtime +$BACKUP_RETENTION_DAYS -delete`, log count of deleted files
   - All log messages use `[BACKUP]` prefix with ISO-8601 timestamps for Loki parsing: `echo "[BACKUP] $(date -u +%Y-%m-%dT%H:%M:%SZ) message"`
   - Make executable: `chmod +x docker/backup.sh`

2. **Create `docker/restore.sh`** with these capabilities:
   - Shebang: `#!/bin/sh` (Alpine/BusyBox — not bash)
   - Accept a single argument: the backup filename to restore from
   - Accept `--help` flag that prints usage and exits 0
   - If no filename provided: list available backups in `$BACKUP_DIR` with sizes/dates, then exit 1 with usage
   - Validate the backup file exists; exit 1 if not
   - Verify backup integrity: `pg_restore --list $FILE > /dev/null`; exit 1 on failure
   - Display a prominent warning: "This will DESTROY the current database and replace it with the backup"
   - Interactive confirmation: `read -p "Type 'restore' to confirm: "` — exit on mismatch
   - Log step-by-step progress with `[RESTORE]` prefix and ISO timestamps:
     - Step 1: Verify backup integrity (done above)
     - Step 2: Drop and recreate database — `dropdb --if-exists $PGDATABASE && createdb $PGDATABASE`
     - Step 3: Restore from backup — `pg_restore --no-owner --no-privileges --dbname=$PGDATABASE $FILE`
     - Step 4: Log success with restore duration
   - Note in comments: caller (manage.sh) handles stopping/starting indexer and Hasura — this script only handles the database operations
   - Exit non-zero on any step failure with descriptive error
   - Make executable: `chmod +x docker/restore.sh`

3. **Run shellcheck on both scripts** — fix any warnings. Note: Use `# shellcheck disable=SC2086` for intentional word-splitting where needed. Use `# shellcheck shell=sh` directive at top since these are POSIX sh, not bash.

4. **Run `bash -n` syntax check** — ensure both scripts parse without errors.

## Must-Haves

- [ ] `docker/backup.sh` exists and is executable
- [ ] `docker/restore.sh` exists and is executable
- [ ] Backup script uses `pg_dump --format=custom` (not plain SQL)
- [ ] Backup script verifies integrity with `pg_restore --list`
- [ ] Backup script handles retention cleanup based on `BACKUP_RETENTION_DAYS`
- [ ] Backup script logs with timestamps and `[BACKUP]` prefix
- [ ] Restore script requires interactive confirmation before destructive action
- [ ] Restore script validates backup file exists and passes integrity check
- [ ] Both scripts exit non-zero on failure with descriptive error messages
- [ ] Both scripts pass `shellcheck` (install with `apt-get install -y shellcheck` if needed)
- [ ] Both scripts pass `bash -n` syntax validation

## Verification

- `shellcheck docker/backup.sh docker/restore.sh` exits 0
- `bash -n docker/backup.sh && bash -n docker/restore.sh` exits 0
- `test -x docker/backup.sh && test -x docker/restore.sh` — both are executable
- `grep -q 'pg_dump.*--format=custom' docker/backup.sh` — uses custom format
- `grep -q 'pg_restore.*--list' docker/backup.sh` — has integrity verification
- `grep -q 'BACKUP_RETENTION_DAYS' docker/backup.sh` — has retention config
- `grep -q "Type 'restore'" docker/restore.sh` — has interactive confirmation

## Observability Impact

- Signals added: both scripts produce structured log lines with ISO-8601 timestamps and `[BACKUP]`/`[RESTORE]` prefixes — these are picked up by Docker json-file driver → Alloy → Loki
- How a future agent inspects this: `docker logs <backup-container>` shows backup execution history; grep for `[BACKUP]` or `[RESTORE]` in Loki
- Failure state exposed: non-zero exit code + descriptive `[BACKUP] ERROR:` or `[RESTORE] ERROR:` log line with the specific failure reason

## Inputs

- Research doc identifies `pg_dump --format=custom`, `pg_restore --list`, `crond` as the tooling. Scripts target Alpine/BusyBox environment (POSIX sh, not bash).
- Research doc identifies env vars: `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`
- Existing `manage.sh` `cmd_db_dump` pattern (line ~215) shows the current minimal approach to replace

## Expected Output

- `docker/backup.sh` — executable backup script (~80-100 lines) with pg_dump, verification, retention, structured logging
- `docker/restore.sh` — executable restore script (~60-80 lines) with safety checks, database drop/recreate, pg_restore, structured logging
