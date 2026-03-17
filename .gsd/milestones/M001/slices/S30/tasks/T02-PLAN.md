---
estimated_steps: 5
estimated_files: 3
---

# T02: Wire backup sidecar into Docker Compose and manage.sh

**Slice:** S30 — Database Operations — Backup strategy, automation, and recovery procedure
**Milestone:** M001

## Description

Connect the backup/restore scripts (from T01) to the production infrastructure. Add a backup sidecar container to the production Docker Compose file that runs `crond` with the backup script on a configurable schedule. Add four new management commands to `manage.sh`. Document the new environment variables in `.env.example`.

## Steps

1. **Add backup sidecar service to `docker/docker-compose.prod.yml`:**
   - Insert a `backup` service after the `grafana` service and before the `volumes:` section
   - Service definition:
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
         PGPASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env.prod}
         PGDATABASE: ${POSTGRES_DB:-postgres}
         BACKUP_DIR: ${BACKUP_DIR:-/backups}
         BACKUP_RETENTION_DAYS: ${BACKUP_RETENTION_DAYS:-7}
       entrypoint: ["/bin/sh", "-c"]
       command:
         - |
           echo "${BACKUP_SCHEDULE:-0 2 * * *} /backup.sh" | crontab -
           crond -f -l 2
       logging:
         driver: 'json-file'
         options:
           max-size: '10m'
           max-file: '3'
       deploy:
         resources:
           limits:
             memory: 256M
           reservations:
             memory: 64M
     ```
   - Add a section comment block above the service matching the existing pattern: `# Backup — Automated PostgreSQL Backups`
   - Add `backup-data` volume to the `volumes:` section at the bottom with a descriptive comment

2. **Add four new commands to `docker/manage.sh`:**
   - `cmd_backup()` — Trigger a manual backup by running the backup script inside the postgres container:
     ```bash
     cmd_backup() {
       log_info "Running manual backup..."
       docker exec ${COMPOSE_PROJECT_NAME:-lsp-indexer}-postgres sh -c \
         "PGHOST=localhost PGUSER=\${POSTGRES_USER:-postgres} PGPASSWORD=\${POSTGRES_PASSWORD} PGDATABASE=\${POSTGRES_DB:-postgres} BACKUP_DIR=/backups BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7} sh /backups/backup.sh"
     }
     ```
     **Important correction**: The manual backup runs in the **backup container** (not postgres), since that's where the script is mounted. Use:
     ```bash
     cmd_backup() {
       log_info "Running manual backup..."
       docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup /backup.sh
       log_success "Manual backup complete"
     }
     ```
   - `cmd_backup_list()` — List available backups:
     ```bash
     cmd_backup_list() {
       log_info "Available backups:"
       docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
         'ls -lhS ${BACKUP_DIR:-/backups}/backup-*.dump 2>/dev/null || echo "No backups found"'
     }
     ```
   - `cmd_backup_verify()` — Verify a specific backup's integrity:
     ```bash
     cmd_backup_verify() {
       local FILE="${1:?Usage: ./manage.sh backup-verify <filename>}"
       log_info "Verifying backup: $FILE..."
       docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
         "pg_restore --list ${BACKUP_DIR:-/backups}/$FILE > /dev/null"
       log_success "Backup verified: $FILE"
     }
     ```
   - `cmd_backup_restore()` — Full recovery procedure wrapper. This command handles the service orchestration that `restore.sh` doesn't:
     ```bash
     cmd_backup_restore() {
       local FILE="${1:?Usage: ./manage.sh backup-restore <filename>}"
       COMPOSE_OPTS=$(get_compose_opts)

       log_warning "FULL RECOVERY PROCEDURE"
       log_warning "This will stop services and restore from: $FILE"
       read -p "Type 'restore' to confirm: " CONFIRM
       if [ "$CONFIRM" != "restore" ]; then
         log_info "Cancelled"
         return
       fi

       log_info "Step 1: Stopping indexer..."
       docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS stop indexer

       log_info "Step 2: Stopping Hasura..."
       docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS stop hasura data-connector-agent

       log_info "Step 3: Restoring database..."
       docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
         "pg_restore --clean --if-exists --no-owner --no-privileges --dbname=\$PGDATABASE ${BACKUP_DIR:-/backups}/$FILE"

       log_info "Step 4: Restarting Hasura..."
       docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS start data-connector-agent hasura

       log_info "Step 5: Waiting for Hasura health..."
       sleep 10

       log_info "Step 6: Restarting indexer..."
       docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS start indexer

       log_success "Recovery complete. Verify: ./manage.sh health"
     }
     ```
   - Add all four commands to the case dispatcher at the bottom of the file
   - Add all four commands to the `cmd_help()` function under a new "Backup" section

3. **Update `.env.example`** — Add a `# --- Backup ---` section at the end with:
   ```
   # --- Backup ---

   # Cron schedule for automated backups (default: daily at 2 AM UTC)
   # Format: minute hour day month weekday
   # Examples: "0 2 * * *" (daily 2AM), "0 */6 * * *" (every 6 hours)
   BACKUP_SCHEDULE=0 2 * * *

   # Delete backups older than N days (default: 7)
   BACKUP_RETENTION_DAYS=7

   # Backup directory inside container (mounted to backup-data volume)
   # Default: /backups
   BACKUP_DIR=/backups

   # Enable/disable the backup sidecar (default: true)
   # Set to false to skip starting the backup container
   BACKUP_ENABLED=true
   ```

4. **Validate the compose file** — Run `docker compose -f docker/docker-compose.prod.yml config --quiet` (it will warn about missing env vars but should not error on YAML structure)

5. **Verify manage.sh syntax** — Run `bash -n docker/manage.sh`

## Must-Haves

- [ ] `docker-compose.prod.yml` has a `backup` service with cron entrypoint
- [ ] `docker-compose.prod.yml` has a `backup-data` volume
- [ ] `manage.sh` has `backup`, `backup-list`, `backup-verify`, `backup-restore` commands
- [ ] All four commands in case dispatcher + help text
- [ ] `.env.example` has `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, `BACKUP_ENABLED`
- [ ] Compose file validates (YAML structure correct)
- [ ] `manage.sh` passes `bash -n` syntax check

## Verification

- `docker compose -f docker/docker-compose.prod.yml config 2>&1 | grep -q 'backup'` — backup service exists in compose
- `grep -c 'backup' docker/manage.sh | awk '{print ($1 >= 4) ? "pass" : "fail"}'` — at least 4 mentions of backup commands
- `grep -q 'BACKUP_SCHEDULE' .env.example` — env var documented
- `grep -q 'backup-data' docker/docker-compose.prod.yml` — backup volume present
- `bash -n docker/manage.sh` — syntax valid

## Inputs

- `docker/backup.sh` — created in T01, mounted into the backup sidecar container at `/backup.sh:ro`
- `docker/restore.sh` — created in T01, used by manage.sh backup-restore command for reference
- `docker/docker-compose.prod.yml` — existing 9-service production compose with 5 volumes
- `docker/manage.sh` — existing 350+ line management script with `cmd_` function pattern
- `.env.example` — existing env var template at repo root

## Observability Impact

- **New runtime signals:** Backup sidecar container emits `[BACKUP]`-prefixed log lines via Docker json-file driver → Alloy → Loki pipeline. Cron execution history visible in `docker logs <backup-container>`.
- **New inspection surfaces:** `./manage.sh backup-list` lists backup files with sizes/dates. `./manage.sh backup-verify <file>` re-runs integrity verification on demand. `docker exec <backup-container> crontab -l` shows the active cron schedule.
- **Failure visibility:** Backup sidecar restarts on crash (`unless-stopped`). Cron failures are logged with `[BACKUP] ERROR` prefix and exit code 1. `./manage.sh health` does not yet check backup sidecar health (future enhancement).
- **Diagnostic commands:** `docker logs ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup` — cron execution history and backup script output. `docker exec ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup ls -lhS /backups/` — list backup files directly.

## Expected Output

- `docker/docker-compose.prod.yml` — updated with backup service (10th service) and backup-data volume (6th volume)
- `docker/manage.sh` — updated with 4 new backup commands, case dispatcher entries, and help text
- `.env.example` — updated with backup configuration section
