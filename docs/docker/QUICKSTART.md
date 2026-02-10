# Quick Start: Run Indexer V2 with Full Logs

**Goal:** Get indexer-v2 running in Docker with complete log capture for debugging.

## 1. Setup (One-time)

```bash
# Navigate to docker/v2
cd docker/v2

# Create .env file (in repository root)
cp ../../.env.example ../../.env

# Edit .env — REQUIRED: Set your RPC endpoint
nano ../../.env
# Update: RPC_URL=https://your-rpc-endpoint.io
# Everything else has sane defaults

# Optional: Enable Hasura GraphQL API
# Add to .env: ENABLE_HASURA=true
```

## 2. Start Services

```bash
# Recommended: Use helper script (auto-detects Hasura from .env)
./docker-v2.sh start

# OR using docker compose directly (MUST specify --env-file):
docker compose --env-file ../../.env up -d

# With Hasura enabled:
# If ENABLE_HASURA=true in .env, ./docker-v2.sh start will automatically
# start Hasura at http://localhost:8080
#
# Or manually with docker compose:
docker compose --env-file ../../.env --profile hasura up -d
```

## 3. Monitor Logs (Real-time)

```bash
# Follow logs from all services
./docker-v2.sh logs indexer-v2 all

# OR docker compose directly:
docker compose -f docker-compose.v2.yml logs -f indexer-v2
```

## 4. Export Complete Logs for Analysis

```bash
# Method 1: Using helper script (recommended)
./docker-v2.sh logs-export ./my-logs

# Method 2: Copy directly from container
docker cp lsp-indexer-v2:/app/packages/indexer-v2/logs ./my-logs

# Method 3: Export Docker daemon logs (stdout/stderr)
docker logs lsp-indexer-v2 > docker-stdout.log 2>&1
```

This gives you **three log sources**:

1. **JSON logs** (pino, daily rotation): `./my-logs/indexer-YYYY-MM-DD.log`
2. **Docker stdout**: What you see in `docker logs`
3. **Docker compose logs**: Same as #2 but managed by compose

## 5. Check Service Health

```bash
# Quick health check
./docker-v2.sh health

# Detailed status
./docker-v2.sh status

# OR:
docker compose -f docker-compose.v2.yml ps
```

## 6. Common Issues

### Indexer not starting?

```bash
# View last 50 lines
./docker-v2.sh logs indexer-v2 50

# Check if RPC_URL is set
./docker-v2.sh env | grep RPC_URL
```

### Database connection failed?

```bash
# Check postgres health
docker exec lsp-indexer-postgres pg_isready -U postgres

# View postgres logs
./docker-v2.sh logs postgres 50
```

### Build failed?

```bash
# Rebuild from scratch
./docker-v2.sh rebuild

# OR:
docker compose -f docker-compose.v2.yml build --no-cache
docker compose -f docker-compose.v2.yml up -d --force-recreate
```

## 7. Stop Services

```bash
# Stop (keeps containers)
./docker-v2.sh stop

# Stop and remove containers (keeps data)
./docker-v2.sh down

# Nuclear option: remove everything including data
docker compose -f docker-compose.v2.yml down -v
```

## Log Locations

| Source        | Location                                        | Format            | Rotation         |
| ------------- | ----------------------------------------------- | ----------------- | ---------------- |
| File logs     | `/app/packages/indexer-v2/logs/` (in container) | JSON (pino)       | Daily            |
| Docker logs   | Docker daemon                                   | Plain text        | 100MB × 10 files |
| Exported logs | `./my-logs/` (on host)                          | Same as file logs | Manual           |

## Next Steps

- See **DOCKER.md** for comprehensive documentation
- Use `./docker-v2.sh help` for all available commands
- Query database: `./docker-v2.sh db`
- View env vars: `./docker-v2.sh env`

## TL;DR — Get Logs NOW

```bash
# 1. Start
./docker-v2.sh start

# 2. Wait 30 seconds for initialization

# 3. Export all logs
./docker-v2.sh logs-export ./complete-logs
docker logs lsp-indexer-v2 > ./complete-logs/docker-stdout.log 2>&1

# 4. Share ./complete-logs/ directory
tar czf complete-logs.tar.gz ./complete-logs
```

You now have **complete logs** from both file logger and Docker stdout.
