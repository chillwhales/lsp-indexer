#!/bin/bash

# ==============================================================================
# Docker Management Script for Indexer
# ==============================================================================
# Convenient wrapper for common Docker operations
# Usage: ./manage.sh [command]
# ==============================================================================

set -e

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="lsp-indexer"
ENV_FILE="../.env"

# Safely read a value from .env without executing it
read_env_value() {
  local key="$1"
  local default="${2:-}"
  
  if [ -f "$ENV_FILE" ]; then
    # Grep for the key, take last occurrence, extract value after =
    local value
    value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2-)
    # Strip quotes and whitespace
    value=$(echo "$value" | tr -d ' \t' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    echo "${value:-$default}"
  else
    echo "$default"
  fi
}

# Check if Hasura should be enabled
get_compose_profiles() {
  local enable_hasura
  enable_hasura=$(read_env_value "ENABLE_HASURA" "false")
  
  if [ "$enable_hasura" = "true" ]; then
    echo "--profile hasura"
  else
    echo ""
  fi
}

# Get common docker compose options
get_compose_opts() {
  echo "--env-file $ENV_FILE"
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    log_warning ".env file not found at $ENV_FILE"
    log_info "Creating from .env.example..."
    cp ../.env.example "$ENV_FILE"
    log_warning "Please edit $ENV_FILE with your configuration before starting"
    exit 1
  fi
}

# Command functions
cmd_start() {
  check_env
  PROFILES=$(get_compose_profiles)
  COMPOSE_OPTS=$(get_compose_opts)
  
  if [ -n "$PROFILES" ]; then
    log_info "Starting services with Hasura enabled..."
  else
    log_info "Starting services (Hasura disabled)..."
  fi
  
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS $PROFILES up -d
  log_success "Services started"
  
  if [ -n "$PROFILES" ]; then
    local hasura_port
    hasura_port=$(read_env_value "HASURA_GRAPHQL_PORT" "8080")
    log_info "Hasura console: http://localhost:${hasura_port}"
    log_info "Hasura admin secret: check .env HASURA_GRAPHQL_ADMIN_SECRET"
  fi
  
  log_info "View logs: ./manage.sh logs"
  log_info "Check status: ./manage.sh status"
}

cmd_stop() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_info "Stopping services..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS stop
  log_success "Services stopped"
}

cmd_restart() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_info "Restarting services..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS restart
  log_success "Services restarted"
}

cmd_down() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_warning "Stopping and removing containers (volumes preserved)..."
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # shellcheck disable=SC2086
    docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS down
    log_success "Containers removed"
  else
    log_info "Cancelled"
  fi
}

cmd_logs() {
  SERVICE="${1:-indexer}"
  TAIL="${2:-100}"
  COMPOSE_OPTS=$(get_compose_opts)
  
  # shellcheck disable=SC2086
  if [ "$TAIL" == "all" ]; then
    docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS logs -f "$SERVICE"
  else
    docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS logs -f --tail="$TAIL" "$SERVICE"
  fi
}

cmd_status() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_info "Service status:"
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS ps
  echo
  log_info "Resource usage:"
  docker stats --no-stream lsp-indexer lsp-indexer-postgres 2>/dev/null || log_warning "Containers not running"
}

cmd_build() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_info "Building indexer image..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS build --no-cache indexer
  log_success "Build complete"
}

cmd_rebuild() {
  COMPOSE_OPTS=$(get_compose_opts)
  PROFILES=$(get_compose_profiles)
  log_info "Rebuilding and restarting..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS $PROFILES up -d --build --force-recreate indexer
  log_success "Rebuild complete"
}

cmd_shell() {
  SERVICE="${1:-indexer}"
  log_info "Opening shell in $SERVICE..."
  docker exec -it "lsp-$SERVICE" sh
}

cmd_db() {
  log_info "Connecting to PostgreSQL..."
  docker exec -it lsp-indexer-postgres psql -U postgres -d postgres
}

cmd_db_query() {
  QUERY="$1"
  if [ -z "$QUERY" ]; then
    log_error "Usage: ./manage.sh db-query 'SELECT count(*) FROM transfer;'"
    exit 1
  fi
  docker exec lsp-indexer-postgres psql -U postgres -d postgres -c "$QUERY"
}

cmd_db_dump() {
  FILENAME="backup-$(date +%Y%m%d-%H%M%S).sql"
  log_info "Dumping database to $FILENAME..."
  docker exec lsp-indexer-postgres pg_dump -U postgres postgres > "$FILENAME"
  log_success "Database dumped to $FILENAME"
}

cmd_db_restore() {
  FILENAME="$1"
  if [ -z "$FILENAME" ]; then
    log_error "Usage: ./manage.sh db-restore backup.sql"
    exit 1
  fi
  
  log_warning "This will restore database from $FILENAME"
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Restoring database..."
    docker exec -i lsp-indexer-postgres psql -U postgres -d postgres < "$FILENAME"
    log_success "Database restored"
  else
    log_info "Cancelled"
  fi
}

cmd_db_reset() {
  log_error "WARNING: This will DELETE ALL DATA!"
  read -p "Type 'reset' to confirm: " CONFIRM
  
  if [ "$CONFIRM" != "reset" ]; then
    log_info "Cancelled"
    exit 0
  fi
  
  log_info "Stopping indexer..."
  docker compose -f "$COMPOSE_FILE" stop indexer
  
  log_info "Dropping database..."
  docker exec lsp-indexer-postgres psql -U postgres -c "DROP DATABASE postgres;"
  
  log_info "Creating database..."
  docker exec lsp-indexer-postgres psql -U postgres -c "CREATE DATABASE postgres;"
  
  log_info "Restarting indexer..."
  docker compose -f "$COMPOSE_FILE" start indexer
  
  log_success "Database reset complete"
}

cmd_logs_export() {
  DEST="${1:-./exported-logs}"
  log_info "Exporting logs to $DEST..."
  mkdir -p "$DEST"
  docker cp lsp-indexer:/app/packages/indexer/logs/. "$DEST/"
  log_success "Logs exported to $DEST"
}

cmd_logs_cleanup() {
  DAYS="${1:-7}"
  log_info "Removing logs older than $DAYS days..."
  docker exec lsp-indexer find /app/packages/indexer/logs -name "*.log" -mtime +"$DAYS" -delete
  log_success "Old logs removed"
}

cmd_health() {
  log_info "Health check results:"
  echo
  
  # Indexer health
  if docker exec lsp-indexer pgrep -f "ts-node.*lib/app/index.js" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Indexer process running"
  else
    echo -e "${RED}✗${NC} Indexer process NOT running"
  fi
  
  # Postgres health
  if docker exec lsp-indexer-postgres pg_isready -U postgres -d postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL accepting connections"
  else
    echo -e "${RED}✗${NC} PostgreSQL NOT ready"
  fi
  
  # Hasura health (if enabled)
  if docker ps --format '{{.Names}}' | grep -q "lsp-indexer-hasura"; then
    local hasura_port
    hasura_port=$(read_env_value "HASURA_GRAPHQL_PORT" "8080")
    
    if curl -sf "http://localhost:${hasura_port}/healthz" > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Hasura GraphQL responding"
    else
      echo -e "${RED}✗${NC} Hasura GraphQL NOT responding"
    fi
  fi
  
  # Container health
  INDEXER_HEALTH=$(docker inspect lsp-indexer --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  POSTGRES_HEALTH=$(docker inspect lsp-indexer-postgres --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  HASURA_HEALTH=$(docker inspect lsp-indexer-hasura --format='{{.State.Health.Status}}' 2>/dev/null || echo "not running")
  
  echo
  echo "Container health status:"
  echo "  indexer:    $INDEXER_HEALTH"
  echo "  postgres:   $POSTGRES_HEALTH"
  if [ "$HASURA_HEALTH" != "not running" ]; then
    echo "  hasura:     $HASURA_HEALTH"
  fi
}

cmd_volumes() {
  log_info "Volume information:"
  docker volume ls | grep "$PROJECT_NAME" || log_warning "No volumes found"
  echo
  
  log_info "Volume sizes:"
  docker volume inspect "${PROJECT_NAME}_postgres-data" --format='{{.Mountpoint}}' | xargs du -sh 2>/dev/null || echo "postgres-data: unknown"
  docker volume inspect "${PROJECT_NAME}_indexer-logs" --format='{{.Mountpoint}}' | xargs du -sh 2>/dev/null || echo "indexer-logs: unknown"
}

cmd_stats() {
  log_info "Real-time container statistics (press Ctrl+C to exit)..."
  docker stats lsp-indexer lsp-indexer-postgres
}

cmd_env() {
  log_info "Environment variables (indexer):"
  docker exec lsp-indexer env | grep -E "(DB_URL|RPC_URL|LOG_|NODE_ENV|FETCH_|METADATA_)" | sort
}

cmd_clean() {
  COMPOSE_OPTS=$(get_compose_opts)
  log_warning "This will remove:"
  echo "  - Stopped containers"
  echo "  - Unused images"
  echo "  - Build cache"
  echo "  - Dangling volumes (NOT named volumes)"
  echo
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cleaning up..."
    # shellcheck disable=SC2086
    docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS down --remove-orphans
    docker system prune -f
    log_success "Cleanup complete"
  else
    log_info "Cancelled"
  fi
}

cmd_backup() {
  log_info "Running manual backup..."
  docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup /backup.sh
  log_success "Manual backup complete"
}

cmd_backup_list() {
  log_info "Available backups:"
  docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
    'ls -lhS ${BACKUP_DIR:-/backups}/backup-*.dump 2>/dev/null || echo "No backups found"'
}

cmd_backup_verify() {
  local FILE="${1:?Usage: ./manage.sh backup-verify <filename>}"
  log_info "Verifying backup: $FILE..."
  docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
    "pg_restore --list \${BACKUP_DIR:-/backups}/$FILE > /dev/null"
  log_success "Backup verified: $FILE"
}

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
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS stop indexer

  log_info "Step 2: Stopping Hasura..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS stop hasura data-connector-agent

  log_info "Step 3: Restoring database..."
  docker exec "${COMPOSE_PROJECT_NAME:-lsp-indexer}"-backup sh -c \
    "pg_restore --clean --if-exists --no-owner --no-privileges --dbname=\$PGDATABASE \${BACKUP_DIR:-/backups}/$FILE"

  log_info "Step 4: Restarting Hasura..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS start data-connector-agent hasura

  log_info "Step 5: Waiting for Hasura health..."
  sleep 10

  log_info "Step 6: Restarting indexer..."
  # shellcheck disable=SC2086
  docker compose -f "$COMPOSE_FILE" $COMPOSE_OPTS start indexer

  log_success "Recovery complete. Verify: ./manage.sh health"
}

cmd_help() {
  cat << EOF
Docker Management Script for Indexer

Usage: ./manage.sh [command] [args]

Service Management:
  start              Start all services (checks ENABLE_HASURA in .env)
  stop               Stop all services (keeps containers)
  restart            Restart all services
  down               Stop and remove containers (keeps volumes)
  build              Build indexer image
  rebuild            Rebuild and restart indexer
  status             Show service status and resource usage
  health             Run health checks on all services

Logs:
  logs [service] [lines]   View logs (default: indexer, last 100 lines)
                           Use 'all' for lines to follow from start
  logs-export [dest]       Export log files to directory
  logs-cleanup [days]      Remove logs older than N days (default: 7)

Database:
  db                 Open psql shell
  db-query 'SQL'     Run SQL query
  db-dump            Backup database to file
  db-restore file    Restore database from file
  db-reset           Drop and recreate database (DESTRUCTIVE!)

Backup:
  backup             Run manual backup now
  backup-list        List available backups with sizes
  backup-verify F    Verify backup file integrity
  backup-restore F   Full recovery from backup (stops services, restores, restarts)

System:
  shell [service]    Open shell in container (default: indexer)
  env                Show environment variables
  stats              Show real-time resource statistics
  volumes            Show volume information
  clean              Clean up Docker resources

Hasura (Optional GraphQL API):
  To enable Hasura, add to ../.env:
    ENABLE_HASURA=true
  
  Then start services normally:
    ./manage.sh start
  
  Hasura console will be available at:
    http://localhost:8080
  
  Default admin secret: admin_secret_change_me
  (Change HASURA_GRAPHQL_ADMIN_SECRET in .env)

Examples:
  ./manage.sh start
  ./manage.sh logs indexer 50
  ./manage.sh logs postgres all
  ./manage.sh db-query 'SELECT count(*) FROM transfer;'
  ./manage.sh logs-export ./backup-logs
  ./manage.sh shell postgres
  ./manage.sh health

EOF
}

# Main command dispatcher
COMMAND="${1:-help}"
shift || true

case "$COMMAND" in
  start)            cmd_start "$@" ;;
  stop)             cmd_stop "$@" ;;
  restart)          cmd_restart "$@" ;;
  down)             cmd_down "$@" ;;
  logs)             cmd_logs "$@" ;;
  status)           cmd_status "$@" ;;
  build)            cmd_build "$@" ;;
  rebuild)          cmd_rebuild "$@" ;;
  shell)            cmd_shell "$@" ;;
  db)               cmd_db "$@" ;;
  db-query)         cmd_db_query "$@" ;;
  db-dump)          cmd_db_dump "$@" ;;
  db-restore)       cmd_db_restore "$@" ;;
  db-reset)         cmd_db_reset "$@" ;;
  backup)           cmd_backup "$@" ;;
  backup-list)      cmd_backup_list "$@" ;;
  backup-verify)    cmd_backup_verify "$@" ;;
  backup-restore)   cmd_backup_restore "$@" ;;
  logs-export)      cmd_logs_export "$@" ;;
  logs-cleanup)     cmd_logs_cleanup "$@" ;;
  health)           cmd_health "$@" ;;
  volumes)          cmd_volumes "$@" ;;
  stats)            cmd_stats "$@" ;;
  env)              cmd_env "$@" ;;
  clean)            cmd_clean "$@" ;;
  help|--help|-h)   cmd_help ;;
  *)
    log_error "Unknown command: $COMMAND"
    echo
    cmd_help
    exit 1
    ;;
esac
