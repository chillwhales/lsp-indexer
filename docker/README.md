# Docker Configuration

Docker deployment for LSP Indexer.

## Files

- **`Dockerfile`** — Multi-stage optimized build (~400MB)
- **`docker-compose.yml`** — Development orchestration (builds from source)
- **`docker-compose.prod.yml`** — Production orchestration with released Docker image
- **`.env.prod.example`** — Production environment template
- **`manage.sh`** — Management script (35+ commands)
- **`entrypoint.sh`** — Container entrypoint (migrations + Hasura config + start)

## Features

- Multi-stage build with layer caching
- Dual logging (Docker stdout + pino JSON)
- Health monitoring (postgres + indexer process)
- Auto-restart policies
- Resource limits (4GB indexer, 2GB postgres)
- Persistent volumes (database + logs)
- Non-root user for security
- Production-ready defaults

## Quick Start

```bash
cd docker

# Setup
cp ../.env.example ../.env
nano ../.env  # Configure RPC_URL

# Start
./manage.sh start

# Monitor
./manage.sh logs indexer all

# Export logs
./manage.sh logs-export ./logs
```

## Production Deployment

The production compose file uses the pre-built Docker image from GitHub Container Registry instead of building from source.

### Setup

```bash
cd docker

# Copy and configure production environment
cp .env.prod.example ../.env.prod
nano ../.env.prod  # Set REQUIRED: POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL

# Start production stack
docker compose -f docker-compose.prod.yml --env-file ../.env.prod up -d

# Monitor logs
docker compose -f docker-compose.prod.yml --env-file ../.env.prod logs -f indexer

# Stop
docker compose -f docker-compose.prod.yml --env-file ../.env.prod down
```

### Production vs Development

| Aspect          | Development       | Production                                     |
| --------------- | ----------------- | ---------------------------------------------- |
| Indexer         | Built from source | `ghcr.io/chillwhales/lsp-indexer:latest`       |
| PostgreSQL port | Exposed (5432)    | Not exposed                                    |
| Hasura console  | Enabled           | Disabled                                       |
| Hasura dev mode | Enabled           | Disabled                                       |
| Monitoring      | Not included      | Grafana + Loki + Alloy + cAdvisor + Prometheus |
| Secrets         | Optional defaults | Required (no defaults)                         |

## Monitoring

The production compose includes a full monitoring stack (Grafana, Loki, Alloy, cAdvisor, Prometheus). Dashboards are available at `GRAFANA_PORT` (default 3000) with anonymous read-only access enabled. Admin login (default `admin`/`admin`) is required for editing dashboards — change the password via `GRAFANA_ADMIN_PASSWORD` in your `.env.prod`.

Logs from all containers are collected by Grafana Alloy and stored in Loki (14-day retention). Container metrics (CPU, memory, network, disk I/O) are scraped from cAdvisor and pushed to Prometheus.

## Management Commands

```bash
./manage.sh help              # See all commands

# Service management
./manage.sh start             # Start services
./manage.sh stop              # Stop services
./manage.sh restart           # Restart services
./manage.sh status            # Check status
./manage.sh health            # Run health checks

# Logs
./manage.sh logs              # View logs
./manage.sh logs-export ./dir # Export to directory
./manage.sh logs-cleanup 7    # Remove >7 days old

# Database
./manage.sh db                # Open psql
./manage.sh db-dump           # Backup
./manage.sh db-restore file   # Restore

# System
./manage.sh stats             # Resource usage
./manage.sh env               # Show environment
./manage.sh shell             # Open shell
```

## Documentation

See [../docs/docker/](../docs/docker/):

- [QUICKSTART.md](../docs/docker/QUICKSTART.md) — Get started in 5 minutes
- [REFERENCE.md](../docs/docker/REFERENCE.md) — Complete guide
- [ARCHITECTURE.md](../docs/docker/ARCHITECTURE.md) — Design overview

## Environment Configuration

Uses `.env` file from repository root.

```bash
# Copy template
cp .env.example .env

# Configure (REQUIRED)
nano .env
# Set: RPC_URL=https://your-rpc-endpoint.io

# Optional: Customize other settings
# See .env.example for all options
```
