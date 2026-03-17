---
id: T02
parent: S30
milestone: M001
provides:
  - backup sidecar service in docker-compose.prod.yml with cron-scheduled pg_dump
  - backup-data Docker volume for persistent backup storage
  - manage.sh commands: backup, backup-list, backup-verify, backup-restore
  - .env.example backup configuration section (BACKUP_SCHEDULE, BACKUP_RETENTION_DAYS, BACKUP_DIR, BACKUP_ENABLED)
key_files:
  - docker/docker-compose.prod.yml
  - docker/manage.sh
  - .env.example
key_decisions:
  - Backup sidecar uses postgres:17-alpine image (matches DB version, includes pg_dump/pg_restore)
  - Manual backup runs in backup container (not postgres) since that's where backup.sh is mounted
  - shellcheck disable SC2086 on docker compose lines with $COMPOSE_OPTS (intentional word splitting)
patterns_established:
  - manage.sh backup commands follow existing cmd_ function pattern with case dispatcher entries
  - Compose service comment block pattern: `# Section — Description`
observability_surfaces:
  - "docker logs ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup — cron execution history and [BACKUP] log lines"
  - "./manage.sh backup-list — lists backup files with sizes and dates"
  - "./manage.sh backup-verify <file> — re-runs pg_restore --list integrity check"
  - "docker exec ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup crontab -l — shows active cron schedule"
duration: 10m
verification_result: passed
completed_at: 2026-03-17
blocker_discovered: false
---

# T02: Wire backup sidecar into Docker Compose and manage.sh

**Added backup sidecar service to docker-compose.prod.yml with cron-scheduled pg_dump, four manage.sh backup commands (backup, backup-list, backup-verify, backup-restore), and backup env vars in .env.example.**

## What Happened

Three files updated:

**docker-compose.prod.yml**: Added `backup` service (10th service) after grafana — uses `postgres:17-alpine` with crond entrypoint that installs a cron job from `$BACKUP_SCHEDULE` (default: daily 2 AM UTC) pointing to `/backup.sh`. Service depends on postgres health, mounts `backup-data` volume and `backup.sh:ro`. Environment passes standard PG vars plus `BACKUP_DIR` and `BACKUP_RETENTION_DAYS`. Added `backup-data` volume (6th volume) to the volumes section.

**docker/manage.sh**: Added four `cmd_` functions following the existing pattern:
- `cmd_backup` — runs `/backup.sh` inside the backup container for on-demand backup
- `cmd_backup_list` — lists `backup-*.dump` files with sizes via `ls -lhS`
- `cmd_backup_verify` — runs `pg_restore --list` on a specified backup file
- `cmd_backup_restore` — full recovery procedure: stops indexer → stops hasura → pg_restore → restarts hasura → waits → restarts indexer

All four added to case dispatcher and help text under a new "Backup" section.

**`.env.example`**: Added `# --- Backup ---` section with `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, and `BACKUP_ENABLED` with documentation comments.

## Verification

Task-level checks (5/5 pass):
- `docker compose config 2>&1 | grep -q 'backup'` — PASS (backup service in compose)
- `grep -c 'backup' docker/manage.sh` → 28 — PASS (≥4 required)
- `grep -q 'BACKUP_SCHEDULE' .env.example` — PASS
- `grep -q 'backup-data' docker/docker-compose.prod.yml` — PASS
- `bash -n docker/manage.sh` — PASS (syntax valid)

Compose YAML validates with `docker compose config --quiet` (exit 0 when env vars provided).

Slice-level checks (6/9 pass — intermediate task, remaining 3 are T03 deliverables):
- V1 shellcheck: PASS
- V2 bash -n: PASS
- V3 compose validates: PASS
- V4 backup grep ≥4: PASS (28)
- V5 BACKUP_SCHEDULE in .env.example: PASS
- V6 BACKUP.md exists: FAIL (expected — T03)
- V7 Backup in indexer docs: FAIL (expected — T03)
- V8 pnpm build: SKIP (no MDX changes in T02)
- V9 backup.sh --help: PASS (exit 0)

## Diagnostics

- `docker logs ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup` — shows cron execution history and `[BACKUP]` log lines
- `./manage.sh backup-list` — lists available backup files with sizes
- `./manage.sh backup-verify <filename>` — re-runs integrity check on a specific backup
- `docker exec ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup crontab -l` — shows active cron schedule
- Backup sidecar has `restart: unless-stopped` — auto-recovers from crashes

## Deviations

- Added `# shellcheck disable=SC2086` comments on `docker compose` lines in `cmd_backup_restore` where `$COMPOSE_OPTS` is intentionally word-split — matches the existing pattern in the file.

## Known Issues

None.

## Files Created/Modified

- `docker/docker-compose.prod.yml` — added backup sidecar service (10th service) and backup-data volume (6th volume)
- `docker/manage.sh` — added 4 backup command functions, case dispatcher entries, and help text section
- `.env.example` — added backup configuration section with 4 env vars
- `.gsd/milestones/M001/slices/S30/tasks/T02-PLAN.md` — added Observability Impact section (pre-flight fix)
