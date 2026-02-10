# Docker Setup Summary for Indexer V2

**Created:** 2026-02-10  
**Purpose:** Enable fully unattended indexer-v2 operation with comprehensive logging

## Files Created

| File                    | Purpose                               | Lines |
| ----------------------- | ------------------------------------- | ----- |
| `Dockerfile.v2`         | Multi-stage build for indexer-v2      | 112   |
| `docker-compose.v2.yml` | Orchestration with postgres + logging | 220   |
| `docker-v2.sh`          | Helper script for common operations   | 350+  |
| `DOCKER.md`             | Comprehensive documentation           | 600+  |
| `QUICKSTART-DOCKER.md`  | Quick start guide focused on logs     | 150   |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Dockerfile.v2 (Multi-stage)                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │  Stage 1:  │→ │  Stage 2:  │→ │  Stage 3:  │         │
│  │    Deps    │  │   Builder  │  │   Runner   │         │
│  │            │  │            │  │            │         │
│  │ Install    │  │ Build all  │  │ Production │         │
│  │ pnpm deps  │  │ packages   │  │ only       │         │
│  │ (cached)   │  │ TS compile │  │ Non-root   │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  docker-compose.v2.yml                                    │
│                                                           │
│  ┌─────────────────┐       ┌─────────────────┐          │
│  │   indexer-v2    │──────▶│   postgres      │          │
│  │                 │ :5432 │                 │          │
│  │ - Health check  │       │ - Health check  │          │
│  │ - Auto restart  │       │ - Auto restart  │          │
│  │ - Log rotation  │       │ - Volume mount  │          │
│  │ - Volume mount  │       │                 │          │
│  └─────────────────┘       └─────────────────┘          │
│         │                                                 │
│         ├─▶ Docker logs (json-file, 100MB×10)            │
│         └─▶ File logs (pino, daily rotation)             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Multi-Stage Build (Dockerfile.v2)

- **Stage 1: Dependencies** — Cache pnpm install for fast rebuilds
- **Stage 2: Builder** — Compile TypeScript, generate typeorm entities
- **Stage 3: Runner** — Minimal production image (~400MB)

**Optimizations:**

- Separate layer caching for dependencies vs source
- Production-only dependencies in final image
- Non-root user (node:node) for security
- Health check with process monitoring

### 2. Comprehensive Logging

**Dual logging strategy:**

1. **Docker daemon logs**

   - Format: Plain text (stdout/stderr)
   - Rotation: 100MB per file, 10 files max, compressed
   - Access: `docker logs` or `docker compose logs`

2. **File logs (pino)**
   - Format: JSON with structured fields
   - Rotation: Daily with date suffix
   - Location: Mounted volume `indexer-logs`
   - Access: `docker cp` or volume mount

**Why both?**

- Docker logs: Quick access, integrated with Docker tools
- File logs: Structured JSON for parsing, persistent beyond container lifecycle

### 3. Production-Ready Features

✅ **Health checks** — Postgres + indexer process monitoring  
✅ **Auto-restart** — `unless-stopped` policy  
✅ **Resource limits** — Memory limits + reservations  
✅ **Persistent volumes** — Database + logs survive restarts  
✅ **Proper dependencies** — Indexer waits for postgres health  
✅ **Log rotation** — Automatic cleanup, no disk overflow  
✅ **Security** — Non-root user, isolated network (optional)

### 4. Management Script (docker-v2.sh)

**Categories:**

- **Service management:** start, stop, restart, down, build, rebuild
- **Logs:** logs, logs-export, logs-cleanup
- **Database:** db, db-query, db-dump, db-restore, db-reset
- **System:** shell, env, stats, volumes, health, clean

**Examples:**

```bash
./docker-v2.sh start                      # Start all services
./docker-v2.sh logs indexer-v2 all        # Follow logs from start
./docker-v2.sh logs-export ./my-logs      # Export log files
./docker-v2.sh health                     # Run health checks
./docker-v2.sh db-query 'SELECT count(*) FROM transfer;'
./docker-v2.sh stats                      # Real-time resource usage
```

## Usage Workflows

### Initial Setup

```bash
# 1. Create environment config
cp .env.example .env
nano .env  # Set RPC_URL

# 2. Start services
./docker-v2.sh start

# 3. Monitor startup
./docker-v2.sh logs indexer-v2 all

# 4. Verify health
./docker-v2.sh health
```

### Daily Operations

```bash
# View recent logs
./docker-v2.sh logs indexer-v2 100

# Check status
./docker-v2.sh status

# Query database
./docker-v2.sh db-query 'SELECT count(*) FROM universal_profile;'

# Export logs for analysis
./docker-v2.sh logs-export ./logs-$(date +%Y%m%d)
```

### Debugging

```bash
# Export complete logs
./docker-v2.sh logs-export ./debug-logs
docker logs lsp-indexer-v2 > ./debug-logs/docker-stdout.log 2>&1

# Check environment
./docker-v2.sh env

# Shell into container
./docker-v2.sh shell indexer-v2

# View database
./docker-v2.sh db
```

### Maintenance

```bash
# Rebuild after code changes
./docker-v2.sh rebuild

# Backup database
./docker-v2.sh db-dump

# Cleanup old logs (>7 days)
./docker-v2.sh logs-cleanup 7

# Clean Docker resources
./docker-v2.sh clean
```

## Environment Variables

### Required

- `POSTGRES_USER` — Database user (default: postgres)
- `POSTGRES_PASSWORD` — Database password (default: postgres)
- `POSTGRES_DB` — Database name (default: postgres)
- `DB_URL` — Full postgres connection string
- `RPC_URL` — LUKSO RPC endpoint (**MUST SET**)

### Optional (with defaults)

- `SQD_GATEWAY` — Archive node (default: Subsquid mainnet)
- `RPC_RATE_LIMIT` — Requests/sec (default: 10)
- `FINALITY_CONFIRMATION` — Blocks (default: 75)
- `IPFS_GATEWAY` — IPFS endpoint (default: UP cloud)
- `FETCH_LIMIT` — Max metadata items (default: 10000)
- `FETCH_BATCH_SIZE` — Parallel batch size (default: 1000)
- `FETCH_RETRY_COUNT` — Retry attempts (default: 5)
- `METADATA_WORKER_POOL_SIZE` — Worker threads (default: 4)
- `LOG_LEVEL` — debug|info|warn|error (default: info)
- `LOG_DIR` — Log directory (default: ./logs)
- `INDEXER_ENABLE_FILE_LOGGER` — Enable pino (default: true)
- `NODE_ENV` — production|development (default: production)

All documented in `.env.example`.

## Volume Management

### Persistent Volumes

1. **postgres-data** — Database files

   - Survives container restarts
   - Backup: `./docker-v2.sh db-dump`

2. **indexer-logs** — Log files
   - JSON logs from pino
   - Daily rotation
   - Access: `./docker-v2.sh logs-export`

### Volume Operations

```bash
# Inspect volumes
docker volume ls | grep lsp-indexer

# Check sizes
./docker-v2.sh volumes

# Backup postgres
docker run --rm -v lsp-indexer_postgres-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup logs
./docker-v2.sh logs-export ./log-backup
```

## Differences from Existing Setup

### docker-compose.yaml (v1 — existing)

- Uses `Dockerfile` (single stage)
- Runs v1 indexer with `start.sh`
- Includes Hasura by default
- Runs migrations + Hasura metadata apply
- Uses `env.sh` for environment

### docker-compose.v2.yml (new)

- Uses `Dockerfile.v2` (multi-stage)
- Runs v2 indexer directly
- Hasura commented out (optional)
- No migration script — TypeORM handles automatically
- Uses `.env` directly (Docker compose native)

**Key improvements:**

✅ Optimized build with layer caching  
✅ Smaller image size (~400MB vs ~600MB)  
✅ Comprehensive logging (dual strategy)  
✅ Health checks for reliability  
✅ Management script for operations  
✅ Production-ready configuration

## Production Deployment Checklist

- [ ] Change `POSTGRES_PASSWORD` to strong password
- [ ] Configure `RPC_URL` with reliable endpoint
- [ ] Set resource limits based on server capacity
- [ ] Enable systemd service for auto-start on boot
- [ ] Set up log rotation/cleanup cron job
- [ ] Configure database backups (daily/weekly)
- [ ] Set up monitoring (Prometheus/Grafana optional)
- [ ] Restrict port exposure (remove `ports:` from compose)
- [ ] Use Docker secrets for sensitive values
- [ ] Enable log aggregation (ELK, Loki, etc.)

See `DOCKER.md` for detailed production setup.

## Testing

### Quick Test

```bash
# 1. Start services
./docker-v2.sh start

# 2. Wait for healthy status (60 seconds)
watch -n 5 './docker-v2.sh health'

# 3. Verify indexing
./docker-v2.sh db-query 'SELECT count(*) FROM block;'

# 4. Check logs for errors
./docker-v2.sh logs indexer-v2 100 | grep -i error
```

### Full Integration Test

1. Start with clean state: `./docker-v2.sh down -v`
2. Build fresh: `./docker-v2.sh build`
3. Start: `./docker-v2.sh start`
4. Monitor logs: `./docker-v2.sh logs indexer-v2 all`
5. Wait 5 minutes for initial sync
6. Query database for entities
7. Export logs for analysis
8. Restart and verify persistence

## Troubleshooting

### Indexer not starting

```bash
# Check logs
./docker-v2.sh logs indexer-v2 50

# Check environment
./docker-v2.sh env | grep -E "(DB_URL|RPC_URL)"

# Rebuild
./docker-v2.sh rebuild
```

### Database connection failed

```bash
# Check postgres health
docker exec lsp-indexer-postgres pg_isready

# Check DB_URL format
./docker-v2.sh env | grep DB_URL
# Should be: postgresql://postgres:postgres@postgres:5432/postgres
```

### High memory usage

```bash
# Check stats
./docker-v2.sh stats

# Reduce worker pool size in .env
METADATA_WORKER_POOL_SIZE=2

# Restart
./docker-v2.sh restart
```

## Documentation

- **QUICKSTART-DOCKER.md** — Quick start focused on logging (150 lines)
- **DOCKER.md** — Comprehensive guide (600+ lines)
  - Setup instructions
  - Service management
  - Logging strategies
  - Database operations
  - Troubleshooting
  - Production deployment

## Next Steps

1. **Test locally:**

   ```bash
   ./docker-v2.sh start
   ./docker-v2.sh logs-export ./test-logs
   ```

2. **Review logs** — Check for any startup issues

3. **Configure production** — Update .env with production RPC endpoint

4. **Deploy** — Run on production server with systemd service

5. **Monitor** — Set up alerting for health check failures

## Benefits

✅ **Unattended operation** — Auto-restart, health monitoring  
✅ **Complete logs** — Both Docker and file logs for analysis  
✅ **Easy management** — Helper script for all operations  
✅ **Production-ready** — Resource limits, security, persistence  
✅ **Developer-friendly** — Quick start, comprehensive docs  
✅ **Reproducible** — Consistent environment across deployments

## Files to Commit

```
DOCKER.md                 # Comprehensive documentation
Dockerfile.v2             # Multi-stage build
docker-compose.v2.yml     # Orchestration config
docker-v2.sh              # Management script
QUICKSTART-DOCKER.md      # Quick start guide
DOCKER-SUMMARY.md         # This file
```

All files ready for commit to `refactor/indexer-v2` branch.
