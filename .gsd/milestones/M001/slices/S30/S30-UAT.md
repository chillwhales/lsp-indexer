# S30: Database Operations — Backup strategy, automation, and recovery procedure — UAT

**Milestone:** M001
**Written:** 2026-03-17

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: Backup infrastructure is shell scripts, Docker Compose services, and documentation — all structurally verifiable without a running database. The scripts are POSIX sh validated by shellcheck and bash syntax checks, the compose file validates via `docker compose config`, and documentation exists as files.

## Preconditions

- Repository checked out with all S30 changes present
- `shellcheck` installed (for script validation)
- Docker and `docker compose` available (for compose validation)
- `pnpm` available (for monorepo build)

## Smoke Test

Run `sh docker/backup.sh --help` — should exit 0 and print usage with environment variable documentation. Run `sh docker/restore.sh --help` — should exit 0 and print usage with argument documentation.

## Test Cases

### 1. Backup script validates required environment variables

1. Run `PGHOST= PGPASSWORD= sh docker/backup.sh 2>&1`
2. **Expected:** Exit code 1, stderr contains `[BACKUP]` prefix and `ERROR: PGHOST is not set`

### 2. Restore script lists backups when no argument given

1. Run `PGHOST=localhost PGPASSWORD=test sh docker/restore.sh 2>&1`
2. **Expected:** Exit code 1, output contains `Available backups in` and `Usage: restore.sh <backup-filename>`

### 3. Backup script shellcheck compliance

1. Run `shellcheck docker/backup.sh docker/restore.sh`
2. **Expected:** Exit code 0, zero warnings or errors

### 4. Backup script bash syntax validation

1. Run `bash -n docker/backup.sh && bash -n docker/restore.sh`
2. **Expected:** Exit code 0

### 5. Docker Compose validates with backup service

1. Set required env vars: `POSTGRES_PASSWORD=x POSTGRES_DB=x POSTGRES_USER=x HASURA_SECRET=x RPC_ENDPOINT=x RPC_URL=x LOKI_URL=x HASURA_GRAPHQL_ADMIN_SECRET=x GF_SECURITY_ADMIN_PASSWORD=x GRAFANA_ADMIN_USER=x GRAFANA_ADMIN_PASSWORD=x`
2. Run `docker compose -f docker/docker-compose.prod.yml config --quiet`
3. **Expected:** Exit code 0
4. Run `docker compose -f docker/docker-compose.prod.yml config | grep -A5 'backup:'`
5. **Expected:** Output shows backup service with `postgres:17-alpine` image

### 6. Backup service has correct volume mount

1. Run `grep 'backup-data' docker/docker-compose.prod.yml`
2. **Expected:** At least 2 matches — one in the service volumes, one in the top-level volumes section

### 7. manage.sh has all four backup commands

1. Run `grep -c 'backup' docker/manage.sh`
2. **Expected:** 28 or more matches
3. Run `grep -E 'cmd_backup\b|cmd_backup_list|cmd_backup_verify|cmd_backup_restore' docker/manage.sh`
4. **Expected:** All four function names appear

### 8. manage.sh help includes backup section

1. Run `bash docker/manage.sh help 2>&1 | grep -i backup`
2. **Expected:** At least 4 lines showing backup, backup-list, backup-verify, backup-restore commands

### 9. .env.example has backup configuration

1. Run `grep -E 'BACKUP_SCHEDULE|BACKUP_RETENTION_DAYS|BACKUP_DIR|BACKUP_ENABLED' .env.example`
2. **Expected:** All four env vars present with documentation comments

### 10. Backup runbook exists and is comprehensive

1. Run `test -f docs/docker/BACKUP.md && echo EXISTS`
2. **Expected:** `EXISTS`
3. Run `grep -c '##' docs/docker/BACKUP.md`
4. **Expected:** At least 6 section headings (strategy, automation, manual, recovery, retention, troubleshooting)

### 11. docker/README.md cross-references backup docs

1. Run `grep 'backup.sh' docker/README.md`
2. **Expected:** backup.sh appears in the Files table
3. Run `grep 'BACKUP.md' docker/README.md`
4. **Expected:** Link to BACKUP.md in Documentation section

### 12. Indexer docs MDX page has backup section

1. Run `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx && echo FOUND`
2. **Expected:** `FOUND`
3. Run `grep -A2 'Database Backup' apps/test/src/app/docs/indexer/page.mdx`
4. **Expected:** Section heading for "Database Backup & Recovery"

### 13. Full monorepo build passes

1. Run `pnpm build`
2. **Expected:** Exit code 0, all packages and apps/test build successfully including the MDX page with backup section

### 14. Backup script has correct pg_dump options

1. Run `grep 'pg_dump.*--format=custom' docker/backup.sh`
2. **Expected:** pg_dump call with `--format=custom` and `--compress=6`

### 15. Backup script has integrity verification

1. Run `grep 'pg_restore.*--list' docker/backup.sh`
2. **Expected:** pg_restore --list call for post-dump integrity verification

### 16. Restore script has safety confirmation

1. Run `grep "Type 'restore'" docker/restore.sh`
2. **Expected:** Interactive confirmation prompt requiring user to type "restore"

## Edge Cases

### Backup script with missing PGPASSWORD only

1. Run `PGHOST=localhost PGPASSWORD= sh docker/backup.sh 2>&1`
2. **Expected:** Exit code 1, error message mentions `PGPASSWORD is not set`

### Restore script with non-existent backup file

1. Run `PGHOST=localhost PGPASSWORD=test BACKUP_DIR=/tmp sh docker/restore.sh nonexistent.dump 2>&1`
2. **Expected:** Exit code 1, error message mentions `Backup file not found`

### Backup script --help flag

1. Run `sh docker/backup.sh --help`
2. **Expected:** Exit code 0, prints usage documentation including all environment variables

### Restore script --help flag

1. Run `sh docker/restore.sh --help`
2. **Expected:** Exit code 0, prints usage documentation including arguments and environment variables

## Failure Signals

- `shellcheck` reports warnings or errors on backup.sh or restore.sh
- `docker compose config` fails to parse backup service definition
- `pnpm build` fails (MDX page compile error)
- Missing backup commands in manage.sh help output
- BACKUP.md missing recovery procedure or troubleshooting sections
- Scripts exit 0 when required env vars are missing (should exit 1)
- Backup script uses bash-specific syntax (not POSIX sh compatible)

## Requirements Proved By This UAT

- OPS-01 — `docs/docker/BACKUP.md` contains complete backup strategy (test cases 10, 11, 12)
- OPS-02 — Backup automation configured via cron sidecar in docker-compose (test cases 5, 6, 9)
- OPS-03 — Recovery procedure documented and implemented (test cases 7, 8, 10, 16)

## Not Proven By This UAT

- Actual pg_dump execution against a running PostgreSQL database (requires live Docker environment)
- Cron schedule actually fires at the configured time (requires running backup container for 24+ hours)
- pg_restore successfully restores a database from a backup file (requires live database with data)
- Backup retention cleanup actually deletes old files (requires aging files past BACKUP_RETENTION_DAYS)
- Loki/Grafana correctly parses [BACKUP] log lines (requires full monitoring stack running)
- Off-site backup transfer (requires external storage configuration)

## Notes for Tester

- The compose validation requires ALL production env vars to be set (12+ variables). The test case provides them as inline exports. In a real environment these come from `.env.prod`.
- The backup/restore scripts are designed for Docker Alpine containers — they use `sh` (not `bash`) and rely on `pg_dump`/`pg_restore`/`pg_isready` being available (provided by `postgres:17-alpine`).
- The `manage.sh backup-restore` command orchestrates full recovery by stopping services before restore — this cannot be tested without a running Docker Compose stack.
- All existing `db-dump` and `db-restore` commands remain untouched in manage.sh for quick ad-hoc use.
