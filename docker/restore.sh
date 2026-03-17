#!/bin/sh
# shellcheck shell=sh
# ---------------------------------------------------------------------------
# docker/restore.sh — PostgreSQL database restore from a pg_dump backup
#
# Restores a custom-format backup produced by backup.sh. Drops and recreates
# the target database before restoring. Requires interactive confirmation
# before proceeding with the destructive operation.
#
# Usage: restore.sh <backup-filename>
#
# Note: The caller (manage.sh) handles stopping/starting the indexer and
# Hasura services — this script only performs database operations.
#
# Environment variables:
#   BACKUP_DIR   — directory containing backups (default: /backups)
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE — standard PostgreSQL client vars
#
# All log output uses [RESTORE] prefix with ISO-8601 timestamps for Loki.
# ---------------------------------------------------------------------------

set -eu

# ---- Helpers ---------------------------------------------------------------

log() {
  echo "[RESTORE] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"
}

log_error() {
  echo "[RESTORE] $(date -u +%Y-%m-%dT%H:%M:%SZ) ERROR: $*" >&2
}

show_help() {
  cat <<'EOF'
Usage: restore.sh [--help] <backup-filename>

Restores a PostgreSQL database from a custom-format backup file.
WARNING: This drops and recreates the target database.

Arguments:
  backup-filename  Name of the backup file in BACKUP_DIR (e.g. backup-20260101-120000.dump)

Environment variables:
  BACKUP_DIR   Directory containing backups (default: /backups)
  PGHOST       PostgreSQL host (required)
  PGUSER       PostgreSQL user (default: postgres)
  PGPASSWORD   PostgreSQL password (required)
  PGDATABASE   PostgreSQL database (default: postgres)
EOF
  exit 0
}

# ---- Parse arguments -------------------------------------------------------

case "${1:-}" in
  --help|-h) show_help ;;
esac

# ---- Configuration ---------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-/backups}"
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

# ---- Validate argument -----------------------------------------------------

if [ -z "${1:-}" ]; then
  log_error "No backup filename provided."
  echo ""
  echo "Available backups in ${BACKUP_DIR}:"
  echo "-----------------------------------------------"
  if [ -d "$BACKUP_DIR" ]; then
    # shellcheck disable=SC2012
    ls -lhtr "${BACKUP_DIR}"/backup-*.dump 2>/dev/null | awk '{print $5, $6, $7, $8, $NF}' || echo "  (none)"
  else
    echo "  (backup directory does not exist)"
  fi
  echo ""
  echo "Usage: restore.sh <backup-filename>"
  exit 1
fi

FILENAME="$1"

# Resolve full path — accept either a bare filename or an absolute path
case "$FILENAME" in
  /*) FILEPATH="$FILENAME" ;;
  *)  FILEPATH="${BACKUP_DIR}/${FILENAME}" ;;
esac

if [ ! -f "$FILEPATH" ]; then
  log_error "Backup file not found: ${FILEPATH}"
  exit 1
fi

# ---- Step 1: Verify backup integrity --------------------------------------

log "Step 1/4: Verifying backup integrity — ${FILENAME}"
if ! pg_restore --list "$FILEPATH" > /dev/null 2>&1; then
  log_error "Integrity check failed for ${FILENAME}. File may be corrupt."
  exit 1
fi
log "Integrity check passed."

# ---- Interactive confirmation ----------------------------------------------

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  WARNING: DESTRUCTIVE OPERATION                             ║"
echo "║                                                             ║"
printf "║  This will DESTROY the current database %-21s ║\n" "'${PGDATABASE}'"
echo "║  and replace it with the backup:                            ║"
printf "║  %-58s ║\n" "${FILENAME}"
echo "║                                                             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
printf "Type 'restore' to confirm: "
read -r CONFIRM

if [ "$CONFIRM" != "restore" ]; then
  log "Restore cancelled by user (got '${CONFIRM}', expected 'restore')."
  exit 1
fi

# ---- Step 2: Drop and recreate database -----------------------------------

START_TS=$(date +%s)

log "Step 2/4: Dropping database '${PGDATABASE}'..."
if ! dropdb --if-exists --maintenance-db=template1 -h "$PGHOST" -U "$PGUSER" "$PGDATABASE"; then
  log_error "Failed to drop database '${PGDATABASE}'."
  exit 1
fi

log "Step 3/4: Creating database '${PGDATABASE}'..."
if ! createdb --maintenance-db=template1 -h "$PGHOST" -U "$PGUSER" "$PGDATABASE"; then
  log_error "Failed to create database '${PGDATABASE}'."
  exit 1
fi

# ---- Step 3: Restore from backup ------------------------------------------

log "Step 4/4: Restoring from ${FILENAME}..."
if ! pg_restore --no-owner --no-privileges \
     -h "$PGHOST" -U "$PGUSER" --dbname="$PGDATABASE" "$FILEPATH"; then
  log_error "pg_restore failed. Database may be in an inconsistent state."
  exit 1
fi

# ---- Step 4: Log success ---------------------------------------------------

END_TS=$(date +%s)
DURATION=$((END_TS - START_TS))

log "Restore complete from ${FILENAME} (${DURATION}s)."
log "Done."
