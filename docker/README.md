# Docker Configurations

Docker deployment configurations for LSP Indexer.

## 📦 v2 — Current (Indexer V2)

**Location:** `v2/`

Production-ready Docker setup with comprehensive logging and monitoring.

### Files

- **`Dockerfile`** — Multi-stage optimized build (~400MB)
- **`docker-compose.yml`** — Orchestration with PostgreSQL
- **`docker-v2.sh`** — Management script (35+ commands)

### Features

✅ Multi-stage build with layer caching  
✅ Dual logging (Docker stdout + pino JSON)  
✅ Health monitoring (postgres + indexer process)  
✅ Auto-restart policies  
✅ Resource limits (4GB indexer, 2GB postgres)  
✅ Persistent volumes (database + logs)  
✅ Non-root user for security  
✅ Production-ready defaults

### Quick Start

```bash
cd v2

# Setup
cp ../../.env.example .env
nano .env  # Configure RPC_URL

# Start
./docker-v2.sh start

# Monitor
./docker-v2.sh logs indexer-v2 all

# Export logs
./docker-v2.sh logs-export ./logs
```

### Documentation

See [../docs/docker/](../docs/docker/):

- [QUICKSTART.md](../docs/docker/QUICKSTART.md) — Get started in 5 minutes
- [REFERENCE.md](../docs/docker/REFERENCE.md) — Complete guide (600+ lines)
- [ARCHITECTURE.md](../docs/docker/ARCHITECTURE.md) — Design overview

### Management Commands

```bash
./docker-v2.sh help              # See all commands

# Service management
./docker-v2.sh start             # Start services
./docker-v2.sh stop              # Stop services
./docker-v2.sh restart           # Restart services
./docker-v2.sh status            # Check status
./docker-v2.sh health            # Run health checks

# Logs
./docker-v2.sh logs              # View logs
./docker-v2.sh logs-export ./dir # Export to directory
./docker-v2.sh logs-cleanup 7    # Remove >7 days old

# Database
./docker-v2.sh db                # Open psql
./docker-v2.sh db-dump           # Backup
./docker-v2.sh db-restore file   # Restore

# System
./docker-v2.sh stats             # Resource usage
./docker-v2.sh env               # Show environment
./docker-v2.sh shell             # Open shell
```

## 📁 v1 — Legacy (Indexer V1)

**Location:** `v1/`

Original Docker setup for indexer v1 with Hasura.

### Files

- **`Dockerfile`** — Single-stage build
- **`docker-compose.yml`** — Orchestration with Hasura
- **`start.sh`** — Startup script with migrations
- **`env.sh`** — Environment loader

### Status

⚠️ **Read-only reference** — Use v2 for new deployments

### Usage (if needed)

```bash
cd v1

# Setup
cp ../../.env.example .env

# Start with docker-compose
docker compose up -d

# View logs
docker compose logs -f lsp-indexer
```

### Features

- Basic Docker setup
- Hasura GraphQL included
- Migration auto-run on startup
- Environment sourcing via env.sh

## 🔀 Choosing a Version

| Use Case                     | Version | Location     |
| ---------------------------- | ------- | ------------ |
| **Production deployment**    | v2      | `v2/`        |
| **Development (v2 indexer)** | v2      | `v2/`        |
| **Legacy v1 indexer**        | v1      | `v1/`        |
| **Reference/comparison**     | Both    | Compare both |

## 📊 Comparison

| Feature          | v1              | v2                        |
| ---------------- | --------------- | ------------------------- |
| Build type       | Single-stage    | Multi-stage               |
| Image size       | ~600MB          | ~400MB                    |
| Logging          | Basic stdout    | Dual (Docker + pino)      |
| Health checks    | Postgres only   | Postgres + indexer        |
| Management       | Manual commands | Helper script (35+)       |
| Documentation    | None            | 3 comprehensive guides    |
| Resource limits  | None            | 4GB indexer, 2GB postgres |
| Auto-restart     | Basic           | Advanced policies         |
| Hasura           | Included        | Optional (commented)      |
| Production ready | Basic           | Complete                  |

## 🚀 Recommended Setup

**For new deployments, use v2:**

```bash
cd v2
./docker-v2.sh start
./docker-v2.sh logs indexer-v2 all
```

Full documentation: [../docs/docker/REFERENCE.md](../docs/docker/REFERENCE.md)

## 📝 Environment Configuration

Both versions use `.env` file from repository root.

```bash
# Copy template
cp .env.example .env

# Configure (REQUIRED)
nano .env
# Set: RPC_URL=https://your-rpc-endpoint.io

# Optional: Customize other settings
# See .env.example for all options
```

## 🆘 Support

- **v2 Documentation:** [../docs/docker/](../docs/docker/)
- **v2 Troubleshooting:** [../docs/docker/REFERENCE.md](../docs/docker/REFERENCE.md#troubleshooting)
- **v2 Quick Help:** `cd v2 && ./docker-v2.sh help`
- **v1 Reference:** See files in `v1/` directory
