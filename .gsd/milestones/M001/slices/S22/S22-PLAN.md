# S22: Production Docker Compose

**Goal:** Create a production Docker Compose file that pulls the released indexer image from ghcr.
**Demo:** Create a production Docker Compose file that pulls the released indexer image from ghcr.

## Must-Haves


## Tasks

- [x] **T01: 18-production-docker-compose 01** `est:1min`
  - Create a production Docker Compose file that pulls the released indexer image from ghcr.io and runs the full stack (PostgreSQL + Hasura + indexer) with production-hardened defaults.

Purpose: Enable anyone to run the indexer in production without building from source — just configure env vars and `docker compose up`.
Output: `docker/docker-compose.prod.yml`, `docker/.env.prod.example`, updated `docker/README.md`

## Files Likely Touched

- `docker/docker-compose.prod.yml`
- `docker/.env.prod.example`
- `docker/README.md`
