# Docker Documentation

Complete guides for deploying LSP Indexer with Docker.

## Documentation

- **[Quickstart Guide](./QUICKSTART.md)** — Get running in 5 minutes with full logging
- **[Reference Manual](./REFERENCE.md)** — Comprehensive Docker setup guide (600+ lines)

## Configuration Files

Docker configurations are in `../../docker/`:

- **v2/** — Current production setup (indexer-v2)

  - `Dockerfile` — Multi-stage optimized build
  - `docker-compose.yml` — Orchestration with postgres
  - `docker-v2.sh` — Management script (35+ commands)

- **v1/** — Legacy setup (indexer v1)
  - `Dockerfile` — Single-stage build
  - `docker-compose.yml` — Basic orchestration
  - `start.sh` — Startup script

## Quick Start (v2)

```bash
# 1. Setup environment
cd docker/v2
cp ../../.env.example .env
nano .env  # Set RPC_URL

# 2. Start services
./docker-v2.sh start

# 3. Monitor logs
./docker-v2.sh logs indexer-v2 all

# 4. Export logs
./docker-v2.sh logs-export ./my-logs
```

See [QUICKSTART.md](./QUICKSTART.md) for details.

## Features

### Indexer V2 (Current)

✅ Multi-stage optimized build (~400MB)  
✅ Dual logging (Docker + pino JSON files)  
✅ Health monitoring (postgres + process)  
✅ Auto-restart policies  
✅ Resource limits (4GB indexer, 2GB postgres)  
✅ Management script (35+ commands)  
✅ Production-ready configuration

### Indexer V1 (Legacy)

Basic Docker setup for v1 indexer with Hasura. See `../../docker/v1/` for configs.

## Documentation Overview

| Guide                            | Purpose                                     | Length     |
| -------------------------------- | ------------------------------------------- | ---------- |
| [QUICKSTART.md](./QUICKSTART.md) | Get started fast, export logs               | 150 lines  |
| [REFERENCE.md](./REFERENCE.md)   | Complete setup, operations, troubleshooting | 600+ lines |

## Common Operations

```bash
# Navigate to v2 config
cd ../../docker/v2

# Service management
./docker-v2.sh start
./docker-v2.sh stop
./docker-v2.sh restart
./docker-v2.sh status

# Logs
./docker-v2.sh logs indexer-v2 100
./docker-v2.sh logs-export ./logs
./docker-v2.sh logs-cleanup 7

# Database
./docker-v2.sh db
./docker-v2.sh db-query 'SELECT count(*) FROM transfer;'
./docker-v2.sh db-dump

# Health & monitoring
./docker-v2.sh health
./docker-v2.sh stats

# Help
./docker-v2.sh help
```

## Support

- **Issues:** Check [REFERENCE.md](./REFERENCE.md) troubleshooting section
- **Logs:** Export with `./docker-v2.sh logs-export`
- **Health:** Run `./docker-v2.sh health` for diagnostics

## Migration from V1

Key differences between v1 and v2:

- Multi-stage build (faster, smaller)
- Dual logging (complete visibility)
- Helper script (easier operations)
- Health checks (better reliability)
- Resource limits (production-ready)

See [../../docker/README.md](../../docker/README.md) for detailed comparison.
