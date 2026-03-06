# Docker Documentation

Complete guides for deploying LSP Indexer with Docker.

## Documentation

- **[Quickstart Guide](./QUICKSTART.md)** — Get running in 5 minutes with full logging
- **[Reference Manual](./REFERENCE.md)** — Comprehensive Docker setup guide (600+ lines)

## Configuration Files

Docker configurations are in `../../docker/`:

- `Dockerfile` — Multi-stage optimized build
- `docker-compose.yml` — Orchestration with postgres
- `manage.sh` — Management script (35+ commands)
- `entrypoint.sh` — Container entrypoint

## Quick Start

```bash
# 1. Setup environment
cd docker
cp ../.env.example ../.env
nano ../.env  # Set RPC_URL

# 2. Start services
./manage.sh start

# 3. Monitor logs
./manage.sh logs indexer all

# 4. Export logs
./manage.sh logs-export ./my-logs
```

See [QUICKSTART.md](./QUICKSTART.md) for details.

## Features

✅ Multi-stage optimized build (~400MB)
✅ Dual logging (Docker + pino JSON files)
✅ Health monitoring (postgres + process)
✅ Auto-restart policies
✅ Resource limits (4GB indexer, 2GB postgres)
✅ Management script (35+ commands)
✅ Production-ready configuration

## Documentation Overview

| Guide                            | Purpose                                     | Length     |
| -------------------------------- | ------------------------------------------- | ---------- |
| [QUICKSTART.md](./QUICKSTART.md) | Get started fast, export logs               | 150 lines  |
| [REFERENCE.md](./REFERENCE.md)   | Complete setup, operations, troubleshooting | 600+ lines |

## Common Operations

```bash
# Navigate to docker config
cd ../../docker

# Service management
./manage.sh start
./manage.sh stop
./manage.sh restart
./manage.sh status

# Logs
./manage.sh logs indexer 100
./manage.sh logs-export ./logs
./manage.sh logs-cleanup 7

# Database
./manage.sh db
./manage.sh db-query 'SELECT count(*) FROM transfer;'
./manage.sh db-dump

# Health & monitoring
./manage.sh health
./manage.sh stats

# Help
./manage.sh help
```

## Support

- **Issues:** Check [REFERENCE.md](./REFERENCE.md) troubleshooting section
- **Logs:** Export with `./manage.sh logs-export`
- **Health:** Run `./manage.sh health` for diagnostics

See [../../docker/README.md](../../docker/README.md) for additional details.
