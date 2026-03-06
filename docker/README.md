# Docker Configuration

Docker deployment for LSP Indexer.

## Files

- **`Dockerfile`** — Multi-stage optimized build (~400MB)
- **`docker-compose.yml`** — Orchestration with PostgreSQL + Hasura
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
