# Phase 18: Production Docker Compose - Research

**Researched:** 2026-03-09
**Domain:** Docker Compose production deployment (PostgreSQL + Hasura + custom indexer)
**Confidence:** HIGH

## Summary

The project already has a well-structured local development Docker Compose setup in `docker/docker-compose.yml` that builds the indexer from source (multi-stage Dockerfile). The production compose file needs to replace the `build:` directive with `image: ghcr.io/chillwhales/lsp-indexer:latest` while keeping the same service topology (PostgreSQL, Hasura, data-connector-agent, indexer) and environment variable passthrough.

The existing compose file is already production-quality — it has health checks, resource limits, restart policies, persistent volumes, and full environment variable configurability. The production compose file is essentially a copy that swaps `build:` for `image:` and tightens a few Hasura defaults (disable dev mode, disable console). The existing `entrypoint.sh` (migrations + Hasura config + start) is baked into the Docker image, so it works identically.

**Primary recommendation:** Create `docker/docker-compose.prod.yml` as a separate file (not an override) that references `ghcr.io/chillwhales/lsp-indexer:latest` for the indexer service. Keep the existing `docker-compose.yml` unchanged for development. Add a `.env.prod.example` documenting required production variables.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOCK-01 | Production docker-compose pulls `ghcr.io/chillwhales/lsp-indexer:latest` and runs indexer + PostgreSQL + Hasura | Separate `docker-compose.prod.yml` with `image:` instead of `build:` — same 4-service topology as dev |
| DOCK-02 | Local docker-compose (existing) remains the default for development | Existing `docker/docker-compose.yml` is untouched — separate file strategy ensures zero risk |
| DOCK-03 | Production compose is configurable via environment variables (RPC URL, DB credentials, Hasura secrets) | All env vars already use `${VAR:-default}` syntax — prod file inherits this pattern, uses `--env-file` |
</phase_requirements>

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Docker Compose | v2 (Compose Spec) | Container orchestration | Already in use, `docker compose` CLI v2 format |
| PostgreSQL | 17-alpine | Database | Already pinned in existing compose |
| Hasura GraphQL Engine | v2.46.0 | GraphQL API over PostgreSQL | Already pinned in existing compose |
| Hasura Data Connector | v2.46.0 | Required Hasura dependency | Already pinned, must match Hasura version |
| `ghcr.io/chillwhales/lsp-indexer` | `:latest` | Pre-built indexer image | CI publishes via `.github/workflows/docker.yml` |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `--env-file` flag | Environment variable injection | Always — compose reads `.env` or specified file |
| Named volumes | Data persistence | PostgreSQL data + indexer logs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `docker-compose.prod.yml` | Docker Compose `profiles` | Profiles mix dev/prod concerns in one file; separate files are cleaner and less error-prone |
| Separate `docker-compose.prod.yml` | `docker-compose.override.yml` | Override is auto-loaded, which is dangerous; explicit `-f` flag is safer for prod |
| `.env.prod.example` | Inline defaults only | Explicit example file documents what operators MUST configure |

## Architecture Patterns

### Recommended File Structure

```
docker/
├── docker-compose.yml           # Development (builds from source) — UNCHANGED
├── docker-compose.prod.yml      # Production (pulls ghcr.io image) — NEW
├── Dockerfile                   # Multi-stage build — UNCHANGED
├── entrypoint.sh                # Migrations + Hasura config — UNCHANGED
├── manage.sh                    # Dev management script — UNCHANGED
├── .env.prod.example            # Production env template — NEW
└── README.md                    # Updated with prod instructions
```

### Pattern 1: Separate Compose Files (Dev vs Prod)

**What:** Two independent compose files — one for development (builds from source), one for production (pulls released image).

**When to use:** When dev and prod have fundamentally different service definitions (build vs image).

**Why this over profiles/overrides:**
- **No accidental mixing** — dev compose cannot accidentally pull from ghcr.io
- **No accidental override loading** — `docker-compose.override.yml` is auto-loaded, which is dangerous
- **Clear operator workflow** — `docker compose -f docker-compose.prod.yml up` is unambiguous
- **Independent evolution** — prod can add monitoring (Phase 20) without touching dev

**Example usage:**
```bash
# Development (existing, unchanged)
cd docker
docker compose --env-file ../.env up -d

# Production
cd docker
docker compose -f docker-compose.prod.yml --env-file ../.env.prod up -d
```

### Pattern 2: Production Hardening Defaults

**What:** Production compose file changes certain defaults vs dev.

| Setting | Dev Default | Prod Default | Why |
|---------|------------|--------------|-----|
| `HASURA_GRAPHQL_DEV_MODE` | `true` | `false` | Hide detailed errors from public |
| `HASURA_GRAPHQL_ENABLE_CONSOLE` | `true` | `false` | Console is a security risk in prod |
| `HASURA_GRAPHQL_ADMIN_SECRET` | **Required** (no default; enforced via `docker-compose.yml`) | **Required** (no default; must be strong secret in prod) | Must be strong secret in prod |
| `POSTGRES_PASSWORD` | `postgres` | **Required** (no default) | Must be strong secret in prod |
| `POSTGRES_PORT` | `5432` (exposed) | Not exposed | DB should not be publicly accessible |
| `NODE_ENV` | `production` | `production` | Same — already correct |

### Pattern 3: Environment Variable Strategy

**What:** Prod compose uses `${VAR:?error message}` for required vars and `${VAR:-default}` for optional vars.

**Required variables (no defaults in prod):**
```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
  HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_GRAPHQL_ADMIN_SECRET:?Set HASURA_GRAPHQL_ADMIN_SECRET in .env}
  RPC_URL: ${RPC_URL:?Set RPC_URL in .env}
```

**Optional variables (sane defaults):**
```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER:-postgres}
  POSTGRES_DB: ${POSTGRES_DB:-postgres}
  SQD_GATEWAY: ${SQD_GATEWAY:-https://v2.archive.subsquid.io/network/lukso-mainnet}
  LOG_LEVEL: ${LOG_LEVEL:-info}
```

### Anti-Patterns to Avoid

- **Don't use `docker-compose.override.yml`:** It's auto-loaded by Docker Compose, making it impossible to distinguish dev from prod invocations.
- **Don't expose PostgreSQL port in production:** Database should only be accessible within the Docker network. The dev compose exposes it for tooling access; prod should not.
- **Don't hardcode secrets in compose files:** All secrets must come from environment variables.
- **Don't remove `data-connector-agent`:** Hasura v2.46.0 requires it even if only using PostgreSQL — Hasura checks connector health on startup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Health checks | Custom health scripts | Docker HEALTHCHECK + `pg_isready`, `curl /healthz`, `pgrep` | Already implemented in dev compose, copy to prod |
| Service startup ordering | Sleep/retry loops | `depends_on: condition: service_healthy` | Docker Compose native, already in use |
| Secret management | Custom env loading | `--env-file` flag + `${VAR:?msg}` syntax | Compose native, simple, well-documented |

## Common Pitfalls

### Pitfall 1: Forgetting the Data Connector Agent

**What goes wrong:** Hasura v2.46.0 won't start without `data-connector-agent` service because `HASURA_GRAPHQL_METADATA_DEFAULTS` references it.
**Why it happens:** The data connector seems unnecessary (only PostgreSQL is used), so it gets omitted.
**How to avoid:** Always include `data-connector-agent` in the compose file. Hasura depends on it via `depends_on` and checks its health on startup.
**Warning signs:** Hasura container enters restart loop, logs show "could not connect to data connector agent."

### Pitfall 2: Entrypoint Expects Hasura to Be Running

**What goes wrong:** The indexer's `entrypoint.sh` waits up to 60 seconds for Hasura's `/healthz` endpoint, then applies Hasura metadata. If Hasura isn't ready, the indexer exits with error.
**Why it happens:** The indexer container doesn't `depends_on: hasura` — it only depends on `postgres`. The entrypoint handles Hasura readiness with a polling loop.
**How to avoid:** Keep the same `depends_on` structure. The entrypoint's 60-second wait is sufficient for Hasura startup (typically 5-10 seconds). If Hasura is slow, increase the wait or add `depends_on: hasura: condition: service_healthy` for the indexer.
**Warning signs:** Indexer logs show "Hasura was not ready after 60 seconds. Aborting."

### Pitfall 3: PostgreSQL Password in Connection URLs

**What goes wrong:** The `DB_URL` and Hasura `PG_DATABASE_URL` must match the PostgreSQL container's `POSTGRES_PASSWORD`. If they diverge, connections fail silently or with cryptic auth errors.
**Why it happens:** The password is interpolated from `${POSTGRES_PASSWORD}` in multiple places. If the env var is set inconsistently (e.g., different .env files), URLs break.
**How to avoid:** Use a single `POSTGRES_PASSWORD` variable, interpolated consistently in all connection URLs. The existing compose already does this correctly — preserve the pattern.

### Pitfall 4: Docker Image Architecture (linux/amd64 vs arm64)

**What goes wrong:** The `ghcr.io/chillwhales/lsp-indexer:latest` image is built on `ubuntu-latest` (amd64). Running on ARM servers (e.g., Apple Silicon, AWS Graviton) requires emulation or multi-arch builds.
**Why it happens:** The GitHub Actions workflow (`.github/workflows/docker.yml`) uses `ubuntu-latest` which builds amd64 only.
**How to avoid:** Document that the image is amd64-only. If ARM support is needed later, add `platforms: linux/amd64,linux/arm64` to the docker workflow. This is out of scope for Phase 18.

### Pitfall 5: Not Exposing the Right Ports

**What goes wrong:** Production needs the Hasura GraphQL endpoint (port 8080) exposed for client applications. If no ports are exposed, the API is unreachable.
**Why it happens:** Security instinct says "don't expose ports" but Hasura IS the public-facing API.
**How to avoid:** Expose Hasura port (8080) always. Do NOT expose PostgreSQL port (5432) in production. The indexer has no public port — it's a background worker.

## Code Examples

### Production Compose File Structure

```yaml
# docker/docker-compose.prod.yml
services:
  postgres:
    image: postgres:17-alpine
    container_name: lsp-indexer-postgres
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    volumes:
      - postgres-data:/var/lib/postgresql/data
    command:
      - postgres
      - -c
      - max_wal_size=2GB
      - -c
      - shared_buffers=512MB
      - -c
      - checkpoint_timeout=15min
      - -c
      - work_mem=64MB
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
      POSTGRES_DB: ${POSTGRES_DB:-postgres}
    # No port exposure in production
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M

  indexer:
    image: ghcr.io/chillwhales/lsp-indexer:${INDEXER_VERSION:-latest}
    container_name: lsp-indexer
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'pgrep', '-f', 'ts-node.*lib/app/index.js']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    volumes:
      - indexer-logs:/app/packages/indexer/logs
    environment:
      DB_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-postgres}
      RPC_URL: ${RPC_URL:?Set RPC_URL in .env}
      # ... (same env vars as dev, with required vars using :? syntax)
    logging:
      driver: 'json-file'
      options:
        max-size: '100m'
        max-file: '10'
        compress: 'true'
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 1G

  hasura:
    image: hasura/graphql-engine:v2.46.0
    container_name: lsp-indexer-hasura
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      data-connector-agent:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/healthz']
      interval: 5s
      timeout: 10s
      retries: 5
      start_period: 5s
    ports:
      - '${HASURA_GRAPHQL_PORT:-8080}:8080'
    environment:
      PG_DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-postgres}
      HASURA_GRAPHQL_DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-postgres}
      HASURA_GRAPHQL_METADATA_DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-postgres}
      HASURA_GRAPHQL_ADMIN_SECRET: ${HASURA_GRAPHQL_ADMIN_SECRET:?Set HASURA_GRAPHQL_ADMIN_SECRET in .env}
      HASURA_GRAPHQL_ENABLE_CONSOLE: ${HASURA_GRAPHQL_ENABLE_CONSOLE:-false}
      HASURA_GRAPHQL_DEV_MODE: ${HASURA_GRAPHQL_DEV_MODE:-false}
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: ${HASURA_GRAPHQL_ENABLED_LOG_TYPES:-startup,http-log,webhook-log,websocket-log,query-log}
      HASURA_GRAPHQL_METADATA_DEFAULTS: '{"backend_configs":{"dataconnector":{"athena":{"uri":"http://data-connector-agent:8081/api/v1/athena"},"mariadb":{"uri":"http://data-connector-agent:8081/api/v1/mariadb"},"mysql8":{"uri":"http://data-connector-agent:8081/api/v1/mysql"},"oracle":{"uri":"http://data-connector-agent:8081/api/v1/oracle"},"snowflake":{"uri":"http://data-connector-agent:8081/api/v1/snowflake"}}}}'
      HASURA_GRAPHQL_UNAUTHORIZED_ROLE: ${HASURA_GRAPHQL_UNAUTHORIZED_ROLE:-public}
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M

  data-connector-agent:
    image: hasura/graphql-data-connector:v2.46.0
    container_name: lsp-indexer-data-connector
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8081/api/v1/athena/health']
      interval: 5s
      timeout: 10s
      retries: 5
      start_period: 5s
    environment:
      QUARKUS_LOG_LEVEL: ERROR
      QUARKUS_OPENTELEMETRY_ENABLED: 'false'
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 128M

volumes:
  postgres-data:
    driver: local
  indexer-logs:
    driver: local
```

### Production Environment Template (.env.prod.example)

```bash
# ==============================================================================
# Production Environment — REQUIRED values have no defaults
# ==============================================================================

# --- REQUIRED ---
POSTGRES_PASSWORD=           # Strong password (no default in prod)
HASURA_GRAPHQL_ADMIN_SECRET= # Strong secret (no default in prod)
RPC_URL=                     # LUKSO RPC endpoint (e.g., https://rpc.lukso.sigmacore.io)

# --- Optional (sane defaults) ---
POSTGRES_USER=postgres
POSTGRES_DB=postgres
INDEXER_VERSION=latest        # Pin to specific version: v0.1.0, abc1234
SQD_GATEWAY=https://v2.archive.subsquid.io/network/lukso-mainnet
RPC_RATE_LIMIT=10
FINALITY_CONFIRMATION=75
IPFS_GATEWAY=https://api.universalprofile.cloud/ipfs/
LOG_LEVEL=info
HASURA_GRAPHQL_PORT=8080
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
```

## Environment Variable Catalog

Complete catalog of all environment variables used across services:

### Required in Production (no defaults)

| Variable | Used By | Purpose |
|----------|---------|---------|
| `POSTGRES_PASSWORD` | postgres, indexer (via DB_URL), hasura | Database authentication |
| `HASURA_GRAPHQL_ADMIN_SECRET` | hasura, indexer | Hasura admin authentication |
| `RPC_URL` | indexer | LUKSO blockchain RPC endpoint |

### Optional with Defaults

| Variable | Default | Used By | Purpose |
|----------|---------|---------|---------|
| `POSTGRES_USER` | `postgres` | postgres, indexer, hasura | Database username |
| `POSTGRES_DB` | `postgres` | postgres, indexer, hasura | Database name |
| `INDEXER_VERSION` | `latest` | indexer (image tag) | Pin image version |
| `SQD_GATEWAY` | `https://v2.archive.subsquid.io/network/lukso-mainnet` | indexer | Subsquid archive gateway |
| `RPC_RATE_LIMIT` | `10` | indexer | RPC requests/second limit |
| `FINALITY_CONFIRMATION` | `75` | indexer | Blocks before data considered final |
| `IPFS_GATEWAY` | `https://api.universalprofile.cloud/ipfs/` | indexer | IPFS gateway for metadata |
| `FETCH_LIMIT` | `10000` | indexer | Max metadata items per batch |
| `FETCH_BATCH_SIZE` | `1000` | indexer | Parallel fetch batch size |
| `FETCH_RETRY_COUNT` | `5` | indexer | Metadata fetch retry count |
| `METADATA_WORKER_POOL_SIZE` | `4` | indexer | Worker thread count |
| `NODE_ENV` | `production` | indexer | Runtime environment |
| `LOG_LEVEL` | `info` | indexer | Log verbosity |
| `INDEXER_ENABLE_FILE_LOGGER` | `true` | indexer | Enable pino file logging in addition to console |
| `LOG_DIR` | `/app/packages/indexer/logs` | indexer | Directory inside container where log files are written |
| `HASURA_GRAPHQL_ENDPOINT` | `http://hasura:8080` | indexer | URL where entrypoint applies Hasura metadata |
| `HASURA_GRAPHQL_PORT` | `8080` | hasura | Exposed GraphQL port |
| `HASURA_GRAPHQL_ENABLE_CONSOLE` | `false` (prod) | hasura | Web console access |
| `HASURA_GRAPHQL_DEV_MODE` | `false` (prod) | hasura | Detailed error messages |
| `HASURA_GRAPHQL_UNAUTHORIZED_ROLE` | `public` | hasura | Anonymous query role |

## Service Dependency Graph

```
data-connector-agent  (independent, starts first)
       │
       ▼
postgres ──────────► hasura (depends_on: postgres healthy + data-connector healthy)
       │
       ▼
    indexer (depends_on: postgres healthy)
       │
       └──► waits for hasura /healthz in entrypoint.sh (up to 60s)
            then applies Hasura metadata
            then starts indexer process
```

**Startup order:** data-connector-agent + postgres start in parallel → hasura starts when both healthy → indexer starts when postgres healthy → indexer entrypoint waits for hasura → applies metadata → starts indexing.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `docker-compose` (v1 CLI) | `docker compose` (v2 CLI, plugin) | 2023+ | V1 CLI deprecated; compose files use Compose Spec format |
| Single compose + override | Separate files per environment | Best practice | Prevents accidental prod/dev mixing |

## Open Questions

1. **INDEXER_VERSION variable**
   - What we know: The CI publishes to `ghcr.io/chillwhales/lsp-indexer` with tags `:latest`, `:vX.Y.Z`, and `:ABCDEF` (short commit SHA without a `sha-` prefix)
   - What's unclear: Whether `latest` is always safe for production (could pull untested changes)
   - Recommendation: Default to `latest` but support `INDEXER_VERSION` env var for pinning. Document that operators should pin to a specific version (e.g., `v1.2.3` or a short SHA like `abc1234`) in production.

2. **Hasura metadata_defaults for data connector**
   - What we know: The dev compose uses a long JSON string as the default for `HASURA_GRAPHQL_METADATA_DEFAULTS`
   - What's unclear: Whether the data connector is actually queried at runtime or just needs to pass health check
   - Recommendation: Keep it as-is — it's a Hasura requirement. Hardcode the JSON in the prod compose (not as env var) since it references internal service names that won't change.

## Sources

### Primary (HIGH confidence)
- `docker/docker-compose.yml` — Existing dev compose file (direct inspection)
- `docker/Dockerfile` — Multi-stage build (direct inspection)
- `docker/entrypoint.sh` — Container startup script (direct inspection)
- `.env.example` — Environment variable catalog (direct inspection)
- `.github/workflows/docker.yml` — CI image publishing (direct inspection)
- `docker/manage.sh` — Management script (direct inspection)

### Secondary (MEDIUM confidence)
- Docker Compose Specification — `depends_on`, health checks, env var syntax

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already in use, versions pinned in existing compose
- Architecture: HIGH — production compose is a well-understood pattern; existing compose is already 95% production-ready
- Pitfalls: HIGH — identified from direct analysis of entrypoint.sh and compose file dependencies

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable — Docker Compose spec, pinned image versions)
