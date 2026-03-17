# S30 — Database Operations: Backup Strategy, Automation, and Recovery — Research

**Date:** 2026-03-17

## Summary

This slice delivers the operational database infrastructure that requirements OPS-01 (backup strategy), OPS-02 (backup automation), and OPS-03 (recovery procedure) call for. The existing codebase has a rudimentary `manage.sh db-dump` command that runs `pg_dump` to stdout with no scheduling, no retention, no verification, and no production-grade recovery runbook. The production docker-compose (`docker/docker-compose.prod.yml`) runs PostgreSQL 17 Alpine with tuned WAL settings (`max_wal_size=2GB`) but no archiving configuration.

The work is straightforward: add a backup script, a cron-based sidecar container for scheduling, backup-related env vars, enhanced `manage.sh` commands, and a comprehensive `docs/docker/BACKUP.md` runbook. There is no new technology to learn — this uses standard PostgreSQL tooling (`pg_dump`, `pg_restore`, `pg_isready`) inside the existing Docker Compose infrastructure.

The indexer's database is re-derivable from the blockchain (the indexer can re-sync from block 0), so the backup strategy optimizes for **fast recovery** (avoid multi-day re-sync) rather than zero-data-loss (WAL archiving / PITR). A daily `pg_dump --format=custom` with configurable retention is the right tool for this use case.

## Recommendation

Use **scheduled `pg_dump` via a lightweight cron sidecar container** rather than WAL archiving. Rationale:

1. **Data is re-derivable** — the blockchain is the source of truth. A full re-sync from block 0 takes days but always produces correct data. Backups exist to avoid that multi-day downtime, not to prevent data loss.
2. **Simplicity** — `pg_dump --format=custom` produces compressed, portable backups. WAL archiving adds significant complexity (archive_command, wal_level=replica, recovery.conf, WAL storage) for a benefit (point-in-time recovery) this system doesn't need.
3. **Existing pattern** — `manage.sh` already has `db-dump` and `db-restore`. This slice enhances those commands and adds automation, not a fundamentally different approach.
4. **Docker-native** — a small Alpine + PostgreSQL client sidecar with crond is the standard pattern for scheduled tasks in Docker Compose. No host-level cron dependency.

Deliverables:
- `docker/backup.sh` — backup script with compression, retention, and verification
- `docker/restore.sh` — recovery script with safety checks and ordered steps
- Backup sidecar service added to `docker-compose.prod.yml`
- `manage.sh` backup commands enhanced (backup, backup-list, backup-verify, restore)
- `docs/docker/BACKUP.md` — complete backup/recovery runbook
- `.env.example` and `.env.prod.example` updated with backup configuration vars
- Indexer docs page updated with backup section

## Implementation Landscape

### Key Files

- `docker/docker-compose.prod.yml` — Add backup sidecar service + backup volume. Currently has 9 services (postgres, indexer, hasura, data-connector-agent, loki, prometheus, alloy, cadvisor, grafana) and 5 volumes. Needs a `backup` service and `backup-data` volume.
- `docker/docker-compose.yml` — Add same backup sidecar for dev compose (optional, but keeps parity).
- `docker/backup.sh` — **NEW**. Automated backup script: runs `pg_dump --format=custom`, compresses, timestamps filename, enforces retention (delete backups older than N days), verifies backup integrity with `pg_restore --list`, logs results.
- `docker/restore.sh` — **NEW**. Recovery script: stops indexer, stops Hasura, runs `pg_restore`, applies migrations if needed, restarts Hasura, restarts indexer. Interactive confirmation for destructive operations.
- `docker/manage.sh` — Enhance existing `cmd_db_dump` and `cmd_db_restore`. Add `cmd_backup` (trigger manual backup via the backup script), `cmd_backup_list` (list available backups with sizes/dates), `cmd_backup_verify` (test backup integrity), `cmd_backup_restore` (full recovery procedure).
- `docker/README.md` — Add backup section to the feature list and link to BACKUP.md.
- `docs/docker/BACKUP.md` — **NEW**. Complete runbook: backup strategy explanation, automated schedule configuration, manual backup procedure, recovery procedure (step-by-step), backup verification, retention policy, troubleshooting.
- `.env.example` — Add backup-related env vars (`BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`).
- `apps/test/src/app/docs/indexer/page.mdx` — Add database backup section per AGENTS.md documentation requirements.

### Existing Patterns to Follow

The `manage.sh` script at 350+ lines uses a consistent pattern:
- `cmd_` prefix function naming
- Color-coded logging (`log_info`, `log_success`, `log_warning`, `log_error`)
- Interactive confirmations for destructive operations (`read -p`)
- `check_env` for `.env` file validation
- `docker exec` for running commands inside containers

The existing `cmd_db_dump` is minimal (line ~215):
```bash
cmd_db_dump() {
  FILENAME="backup-$(date +%Y%m%d-%H%M%S).sql"
  log_info "Dumping database to $FILENAME..."
  docker exec lsp-indexer-postgres pg_dump -U postgres postgres > "$FILENAME"
  log_success "Database dumped to $FILENAME"
}
```
This outputs plain SQL to a local file. The enhanced version should use `pg_dump --format=custom` (compressed, supports parallel restore), write to a mounted backup volume, and verify the output.

The existing `cmd_db_restore` is also minimal (line ~227) — reads from stdin with `psql`. The enhanced version should use `pg_restore` for custom-format dumps and include the full service stop/start orchestration.

### Build Order

1. **Backup script first** (`docker/backup.sh`) — This is the core deliverable. Once it works standalone, everything else layers on top.
2. **Restore script** (`docker/restore.sh`) — The recovery procedure. Depends on backup script existing to test against.
3. **Docker Compose changes** — Add sidecar service + volume to both compose files. Depends on backup script being in place.
4. **manage.sh enhancements** — Wire the new scripts into the management CLI. Depends on scripts existing.
5. **Environment variables** — Add backup config vars to `.env.example` files. Depends on knowing what the scripts need.
6. **Documentation** — `docs/docker/BACKUP.md` + `docker/README.md` + indexer docs MDX page. Last, since it documents what was built.

### Environment Variables to Add

| Variable | Default | Purpose |
|----------|---------|---------|
| `BACKUP_SCHEDULE` | `0 2 * * *` | Cron expression for backup frequency (default: daily at 2 AM) |
| `BACKUP_RETENTION_DAYS` | `7` | Delete backups older than N days |
| `BACKUP_DIR` | `/backups` | Backup directory inside container (mounted volume) |
| `BACKUP_ENABLED` | `true` | Enable/disable the backup sidecar |

### Backup Sidecar Design

A minimal Alpine container with `postgresql17-client` and `crond`:
```yaml
backup:
  container_name: ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup
  image: postgres:17-alpine
  restart: unless-stopped
  depends_on:
    postgres:
      condition: service_healthy
  volumes:
    - backup-data:/backups
    - ./backup.sh:/backup.sh:ro
  environment:
    PGHOST: postgres
    PGUSER: ${POSTGRES_USER:-postgres}
    PGPASSWORD: ${POSTGRES_PASSWORD:?...}
    PGDATABASE: ${POSTGRES_DB:-postgres}
    BACKUP_RETENTION_DAYS: ${BACKUP_RETENTION_DAYS:-7}
  entrypoint: ["/bin/sh", "-c"]
  command:
    - |
      echo "${BACKUP_SCHEDULE:-0 2 * * *} /backup.sh" | crontab -
      crond -f -l 2
```

This reuses the same `postgres:17-alpine` image (already pulled for the main DB), so no additional image download. The script runs `pg_dump` over the Docker network to the `postgres` service.

### Recovery Procedure (Step-by-Step)

The `docs/docker/BACKUP.md` runbook will document:

1. **Stop the indexer** — prevent writes during restore
2. **Stop Hasura** — prevent metadata conflicts
3. **Drop and recreate the database** — clean slate
4. **Restore from backup** — `pg_restore --clean --if-exists --no-owner`
5. **Apply migrations** — in case backup is from an older schema version
6. **Restart Hasura** — re-apply metadata tracking
7. **Restart indexer** — resume processing from last indexed block
8. **Verify** — check entity counts, latest block number

### Verification Approach

Since there's no running PostgreSQL to test against in this environment, verification is structural:

1. `docker/backup.sh` exists, is executable, handles `pg_dump --format=custom`, retention cleanup, and integrity check
2. `docker/restore.sh` exists, is executable, includes service stop/start orchestration and safety confirmations
3. `docker-compose.prod.yml` has a `backup` service with correct volume mount and cron configuration
4. `manage.sh` has new backup commands (`backup`, `backup-list`, `backup-verify`, `backup-restore`) wired to the scripts
5. `.env.example` has all backup env vars documented
6. `docs/docker/BACKUP.md` covers strategy, automation, manual backup, recovery, verification, and troubleshooting
7. `apps/test/src/app/docs/indexer/page.mdx` has a backup section
8. Full monorepo build passes (`pnpm build`) — the MDX page must compile

## Constraints

- **PostgreSQL 17 Alpine** — the base image. Must use tools available in this image (`pg_dump`, `pg_restore`, `pg_isready`, `crond`). Alpine's crond is BusyBox-based (not vixie-cron).
- **Docker volume for backups** — backups must be on a named volume (not ephemeral container storage). Users may bind-mount this to a host path for off-server copies.
- **No external dependencies** — no cloud storage (S3, GCS), no external cron service. Everything runs within the Docker Compose stack. Users who want off-site backups can bind-mount the volume and sync externally.
- **Container naming** — follows existing `${COMPOSE_PROJECT_NAME:-lsp-indexer}-<service>` pattern.
- **Existing manage.sh db-dump/db-restore** — the simple `db-dump` and `db-restore` commands should remain for quick ad-hoc use. New backup commands are the production-grade alternative.

## Common Pitfalls

- **Plain SQL dump vs custom format** — `pg_dump` defaults to plain SQL which is uncompressed and slow to restore. Always use `--format=custom` for production backups (compressed, supports `pg_restore --jobs` for parallel restore, supports `--list` for integrity verification).
- **Backup during heavy writes** — `pg_dump` takes a consistent snapshot (uses a single transaction), so it's safe to run while the indexer is writing. No need to stop the indexer for routine backups.
- **Restore requires exclusive access** — unlike backup, restore IS destructive and requires stopping the indexer and Hasura first. The restore script must enforce this.
- **Alpine cron quirks** — BusyBox crond doesn't source `/etc/profile`. Environment variables must be passed explicitly to the cron job (either via `env` prefix or by writing a wrapper that sources them).
- **Backup volume vs database volume** — backups must be on a SEPARATE volume from `postgres-data`. If postgres-data is lost (disk failure), backups stored on the same volume are also lost.
