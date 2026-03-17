---
estimated_steps: 4
estimated_files: 3
---

# T03: Write backup runbook documentation and update indexer docs page

**Slice:** S30 — Database Operations — Backup strategy, automation, and recovery procedure
**Milestone:** M001

## Description

Create the comprehensive backup/recovery runbook at `docs/docker/BACKUP.md`, update `docker/README.md` to reference it, and add a "Database Backup & Recovery" section to the indexer docs MDX page. This task satisfies OPS-01 (strategy documented), OPS-03 (recovery procedure documented), and the AGENTS.md requirement for indexer docs page updates.

**Relevant skill:** The `lint` skill may help if Prettier formatting is needed. The indexer docs page is an MDX file that must compile with `pnpm build`.

## Steps

1. **Create `docs/docker/BACKUP.md`** — Complete runbook with these sections:
   - **Header**: `# Database Backup & Recovery` with a brief intro paragraph explaining the strategy (re-derivable data → optimize for fast recovery, not zero-data-loss)
   - **Strategy**: Explain why `pg_dump --format=custom` over WAL archiving (data is re-derivable from blockchain, simplicity, existing Docker Compose pattern)
   - **Automated Backups**: How the backup sidecar works (cron schedule, retention, Docker volume), how to configure schedule via `BACKUP_SCHEDULE` env var, how to disable via `BACKUP_ENABLED=false`
   - **Manual Backup**: `./manage.sh backup` command with example output
   - **Listing Backups**: `./manage.sh backup-list` command
   - **Verifying Backups**: `./manage.sh backup-verify <filename>` command — explain what `pg_restore --list` checks
   - **Recovery Procedure**: Step-by-step walkthrough matching the `manage.sh backup-restore` flow:
     1. Stop the indexer (prevent writes)
     2. Stop Hasura (prevent metadata conflicts)
     3. Restore from backup (`pg_restore --clean --if-exists --no-owner`)
     4. Restart Hasura (re-apply metadata tracking)
     5. Restart indexer (resume from last indexed block)
     6. Verify (check health, entity counts)
   - **Retention Policy**: Default 7 days, how to change, storage size estimation
   - **Troubleshooting**: Common issues table:
     | Problem | Cause | Solution |
     | --- | --- | --- |
     | No backups found | Sidecar not running / volume not mounted | Check `docker ps`, verify backup-data volume |
     | Backup failed | PostgreSQL not ready / disk full | Check postgres health, check disk space |
     | Restore failed | Backup file corrupt / wrong format | Run `./manage.sh backup-verify`, ensure .dump format |
     | Services won't restart | Port conflicts / config errors | Check `docker logs`, run `./manage.sh health` |
   - **Off-site Backups**: Note that users can bind-mount the `backup-data` volume to a host path and use external tools (rsync, rclone, etc.) to copy backups off-server. Provide the docker-compose volume override example from the existing compose comments.
   - **Full Re-sync Alternative**: Note that as a last resort, dropping the database and letting the indexer re-sync from block 0 is always an option (takes multiple days but produces correct data)

2. **Update `docker/README.md`:**
   - Add `**`backup.sh`**` and `**`restore.sh`**` entries to the Files list (after `entrypoint.sh`)
   - Add `- [BACKUP.md](../docs/docker/BACKUP.md) — Backup strategy and recovery runbook` to the Documentation section at the bottom
   - Add a "Backup" section to Management Commands showing the 4 new commands

3. **Add backup section to `apps/test/src/app/docs/indexer/page.mdx`:**
   - Insert a `## Database Backup & Recovery` section before the existing `## Next Steps` section (which is the last section)
   - Content should include:
     - Brief strategy explanation (daily `pg_dump`, 7-day retention, configurable)
     - Table of backup-related env vars: `BACKUP_SCHEDULE`, `BACKUP_RETENTION_DAYS`, `BACKUP_DIR`, `BACKUP_ENABLED`
     - Key management commands: `backup`, `backup-list`, `backup-verify`, `backup-restore`
     - Link to full runbook: "For complete recovery procedures, see the [backup runbook](https://github.com/chillwhales/lsp-indexer/blob/main/docs/docker/BACKUP.md)"
   - **Important**: This is MDX, not plain markdown. Do not use JSX components not already imported. Standard markdown (headings, tables, code blocks, links) is safe. Check the top of the file for any imports — match the existing pattern.

4. **Run `pnpm build`** — Verify the full monorepo builds, which proves the MDX page compiles correctly.

## Must-Haves

- [ ] `docs/docker/BACKUP.md` exists with strategy, automation, manual backup, recovery procedure, retention, and troubleshooting sections
- [ ] `docker/README.md` references backup.sh, restore.sh, and BACKUP.md
- [ ] `apps/test/src/app/docs/indexer/page.mdx` has a "Database Backup & Recovery" section
- [ ] `pnpm build` passes (MDX compiles)

## Verification

- `test -f docs/docker/BACKUP.md` — runbook exists
- `grep -q 'Recovery Procedure' docs/docker/BACKUP.md` — has recovery section
- `grep -q 'Troubleshooting' docs/docker/BACKUP.md` — has troubleshooting section
- `grep -q 'backup.sh' docker/README.md` — README references backup script
- `grep -q 'BACKUP.md' docker/README.md` — README links to runbook
- `grep -q 'Backup' apps/test/src/app/docs/indexer/page.mdx` — MDX has backup section
- `pnpm build` exits 0 — full monorepo builds (MDX page compiles)

## Inputs

- `docker/backup.sh` — created in T01, provides the backup script details to document
- `docker/restore.sh` — created in T01, provides the restore procedure to document
- `docker/manage.sh` — updated in T02, provides the management commands to document
- `.env.example` — updated in T02, provides the env vars to document
- `docker/docker-compose.prod.yml` — updated in T02, provides the sidecar configuration to document
- `docs/docker/BACKUP.md` — does NOT exist yet (created in this task)
- `docker/README.md` — existing file (~100 lines) with Files list, Features, Quick Start, Management Commands, Documentation sections
- `apps/test/src/app/docs/indexer/page.mdx` — existing file (180 lines) with sections through "Next Steps"

## Expected Output

- `docs/docker/BACKUP.md` — new file (~150-200 lines) with complete backup/recovery runbook
- `docker/README.md` — updated with backup script entries, BACKUP.md link, and backup management commands
- `apps/test/src/app/docs/indexer/page.mdx` — updated with "Database Backup & Recovery" section (~30-40 lines added before "Next Steps")
