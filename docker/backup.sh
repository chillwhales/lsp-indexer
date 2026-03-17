#!/bin/sh
# shellcheck shell=sh
# ---------------------------------------------------------------------------
# docker/backup.sh — Automated PostgreSQL backup with pg_dump
#
# Produces a compressed custom-format dump, verifies integrity via
# pg_restore --list, and cleans up old backups based on retention policy.
#
# Environment variables:
#   BACKUP_DIR             — directory to store backups (default: /backups)
#   BACKUP_RETENTION_DAYS  — days to keep backups (default: 7)
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE — standard PostgreSQL client vars
#
# All log output uses [BACKUP] prefix with ISO-8601 timestamps for Loki.
# ---------------------------------------------------------------------------

set -eu

# ---- Helpers ---------------------------------------------------------------

log() {
  echo "[BACKUP] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

log_error() {
  echo "[BACKUP] $(date -u +%Y-%m-%dT%H:%M:%SZ) ERROR: $*" >&2
}

show_help() {
  cat <<'EOF'
Usage: backup.sh [--help]

Creates a compressed PostgreSQL backup using pg_dump --format=custom.
The backup file is verified with pg_restore --list after creation.
Old backups are cleaned up based on BACKUP_RETENTION_DAYS.

Environment variables:
  BACKUP_DIR             Directory to store backups (default: /backups)
  BACKUP_RETENTION_DAYS  Days to keep backups before deletion (default: 7)
  PGHOST                 PostgreSQL host (required)
  PGUSER                 PostgreSQL user (default: postgres)
  PGPASSWORD             PostgreSQL password (required)
  PGDATABASE             PostgreSQL database (default: postgres)
EOF
  exit 0
}

# ---- Parse arguments -------------------------------------------------------

case "${1:-}" in
  --help|-h) show_help ;;
esac

# ---- Configuration ---------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-postgres}"

# ---- Validate required env vars -------------------------------------------

if [ -z "${PGHOST:-}" ]; then
  log_error "PGHOST is not set. Set the PostgreSQL host and try again."
  exit 1
fi

if [ -z "${PGPASSWORD:-}" ]; then
  log_error "PGPASSWORD is not set. Set the PostgreSQL password and try again."
  exit 1
fi

# ---- Ensure backup directory exists ----------------------------------------

mkdir -p "$BACKUP_DIR"

# ---- Wait for PostgreSQL readiness ----------------------------------------

log "Waiting for PostgreSQL at ${PGHOST}..."
READY_TIMEOUT=30
READY_ELAPSED=0
while ! pg_isready -h "$PGHOST" -U "$PGUSER" -q 2>/dev/null; do
  READY_ELAPSED=$((READY_ELAPSED + 2))
  if [ "$READY_ELAPSED" -ge "$READY_TIMEOUT" ]; then
    log_error "PostgreSQL not ready after ${READY_TIMEOUT}s — aborting."
    exit 1
  fi
  sleep 2
done
log "PostgreSQL is ready."

# ---- Run pg_dump -----------------------------------------------------------

FILENAME="backup-$(date -u +%Y%m%d-%H%M%S).dump"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
START_TS=$(date +%s)

log "Starting backup → ${FILENAME}"

if ! pg_dump --format=custom --compress=6 --file="$FILEPATH" \
     -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"; then
  log_error "pg_dump failed."
  rm -f "$FILEPATH"
  exit 1
fi

# ---- Verify backup integrity ----------------------------------------------

log "Verifying backup integrity..."
if ! pg_restore --list "$FILEPATH" > /dev/null 2>&1; then
  log_error "Integrity check failed for ${FILENAME} — deleting corrupt file."
  rm -f "$FILEPATH"
  exit 1
fi

# ---- Log success -----------------------------------------------------------

END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))
# shellcheck disable=SC2012
FILE_SIZE=$(ls -lh "$FILEPATH" | awk '{print $5}')

log "Backup complete: ${FILENAME} (${FILE_SIZE}, ${DURATION}s)"

# ---- Retention cleanup -----------------------------------------------------

BEFORE_COUNT=$(find "$BACKUP_DIR" -name "backup-*.dump" -mtime +"$BACKUP_RETENTION_DAYS" 2>/dev/null | wc -l)
find "$BACKUP_DIR" -name "backup-*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -exec rm -f {} +
DELETED_COUNT=$((BEFORE_COUNT))

if [ "$DELETED_COUNT" -gt 0 ]; then
  log "Retention cleanup: removed ${DELETED_COUNT} backup(s) older than ${BACKUP_RETENTION_DAYS} days."
else
  log "Retention cleanup: no backups older than ${BACKUP_RETENTION_DAYS} days."
fi

log "Done."
