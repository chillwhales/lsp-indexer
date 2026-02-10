#!/bin/bash

# ==============================================================================
# Docker Management Script for Indexer V2
# ==============================================================================
# Convenient wrapper for common Docker operations
# Usage: ./docker-v2.sh [command]
# ==============================================================================

set -e

COMPOSE_FILE="docker-compose.v2.yml"
PROJECT_NAME="lsp-indexer"

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
  if [ ! -f .env ]; then
    log_warning ".env file not found"
    log_info "Creating from .env.example..."
    cp .env.example .env
    log_warning "Please edit .env with your configuration before starting"
    exit 1
  fi
}

# Command functions
cmd_start() {
  check_env
  log_info "Starting services..."
  docker compose -f "$COMPOSE_FILE" up -d
  log_success "Services started"
  log_info "View logs: ./docker-v2.sh logs"
  log_info "Check status: ./docker-v2.sh status"
}

cmd_stop() {
  log_info "Stopping services..."
  docker compose -f "$COMPOSE_FILE" stop
  log_success "Services stopped"
}

cmd_restart() {
  log_info "Restarting services..."
  docker compose -f "$COMPOSE_FILE" restart
  log_success "Services restarted"
}

cmd_down() {
  log_warning "Stopping and removing containers (volumes preserved)..."
  read -p "Continue? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f "$COMPOSE_FILE" down
    log_success "Containers removed"
  else
    log_info "Cancelled"
  fi
}

cmd_logs() {
  SERVICE="${1:-indexer-v2}"
  TAIL="${2:-100}"
  
  if [ "$TAIL" == "all" ]; then
    docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
  else
    docker compose -f "$COMPOSE_FILE" logs -f --tail="$TAIL" "$SERVICE"
  fi
}

cmd_status() {
  log_info "Service status:"
  docker compose -f "$COMPOSE_FILE" ps
  echo
  log_info "Resource usage:"
  docker stats --no-stream lsp-indexer-v2 lsp-indexer-postgres 2>/dev/null || log_warning "Containers not running"
}

cmd_build() {
  log_info "Building indexer-v2 image..."
  docker compose -f "$COMPOSE_FILE" build --no-cache indexer-v2
  log_success "Build complete"
}

cmd_rebuild() {
  log_info "Rebuilding and restarting..."
  docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate indexer-v2
  log_success "Rebuild complete"
}

cmd_shell() {
  SERVICE="${1:-indexer-v2}"
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
    log_error "Usage: ./docker-v2.sh db-query 'SELECT count(*) FROM transfer;'"
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
    log_error "Usage: ./docker-v2.sh db-restore backup.sql"
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
  docker compose -f "$COMPOSE_FILE" stop indexer-v2
  
  log_info "Dropping database..."
  docker exec lsp-indexer-postgres psql -U postgres -c "DROP DATABASE postgres;"
  
  log_info "Creating database..."
  docker exec lsp-indexer-postgres psql -U postgres -c "CREATE DATABASE postgres;"
  
  log_info "Restarting indexer..."
  docker compose -f "$COMPOSE_FILE" start indexer-v2
  
  log_success "Database reset complete"
}

cmd_logs_export() {
  DEST="${1:-./exported-logs}"
  log_info "Exporting logs to $DEST..."
  mkdir -p "$DEST"
  docker cp lsp-indexer-v2:/app/packages/indexer-v2/logs/. "$DEST/"
  log_success "Logs exported to $DEST"
}

cmd_logs_cleanup() {
  DAYS="${1:-7}"
  log_info "Removing logs older than $DAYS days..."
  docker exec lsp-indexer-v2 find /app/packages/indexer-v2/logs -name "*.log" -mtime +"$DAYS" -delete
  log_success "Old logs removed"
}

cmd_health() {
  log_info "Health check results:"
  echo
  
  # Indexer health
  if docker exec lsp-indexer-v2 pgrep -f "ts-node.*lib/app/index.js" > /dev/null 2>&1; then
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
  
  # Container health
  INDEXER_HEALTH=$(docker inspect lsp-indexer-v2 --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  POSTGRES_HEALTH=$(docker inspect lsp-indexer-postgres --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
  
  echo
  echo "Container health status:"
  echo "  indexer-v2: $INDEXER_HEALTH"
  echo "  postgres:   $POSTGRES_HEALTH"
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
  docker stats lsp-indexer-v2 lsp-indexer-postgres
}

cmd_env() {
  log_info "Environment variables (indexer-v2):"
  docker exec lsp-indexer-v2 env | grep -E "(DB_URL|RPC_URL|LOG_|NODE_ENV|FETCH_|METADATA_)" | sort
}

cmd_clean() {
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
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
    docker system prune -f
    log_success "Cleanup complete"
  else
    log_info "Cancelled"
  fi
}

cmd_help() {
  cat << EOF
Docker Management Script for Indexer V2

Usage: ./docker-v2.sh [command] [args]

Service Management:
  start              Start all services
  stop               Stop all services (keeps containers)
  restart            Restart all services
  down               Stop and remove containers (keeps volumes)
  build              Build indexer-v2 image
  rebuild            Rebuild and restart indexer-v2
  status             Show service status and resource usage
  health             Run health checks on all services

Logs:
  logs [service] [lines]   View logs (default: indexer-v2, last 100 lines)
                           Use 'all' for lines to follow from start
  logs-export [dest]       Export log files to directory
  logs-cleanup [days]      Remove logs older than N days (default: 7)

Database:
  db                 Open psql shell
  db-query 'SQL'     Run SQL query
  db-dump            Backup database to file
  db-restore file    Restore database from file
  db-reset           Drop and recreate database (DESTRUCTIVE!)

System:
  shell [service]    Open shell in container (default: indexer-v2)
  env                Show environment variables
  stats              Show real-time resource statistics
  volumes            Show volume information
  clean              Clean up Docker resources

Examples:
  ./docker-v2.sh start
  ./docker-v2.sh logs indexer-v2 50
  ./docker-v2.sh logs postgres all
  ./docker-v2.sh db-query 'SELECT count(*) FROM transfer;'
  ./docker-v2.sh logs-export ./backup-logs
  ./docker-v2.sh shell postgres
  ./docker-v2.sh health

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
