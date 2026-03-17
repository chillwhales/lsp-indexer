# S30: Database Operations — Backup strategy, automation, and recovery procedure

**Goal:** Production PostgreSQL backup/restore infrastructure with automated scheduling, retention, and a documented recovery runbook.
**Demo:** `docker compose -f docker-compose.prod.yml` includes a backup sidecar that runs `pg_dump` on a cron schedule. `./manage.sh backup` triggers a manual backup, `./manage.sh backup-list` shows available backups with sizes/dates, `./manage.sh backup-verify` tests integrity, and `./manage.sh backup-restore` runs the full recovery procedure. `docs/docker/BACKUP.md` covers the complete strategy, automation, and recovery steps.

## Must-Haves

- `docker/backup.sh` — automated backup script with `pg_dump --format=custom`, configurable retention, and `pg_restore --list` integrity verification
- `docker/restore.sh` — recovery script with service stop/start orchestration, safety confirmations, and ordered steps
- Backup sidecar service in `docker/docker-compose.prod.yml` with cron scheduling and a `backup-data` volume
- `manage.sh` new commands: `backup`, `backup-list`, `backup-verify`, `backup-restore`
- `.env.example` updated with `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, `BACKUP_ENABLED` vars
- `docs/docker/BACKUP.md` — complete backup/recovery runbook
- `apps/test/src/app/docs/indexer/page.mdx` — backup section added
- Existing `db-dump` and `db-restore` commands remain for quick ad-hoc use

## Proof Level

- This slice proves: operational
- Real runtime required: no (structural verification — scripts, compose, docs)
- Human/UAT required: no

## Verification

- `shellcheck docker/backup.sh docker/restore.sh` — passes with no errors
- `bash -n docker/backup.sh && bash -n docker/restore.sh` — scripts parse without syntax errors
- `docker compose -f docker/docker-compose.prod.yml config --quiet 2>&1` — compose file validates (returns 0 or only env-var warnings)
- `grep -c 'backup' docker/manage.sh` — returns ≥4 (backup, backup-list, backup-verify, backup-restore commands present)
- `grep -q 'BACKUP_SCHEDULE' .env.example` — backup env vars present
- `test -f docs/docker/BACKUP.md` — runbook exists
- `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx` — backup section present in indexer docs
- `pnpm build` — full monorepo build passes (MDX page compiles)
- `bash -c 'source docker/backup.sh --help 2>/dev/null; echo $?'` — backup script has a help/usage mode or exits cleanly when run without database connection (failure path: non-zero exit + descriptive error message logged to stdout)

## Observability / Diagnostics

- Runtime signals: backup script logs timestamped success/failure messages to stdout (captured by Docker json-file driver and Alloy → Loki pipeline); includes backup filename, size, duration, and retention cleanup count
- Inspection surfaces: `./manage.sh backup-list` shows all available backups with dates and sizes; `docker logs <backup-container>` shows cron execution history; backup files on `backup-data` volume
- Failure visibility: backup script exits non-zero on `pg_dump` failure or integrity check failure, with descriptive error message; `./manage.sh backup-verify <file>` re-runs integrity check on demand
- Redaction constraints: `PGPASSWORD` passed via environment variable (never in command-line args or logs)

## Integration Closure

- Upstream surfaces consumed: `docker/docker-compose.prod.yml` (existing services, volumes), `docker/manage.sh` (existing command pattern), `.env.example` (existing env var template)
- New wiring introduced in this slice: backup sidecar service in production compose, backup-data volume, manage.sh backup commands dispatching to backup.sh/restore.sh
- What remains before the milestone is truly usable end-to-end: nothing — this is the final slice

## Tasks

- [x] **T01: Create backup and restore shell scripts** `est:45m`
  - Why: These are the core deliverables — everything else (sidecar, manage.sh, docs) layers on top of these scripts
  - Files: `docker/backup.sh`, `docker/restore.sh`
  - Do: Create `docker/backup.sh` with `pg_dump --format=custom`, timestamped filenames, configurable retention cleanup, `pg_restore --list` integrity verification, structured log output. Create `docker/restore.sh` with interactive safety confirmations, service stop/start orchestration (stop indexer → stop hasura → drop/recreate DB → pg_restore → restart), and step-by-step progress logging. Both scripts must handle missing env vars gracefully (exit with descriptive error). Scripts use `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` env vars (standard PostgreSQL client vars).
  - Verify: `shellcheck docker/backup.sh docker/restore.sh` passes, `bash -n docker/backup.sh && bash -n docker/restore.sh` passes
  - Done when: both scripts exist, are executable, pass shellcheck and bash syntax validation

- [x] **T02: Wire backup sidecar into Docker Compose and manage.sh** `est:30m`
  - Why: Connects the scripts to the production infrastructure — adds the cron sidecar, new manage.sh commands, and env var documentation
  - Files: `docker/docker-compose.prod.yml`, `docker/manage.sh`, `.env.example`
  - Do: Add `backup` service to `docker-compose.prod.yml` using `postgres:17-alpine` image with crond entrypoint, `backup-data` volume, and standard PG env vars. Add `backup-data` volume to the volumes section. Add four new commands to `manage.sh`: `cmd_backup` (runs backup.sh in the postgres container), `cmd_backup_list` (lists backup files with sizes/dates from backup volume), `cmd_backup_verify` (runs `pg_restore --list` on a specified backup file), `cmd_backup_restore` (runs restore.sh). Update help text. Add `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, `BACKUP_ENABLED` to `.env.example` with documentation comments.
  - Verify: `docker compose -f docker/docker-compose.prod.yml config --quiet 2>&1` validates, `grep -c 'backup' docker/manage.sh` ≥ 4, `grep -q 'BACKUP_SCHEDULE' .env.example`
  - Done when: compose validates, manage.sh has all 4 backup commands in dispatcher + help, env vars documented

- [ ] **T03: Write backup runbook documentation and update indexer docs page** `est:30m`
  - Why: Requirements OPS-01 and OPS-03 require documented strategy and recovery procedure. AGENTS.md requires indexer docs page update for any Docker/env changes.
  - Files: `docs/docker/BACKUP.md`, `docker/README.md`, `apps/test/src/app/docs/indexer/page.mdx`
  - Do: Create `docs/docker/BACKUP.md` covering: backup strategy rationale (re-derivable data, fast recovery over zero-loss), automated schedule configuration, manual backup procedure, recovery procedure (8-step walkthrough), backup verification, retention policy, troubleshooting common issues. Update `docker/README.md` to add backup entry in Files table and link to BACKUP.md in Documentation section. Add a "Database Backup & Recovery" section to `apps/test/src/app/docs/indexer/page.mdx` before the "Next Steps" section.
  - Verify: `test -f docs/docker/BACKUP.md`, `grep -q 'Backup' docker/README.md`, `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx`, `pnpm build` passes
  - Done when: BACKUP.md runbook exists with all 6 sections, docker README links to it, indexer MDX page has backup section, monorepo builds

## Files Likely Touched

- `docker/backup.sh` (new)
- `docker/restore.sh` (new)
- `docker/docker-compose.prod.yml`
- `docker/manage.sh`
- `.env.example`
- `docs/docker/BACKUP.md` (new)
- `docker/README.md`
- `apps/test/src/app/docs/indexer/page.mdx`
