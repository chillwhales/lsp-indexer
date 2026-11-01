# Run the development indexer stack

This guide runs the default-branch implementation from source with PostgreSQL, Hasura and
monitoring. For released-image deployment and its required credentials, use the
[production guide](../../docker/README.md#production-deployment).

## Prerequisites

- Docker with the Compose plugin and enough memory/disk for the indexer and monitoring services.
- A reachable LUKSO RPC endpoint.
- A Hasura admin secret; the current development Compose file requires this value.
- Archive access and `SQD_API_KEY` when required by the selected `SQD_GATEWAY`.

Commands assume a clone of this repository. Published ports are on the Docker engine host; if
using a remote engine, use its host or forwarding rather than assuming agent-local `localhost`.

## 1. Configure

From the repository root:

```bash
cp .env.example .env
```

Edit `.env` before starting:

```dotenv
RPC_URL=https://your-lukso-rpc.example.com
HASURA_GRAPHQL_ADMIN_SECRET=replace-with-a-generated-secret
```

Replace the example endpoint and secret with real configuration. Set `SQD_GATEWAY` and
`SQD_API_KEY` for your archive provider. The root template is shared with production, so it also
contains fields that production requires; development Compose has different defaults.

## 2. Start

```bash
cd docker
./manage.sh start
```

The helper selects `docker-compose.yml` and passes `../.env` to Compose. Hasura is always included;
there is no need to set `ENABLE_HASURA` or select a Hasura profile.

The equivalent Compose command, also suitable for rebuilding after source changes, is:

```bash
docker compose --env-file ../.env up -d --build
```

The container entrypoint generates and applies migrations, waits for Hasura, applies its metadata,
and starts indexing. These steps can take time; do not run a second migration process manually.

## 3. Check startup and progress

```bash
./manage.sh status
./manage.sh health
./manage.sh logs indexer 50
```

Check PostgreSQL and Hasura logs when the indexer cannot initialize:

```bash
docker compose --env-file ../.env logs --tail=50 postgres hasura
```

Hasura is published on port 8080 and Grafana on port 3000 by default. Check the selected Compose
file and environment for custom ports. Container health and a reachable GraphQL API are startup
checks; inspect indexer logs and database progress to confirm that chain ingestion is advancing.

## 4. Troubleshoot without resetting data

- **Environment interpolation error:** set `HASURA_GRAPHQL_ADMIN_SECRET` and confirm Compose is
  reading the repository-root `.env` through `--env-file ../.env`.
- **RPC/archive error:** verify endpoint access and any required `SQD_API_KEY`. Public RPC defaults
  may be rate-limited; configure `RPC_RATE_LIMIT` for your provider.
- **Hasura readiness or metadata error:** inspect both `hasura` and `indexer` logs and verify the
  admin secret matches. The entrypoint stops when Hasura does not become ready within its timeout.
- **Dependency/build error:** keep `pnpm-lock.yaml`; inspect the build output and use the pinned
  Node.js/pnpm versions. Rebuild the image after source or dependency changes.

## 5. Export logs or stop

```bash
./manage.sh logs-export ./my-logs
./manage.sh stop
```

`stop` keeps containers and data. To remove this development stack's containers while retaining
its named volumes, run from `docker/`:

```bash
docker compose --env-file ../.env down
```

Do not add `-v` when the database and other persistent volumes must be retained.

Next: [Docker configuration](../../docker/README.md), [reference](REFERENCE.md),
[indexer architecture](../ARCHITECTURE.md) and [client quickstart](../../apps/docs/src/app/docs/quickstart/page.mdx).
