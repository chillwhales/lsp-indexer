# T01: 18-production-docker-compose 01

**Slice:** S22 — **Milestone:** M001

## Description

Create a production Docker Compose file that pulls the released indexer image from ghcr.io and runs the full stack (PostgreSQL + Hasura + indexer) with production-hardened defaults.

Purpose: Enable anyone to run the indexer in production without building from source — just configure env vars and `docker compose up`.
Output: `docker/docker-compose.prod.yml`, `docker/.env.prod.example`, updated `docker/README.md`

## Must-Haves

- [ ] "Production compose file uses ghcr.io/chillwhales/lsp-indexer image (not build)"
- [ ] "All 4 services present in prod compose: postgres, indexer, hasura, data-connector-agent"
- [ ] "Required vars (POSTGRES_PASSWORD, HASURA_GRAPHQL_ADMIN_SECRET, RPC_URL) fail loudly if missing"
- [ ] "Dev compose file (docker/docker-compose.yml) is not modified"
- [ ] ".env.prod.example documents all required and optional variables"

## Files

- `docker/docker-compose.prod.yml`
- `docker/.env.prod.example`
- `docker/README.md`
