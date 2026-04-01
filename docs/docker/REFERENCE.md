# Docker Setup for Indexer

Fully unattended Docker deployment for the LUKSO blockchain indexer with persistent logging and health monitoring.

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure environment variables
nano .env  # Edit DB_URL, RPC_URL, etc.

# 3. Build and start services
docker compose -f docker-compose.yml --env-file ../.env up -d

# 4. View logs (follow mode)
docker compose -f docker-compose.yml --env-file ../.env logs -f indexer

# 5. Check status
docker compose -f docker-compose.yml --env-file ../.env ps
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      docker-compose.yml                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   indexer        │────────▶│    postgres      │         │
│  │                  │  5432   │                  │         │
│  │  - Plugin arch   │         │  - PostgreSQL 17 │         │
│  │  - Event extract │         │  - Persistent    │         │
│  │  - Entity handle │         │    volume        │         │
│  │  - Verification  │         │                  │         │
│  │  - Enrichment    │         │                  │         │
│  └──────────────────┘         └──────────────────┘         │
│         │                                                    │
│         ├─▶ Docker logs (stdout/stderr)                     │
│         │   max-size: 100MB × 10 files                      │
│         │                                                    │
│         └─▶ File logs (mounted volume)                      │
│             /app/packages/indexer/logs/                      │
│             - indexer-YYYY-MM-DD.log (JSON, pino)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Files

| File                 | Purpose                                |
| -------------------- | -------------------------------------- |
| `Dockerfile`         | Multi-stage build for indexer          |
| `docker-compose.yml` | Orchestration with postgres + indexer  |
| `.env`               | Environment configuration (not in git) |
| `.env.example`       | Template with all variables documented |

## Build Process

### Multi-Stage Build (Dockerfile)

1. **Stage 1: Dependencies**

   - Installs pnpm dependencies
   - Caches node_modules separately

2. **Stage 2: Builder**

   - Compiles TypeScript (`pnpm build`)
   - Generates typeorm entities from `schema.graphql`
   - Builds the indexer (runs codegen + tsc in one step)

3. **Stage 3: Runner**
   - Minimal production image
   - Only runtime dependencies (`pnpm install --prod`)
   - Non-root user (node:node)
   - Health check enabled

**Image size:** ~400MB (optimized with layer caching)

## Environment Configuration

### Required Variables

```bash
# Database (auto-configured for docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres
DB_URL=postgresql://postgres:postgres@postgres:5432/postgres

# Blockchain RPC (REQUIRED — update with your endpoint)
RPC_URL=https://rpc.lukso.sigmacore.io
```

### Optional Variables (with defaults)

```bash
# Archive node
SQD_GATEWAY=https://v2.archive.subsquid.io/network/lukso-mainnet

# Rate limiting
RPC_RATE_LIMIT=10
FINALITY_CONFIRMATION=75

# Metadata fetching
IPFS_GATEWAY=https://api.universalprofile.cloud/ipfs/
FETCH_LIMIT=10000
FETCH_BATCH_SIZE=1000
FETCH_RETRY_COUNT=5
METADATA_WORKER_POOL_SIZE=4

# Logging
NODE_ENV=production
LOG_LEVEL=info
INDEXER_ENABLE_FILE_LOGGER=true
```

See `.env.example` for full documentation.

## Logging

### Dual Logging Strategy

The indexer writes logs to **two destinations simultaneously**:

1. **Docker stdout/stderr** (captured by Docker daemon)

   - Accessible via `docker compose logs`
   - Rotated automatically (100MB × 10 files, compressed)
   - Includes console output + errors

2. **File logs** (mounted volume)
   - JSON format via pino logger
   - Daily rotation with timestamps
   - Located in `indexer-logs` volume
   - Format: `indexer-YYYY-MM-DD.log`

### Accessing Logs

```bash
# Real-time logs (all services)
docker compose -f docker-compose.yml --env-file ../.env logs -f

# Real-time logs (indexer only)
docker compose -f docker-compose.yml --env-file ../.env logs -f indexer

# Last 100 lines
docker compose -f docker-compose.yml --env-file ../.env logs --tail=100 indexer

# Specific time range
docker compose -f docker-compose.yml --env-file ../.env logs --since="2026-02-10T10:00" indexer

# Copy log files from container
docker cp lsp-indexer:/app/packages/indexer/logs ./local-logs

# Access logs volume directly
docker volume inspect lsp-indexer_indexer-logs
# Shows mount point: /var/lib/docker/volumes/lsp-indexer_indexer-logs/_data
```

### Log Volume Management

```bash
# Inspect volume
docker volume inspect lsp-indexer_indexer-logs

# Backup logs
docker run --rm -v lsp-indexer_indexer-logs:/logs -v $(pwd):/backup alpine \
  tar czf /backup/logs-backup-$(date +%Y%m%d).tar.gz -C /logs .

# Cleanup old logs (inside container)
docker exec lsp-indexer find /app/packages/indexer/logs -name "*.log" -mtime +30 -delete
```

## Service Management

### Starting Services

```bash
# Start in detached mode
docker compose -f docker-compose.yml --env-file ../.env up -d

# Start with rebuild (after code changes)
docker compose -f docker-compose.yml --env-file ../.env up -d --build

# Start specific service
docker compose -f docker-compose.yml --env-file ../.env up -d indexer
```

### Stopping Services

```bash
# Stop all services
docker compose -f docker-compose.yml --env-file ../.env stop

# Stop specific service
docker compose -f docker-compose.yml --env-file ../.env stop indexer

# Stop and remove containers (keeps volumes)
docker compose -f docker-compose.yml --env-file ../.env down

# Stop and remove everything (including volumes)
docker compose -f docker-compose.yml --env-file ../.env down -v
```

### Restarting Services

```bash
# Restart all
docker compose -f docker-compose.yml --env-file ../.env restart

# Restart specific service
docker compose -f docker-compose.yml --env-file ../.env restart indexer

# Restart with rebuild
docker compose -f docker-compose.yml --env-file ../.env up -d --build --force-recreate
```

## Health Checks

### Service Status

```bash
# All services
docker compose -f docker-compose.yml --env-file ../.env ps

# Example output:
# NAME                 STATUS              PORTS
# lsp-indexer          Up 2 hours (healthy)
# lsp-indexer-postgres Up 2 hours (healthy)
```

### Manual Health Checks

```bash
# Check indexer process
docker exec lsp-indexer pgrep -f "ts-node.*lib/app/index.js"

# Check database connectivity
docker exec lsp-indexer-postgres pg_isready -U postgres -d postgres

# View container health status
docker inspect lsp-indexer --format='{{.State.Health.Status}}'
```

### Health Check Failures

If health checks fail:

```bash
# 1. Check logs
docker compose -f docker-compose.yml --env-file ../.env logs --tail=50 indexer

# 2. Check container status
docker compose -f docker-compose.yml --env-file ../.env ps

# 3. Inspect container
docker inspect lsp-indexer

# 4. Enter container for debugging
docker exec -it lsp-indexer sh

# 5. Restart service
docker compose -f docker-compose.yml --env-file ../.env restart indexer
```

## Database Management

### PostgreSQL Access

```bash
# Connect via psql
docker exec -it lsp-indexer-postgres psql -U postgres -d postgres

# Run SQL query
docker exec lsp-indexer-postgres psql -U postgres -d postgres -c "SELECT count(*) FROM transfer;"

# Dump database
docker exec lsp-indexer-postgres pg_dump -U postgres postgres > backup.sql

# Restore database
docker exec -i lsp-indexer-postgres psql -U postgres -d postgres < backup.sql
```

### Database Migrations

Migrations run automatically on container startup via TypeORM.

```bash
# View migration status (from host)
docker exec lsp-indexer pnpm --filter=@chillwhales/indexer migration:show

# Manual migration (if needed)
docker exec lsp-indexer pnpm --filter=@chillwhales/indexer migration:apply
```

### Database Reset

```bash
# WARNING: Deletes all data!

# 1. Stop indexer
docker compose -f docker-compose.yml --env-file ../.env stop indexer

# 2. Drop and recreate database
docker exec lsp-indexer-postgres psql -U postgres -c "DROP DATABASE postgres;"
docker exec lsp-indexer-postgres psql -U postgres -c "CREATE DATABASE postgres;"

# 3. Restart indexer (migrations run automatically)
docker compose -f docker-compose.yml --env-file ../.env start indexer
```

## Volumes

### Persistent Data

- **postgres-data**: Database files (survives container restarts)
- **indexer-logs**: Log files (accessible from host)

```bash
# List volumes
docker volume ls | grep lsp-indexer

# Inspect volume
docker volume inspect lsp-indexer_postgres-data
docker volume inspect lsp-indexer_indexer-logs

# Cleanup unused volumes
docker volume prune
```

### Volume Backup

```bash
# Backup postgres
docker run --rm -v lsp-indexer_postgres-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup logs
docker run --rm -v lsp-indexer_indexer-logs:/logs -v $(pwd):/backup alpine \
  tar czf /backup/logs-backup-$(date +%Y%m%d).tar.gz -C /logs .
```

### Volume Restore

```bash
# Restore postgres (CAUTION: overwrites existing data)
docker run --rm -v lsp-indexer_postgres-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/postgres-backup-YYYYMMDD.tar.gz -C /data
```

## Resource Management

### Resource Limits

Configured in `docker-compose.yml`:

- **indexer**: 4GB limit, 1GB reservation
- **postgres**: 2GB limit, 512MB reservation

### Monitoring Resources

```bash
# Real-time stats
docker stats lsp-indexer lsp-indexer-postgres

# Example output:
# NAME                 CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
# lsp-indexer          15.3%   1.2GB / 4GB         30%     1.2GB / 850MB
# lsp-indexer-postgres 2.1%    450MB / 2GB         22%     850MB / 1.2GB
```

### Adjusting Limits

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 8G # Increase for large datasets
    reservations:
      memory: 2G
```

Then restart:

```bash
docker compose -f docker-compose.yml --env-file ../.env up -d --force-recreate
```

## Troubleshooting

### Indexer Not Starting

```bash
# 1. Check logs
docker compose -f docker-compose.yml --env-file ../.env logs indexer

# 2. Verify environment
docker exec lsp-indexer env | grep -E "(DB_URL|RPC_URL|LOG_)"

# 3. Check database connectivity
docker exec lsp-indexer nc -zv postgres 5432

# 4. Rebuild from scratch
docker compose -f docker-compose.yml --env-file ../.env down -v
docker compose -f docker-compose.yml --env-file ../.env build --no-cache
docker compose -f docker-compose.yml --env-file ../.env up -d
```

### Database Connection Issues

```bash
# 1. Check postgres health
docker compose -f docker-compose.yml --env-file ../.env ps postgres

# 2. Verify postgres is accepting connections
docker exec lsp-indexer-postgres pg_isready

# 3. Check DB_URL format
echo $DB_URL
# Should be: postgresql://postgres:postgres@postgres:5432/postgres

# 4. Test connection from indexer
docker exec lsp-indexer nc -zv postgres 5432
```

### Build Failures

```bash
# 1. Clean Docker cache
docker builder prune -a

# 2. Remove old images
docker rmi lsp-indexer:latest

# 3. Rebuild with no cache
docker compose -f docker-compose.yml --env-file ../.env build --no-cache

# 4. Check disk space
docker system df
```

### High Memory Usage

```bash
# 1. Check stats
docker stats lsp-indexer

# 2. Reduce worker pool size in .env
METADATA_WORKER_POOL_SIZE=2

# 3. Reduce fetch batch size
FETCH_BATCH_SIZE=500

# 4. Restart with new settings
docker compose -f docker-compose.yml --env-file ../.env restart indexer
```

### Log Volume Full

```bash
# 1. Check volume size
docker volume inspect lsp-indexer_indexer-logs

# 2. Cleanup old logs (keeps last 7 days)
docker exec lsp-indexer find /app/packages/indexer/logs -name "*.log" -mtime +7 -delete

# 3. Compress old logs
docker exec lsp-indexer gzip /app/packages/indexer/logs/*.log

# 4. Backup and prune
docker cp lsp-indexer:/app/packages/indexer/logs ./backup-logs
docker exec lsp-indexer rm -rf /app/packages/indexer/logs/*.log.gz
```

## Production Deployment

### Security Checklist

- [ ] Change default postgres password in `.env`
- [ ] Use strong `HASURA_GRAPHQL_ADMIN_SECRET` (if enabled)
- [ ] Restrict port exposure (comment out `ports:` in compose file)
- [ ] Use secrets management (Docker secrets, Vault)
- [ ] Enable TLS for postgres (custom pg_hba.conf)
- [ ] Regular backups (postgres + logs)
- [ ] Monitor disk usage (volumes)
- [ ] Set up log rotation (docker logging driver)

### Monitoring Setup

```bash
# Add monitoring stack (Prometheus + Grafana)
# 1. Install docker-compose monitoring plugin
# 2. Add exporters:
#    - node-exporter (system metrics)
#    - postgres-exporter (DB metrics)
#    - cadvisor (container metrics)

# Example: Add to docker-compose.yml
# postgres-exporter:
#   image: prometheuscommunity/postgres-exporter
#   environment:
#     DATA_SOURCE_URI: postgres:5432/postgres?sslmode=disable
#     DATA_SOURCE_USER: postgres
#     DATA_SOURCE_PASS: ${POSTGRES_PASSWORD}
```

### Systemd Service (Auto-Start on Boot)

Create `/etc/systemd/system/lsp-indexer.service`:

```ini
[Unit]
Description=LUKSO LSP Indexer
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/lsp-indexer/docker
ExecStart=/usr/bin/docker compose -f docker-compose.yml --env-file ../.env up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml --env-file ../.env stop
ExecReload=/usr/bin/docker compose -f docker-compose.yml --env-file ../.env restart

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lsp-indexer
sudo systemctl start lsp-indexer
sudo systemctl status lsp-indexer
```

## Hasura (Optional)

To enable GraphQL API, uncomment the `hasura` and `data-connector-agent` sections in `docker-compose.yml`.

```bash
# 1. Edit docker-compose.yml (uncomment hasura services)

# 2. Restart stack
docker compose -f docker-compose.yml --env-file ../.env up -d

# 3. Access Hasura console
open http://localhost:8080
# Admin secret: see HASURA_GRAPHQL_ADMIN_SECRET in .env

# 4. Apply metadata
docker exec lsp-indexer pnpm hasura:apply
```

## Development vs Production

### Development (host)

```bash
# Use host pnpm with live reload
pnpm start

# Benefits:
# - Fast iteration
# - Direct file access
# - Native debugging
```

### Production (Docker)

```bash
# Use Docker for stability
docker compose -f docker-compose.yml --env-file ../.env up -d

# Benefits:
# - Isolated environment
# - Automatic restart
# - Resource limits
# - Easy deployment
# - Comprehensive logging
```

## Next Steps

1. **Configure `.env`** — Update RPC_URL and other settings
2. **Start services** — `docker compose -f docker-compose.yml --env-file ../.env up -d`
3. **Monitor logs** — `docker compose -f docker-compose.yml --env-file ../.env logs -f indexer`
4. **Check health** — Wait for "healthy" status in `docker compose ps`
5. **Verify indexing** — Query database for indexed entities
6. **Set up backups** — Schedule regular postgres dumps
7. **Enable monitoring** — Add Prometheus/Grafana (optional)

## Support

- **Logs**: Start with `docker compose logs indexer`
- **Status**: Check `docker compose ps` for health
- **Database**: Use `psql` to inspect indexed data
- **Issues**: File bug reports with full logs attached
