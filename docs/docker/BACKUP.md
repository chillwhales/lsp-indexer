# Database Backup & Recovery

The LSP Indexer stores blockchain-derived data in PostgreSQL. Because all data can be
re-derived from the LUKSO L1 chain, the backup strategy optimizes for **fast recovery**
rather than zero-data-loss. Daily `pg_dump` snapshots with a 7-day retention window give
you a quick restore path while keeping operational complexity low.

---

## Strategy

The indexer uses **`pg_dump --format=custom`** (compressed, custom-format dumps) instead
of WAL archiving or streaming replication. This choice is deliberate:

| Consideration       | pg_dump (chosen)                            | WAL archiving                              |
| -------------------- | ------------------------------------------- | ------------------------------------------ |
| Complexity           | Single command, no WAL config               | Requires `archive_command`, storage infra   |
| Recovery granularity | Point-in-time snapshots                     | Continuous point-in-time recovery           |
| Data nature          | Re-derivable from blockchain                | Designed for irreplaceable data             |
| Docker integration   | Works with existing Compose sidecar pattern | Needs shared volumes, custom PG config      |
| Storage              | ~50-200 MB per backup (compressed)          | WAL segments accumulate rapidly             |

Since the indexer can always re-sync from block 0 as a last resort, the simplicity and
reliability of `pg_dump` snapshots is the right trade-off.

---

## Automated Backups

The production Docker Compose stack (`docker-compose.prod.yml`) includes a **backup sidecar**
container that runs `pg_dump` on a cron schedule.

### How It Works

1. The `backup` service uses the same `postgres:17-alpine` image as the database (ensuring
   `pg_dump` version compatibility)
2. On startup, it installs a cron job from the `BACKUP_SCHEDULE` environment variable
3. Each cron execution runs `backup.sh`, which:
   - Waits for PostgreSQL readiness (`pg_isready`)
   - Runs `pg_dump --format=custom --compress=6`
   - Verifies backup integrity via `pg_restore --list`
   - Cleans up backups older than `BACKUP_RETENTION_DAYS`
4. All output is logged with `[BACKUP]` prefix and ISO-8601 timestamps (collected by
   Grafana Alloy → Loki)

### Configuration

Set these variables in your `.env.prod` file:

| Variable                | Default       | Description                                        |
| ----------------------- | ------------- | -------------------------------------------------- |
| `BACKUP_SCHEDULE`       | `0 2 * * *`   | Cron schedule (default: daily at 2 AM UTC)         |
| `BACKUP_RETENTION_DAYS` | `7`           | Days to keep backups before automatic deletion     |
| `BACKUP_DIR`            | `/backups`    | Backup directory inside the container              |
| `BACKUP_ENABLED`        | `true`        | Set to `false` to skip starting the backup sidecar |

**Schedule examples:**

```
0 2 * * *      # Daily at 2 AM UTC (default)
0 */6 * * *    # Every 6 hours
0 2 * * 0      # Weekly on Sunday at 2 AM UTC
*/30 * * * *   # Every 30 minutes (testing only)
```

### Disabling Automated Backups

Set `BACKUP_ENABLED=false` in your `.env.prod` and restart:

```bash
docker compose -f docker-compose.prod.yml --env-file ../.env.prod up -d
```

The backup container will not start.

---

## Manual Backup

Trigger a backup immediately without waiting for the cron schedule:

```bash
cd docker
./manage.sh backup
```

Example output:

```
[INFO] Running manual backup...
[BACKUP] 2026-03-17T02:00:00Z Waiting for PostgreSQL at postgres...
[BACKUP] 2026-03-17T02:00:00Z PostgreSQL is ready.
[BACKUP] 2026-03-17T02:00:00Z Starting backup → backup-20260317-020000.dump
[BACKUP] 2026-03-17T02:00:12Z Verifying backup integrity...
[BACKUP] 2026-03-17T02:00:13Z Backup complete: backup-20260317-020000.dump (156M, 13s)
[BACKUP] 2026-03-17T02:00:13Z Retention cleanup: no backups older than 7 days.
[BACKUP] 2026-03-17T02:00:13Z Done.
[SUCCESS] Manual backup complete
```

---

## Listing Backups

View all available backups with sizes:

```bash
./manage.sh backup-list
```

Example output:

```
[INFO] Available backups:
-rw-r--r--  1 root root 156M Mar 17 02:00 /backups/backup-20260317-020000.dump
-rw-r--r--  1 root root 148M Mar 16 02:00 /backups/backup-20260316-020000.dump
-rw-r--r--  1 root root 142M Mar 15 02:00 /backups/backup-20260315-020000.dump
```

---

## Verifying Backups

Check that a backup file is not corrupt and can be restored:

```bash
./manage.sh backup-verify backup-20260317-020000.dump
```

This runs `pg_restore --list` against the backup file, which parses the custom-format
archive and lists all objects (tables, indexes, constraints) without actually restoring.
If the file is corrupt or not a valid custom-format dump, this command fails.

---

## Recovery Procedure

The `manage.sh backup-restore` command orchestrates a full recovery. It stops dependent
services, restores the database, and restarts everything in the correct order.

```bash
./manage.sh backup-restore backup-20260317-020000.dump
```

### What Happens (Step by Step)

1. **Confirmation** — You must type `restore` to proceed (prevents accidental restores)

2. **Stop indexer** — Prevents new writes during restoration
   ```
   docker compose stop indexer
   ```

3. **Stop Hasura** — Prevents metadata conflicts during schema changes
   ```
   docker compose stop hasura data-connector-agent
   ```

4. **Restore database** — Runs `pg_restore` with these flags:
   - `--clean` — Drops existing objects before restoring
   - `--if-exists` — Avoids errors for objects that don't exist yet
   - `--no-owner` — Skips ownership changes (uses the connected user)
   - `--no-privileges` — Skips privilege grants
   ```
   pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$PGDATABASE <file>
   ```

5. **Restart Hasura** — Starts `data-connector-agent` first, then `hasura`, waits 10s for
   health checks to pass

6. **Restart indexer** — Resumes from the last indexed block stored in the database
   (the Subsquid processor tracks its cursor in the `status` table)

7. **Verify** — Check that everything is healthy:
   ```bash
   ./manage.sh health
   ```

### Post-Recovery Verification

After a restore, verify data integrity:

```bash
# Check service health
./manage.sh health

# Verify entity counts (should match pre-backup values)
./manage.sh db-query 'SELECT count(*) FROM transfer;'
./manage.sh db-query 'SELECT count(*) FROM profile;'
./manage.sh db-query 'SELECT count(*) FROM digital_asset;'

# Check indexer progress (should resume from restored block)
docker compose -f docker-compose.prod.yml --env-file ../.env.prod logs --tail=20 indexer
```

---

## Retention Policy

- **Default**: 7 days — the backup sidecar automatically deletes `.dump` files older than
  `BACKUP_RETENTION_DAYS` after each successful backup
- **Change**: Set `BACKUP_RETENTION_DAYS` in your `.env.prod` file
- **Storage estimate**: Each backup is typically 50–200 MB (depending on indexed data volume).
  With a 7-day daily schedule, expect ~350 MB – 1.4 GB total backup storage.

---

## Troubleshooting

| Problem                | Cause                                  | Solution                                                              |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| No backups found       | Sidecar not running / volume not mounted | Check `docker ps`, verify `backup-data` volume exists                |
| Backup failed          | PostgreSQL not ready / disk full       | Check postgres health (`./manage.sh health`), check disk space        |
| Restore failed         | Backup file corrupt / wrong format     | Run `./manage.sh backup-verify <file>`, ensure `.dump` format         |
| Services won't restart | Port conflicts / config errors         | Check `docker logs <container>`, run `./manage.sh health`             |
| Cron not running       | Schedule syntax error                  | Check `docker exec <backup-container> crontab -l` for the active schedule |

### Viewing Backup Logs

```bash
# All backup container logs
docker logs ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup

# Filter for errors only
docker logs ${COMPOSE_PROJECT_NAME:-lsp-indexer}-backup 2>&1 | grep 'ERROR'

# Via Grafana/Loki (if monitoring stack is running)
# Query: {container_name=~".*backup.*"} |= "[BACKUP]"
```

---

## Off-site Backups

The `backup-data` Docker volume stores backups inside the container runtime. To copy
backups off-server, bind-mount the volume to a host path and use external tools.

### Bind-mount Override

Add a volume override in your compose file or a `docker-compose.override.yml`:

```yaml
volumes:
  backup-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/host/backups
```

Then use standard tools to sync backups off-server:

```bash
# rsync to remote server
rsync -avz /path/to/host/backups/ user@remote:/backups/lsp-indexer/

# rclone to S3-compatible storage
rclone sync /path/to/host/backups/ s3:my-bucket/lsp-indexer-backups/
```

---

## Full Re-sync Alternative

As a last resort — if no backup is available or the backup is corrupt — you can drop the
database and let the indexer re-sync from block 0:

```bash
cd docker
./manage.sh db-reset
```

This is a **complete data recovery** because all indexed data is derived from on-chain events.
The trade-off is time: a full re-sync from genesis takes **multiple days** depending on RPC
speed and hardware. Use this only when backup-based recovery is not possible.
