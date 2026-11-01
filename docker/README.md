# Docker configuration

Run the current default-branch LSP Indexer with PostgreSQL, Hasura and monitoring. The development
stack builds from source; the production stack uses the configured GHCR image tag. The v3 rewrite
is tracked separately in [#391](https://github.com/chillwhales/lsp-indexer/pull/391).

## Files

| File                                                 | Purpose                                               |
| ---------------------------------------------------- | ----------------------------------------------------- |
| [`Dockerfile`](Dockerfile)                           | Multi-stage indexer build                             |
| [`docker-compose.yml`](docker-compose.yml)           | Development stack built from source                   |
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | Production stack using a released image               |
| [`../.env.example`](../.env.example)                 | Shared template for root `.env` or `.env.prod`        |
| [`manage.sh`](manage.sh)                             | Development-stack management commands                 |
| [`entrypoint.sh`](entrypoint.sh)                     | Database migrations, Hasura setup and indexer startup |

## Development

From the repository root:

```bash
cp .env.example .env
# Edit .env: set RPC_URL and HASURA_GRAPHQL_ADMIN_SECRET.
# Set SQD_API_KEY if your archive endpoint requires it.
cd docker
./manage.sh start
./manage.sh status
./manage.sh logs indexer 50
```

`manage.sh` uses `docker-compose.yml` and `../.env`. Hasura is part of the current stack and is
required by the entrypoint; it is not an optional profile. PostgreSQL, Hasura and monitoring ports
are published for local development. Configure your environment for that intended audience.

After source changes, rebuild from `docker/` with:

```bash
docker compose --env-file ../.env up -d --build
```

See the [Docker quickstart](../docs/docker/QUICKSTART.md) for readiness checks and teardown.

## Production deployment

From the repository root, create a separate environment file using the existing root template:

```bash
cp .env.example .env.prod
```

Set all six required values before starting:

| Variable                      | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `POSTGRES_PASSWORD`           | Database password                              |
| `HASURA_GRAPHQL_ADMIN_SECRET` | Hasura administration credential               |
| `RPC_URL`                     | LUKSO RPC endpoint                             |
| `SQD_API_KEY`                 | Credential for the configured Subsquid archive |
| `GRAFANA_ADMIN_USER`          | Grafana administrator name                     |
| `GRAFANA_ADMIN_PASSWORD`      | Grafana administrator password                 |

The template leaves secret values empty. Use independently generated credentials and configure
the data endpoints for your deployment. Set `INDEXER_VERSION` to the intended image tag rather
than relying on a moving `latest` tag when reproducibility is required.

Start and inspect the production stack from the repository root:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod logs --tail=50 indexer
```

`manage.sh` always operates on the development file; use explicit `docker compose -f` commands for
production. Hasura administration and Grafana access must be configured for the deployment's
network boundary. Production disables the Hasura console by default; Grafana is configured with
anonymous read-only dashboard access.

Before upgrading, back up the database and review the image/schema changes. To stop the stack
without deleting persistent volumes:

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod down
```

## Startup sequence

The indexer entrypoint generates and applies database migrations, waits for Hasura, generates and
applies Hasura metadata, then starts the indexer process. Startup failures should be investigated
in the indexer, PostgreSQL and Hasura logs; a running container alone does not prove indexing is
progressing. Do not repeat the container's migration steps manually as part of normal startup.

## Management and monitoring

Run these development commands from `docker/`:

```bash
./manage.sh help
./manage.sh health
./manage.sh logs indexer 50
./manage.sh logs-export ./logs
./manage.sh stop
```

The Compose files include Grafana, Loki, Alloy, cAdvisor and Prometheus. The default host ports
are 8080 for Hasura and 3000 for Grafana; inspect the selected Compose file and environment for
other published ports. `docker compose ps` and service logs are the starting points for checking
availability; indexer logs and database progress are needed to assess ingestion.

Further details: [quickstart](../docs/docker/QUICKSTART.md),
[reference](../docs/docker/REFERENCE.md), [architecture](../docs/ARCHITECTURE.md),
and the [indexer guide](../apps/docs/src/app/docs/indexer/page.mdx).
