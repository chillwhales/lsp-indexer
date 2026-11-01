# LSP Indexer

LSP Indexer turns LUKSO events into queryable profiles, digital assets, metadata and social
relationships. It combines event ingestion, PostgreSQL storage and Hasura GraphQL with typed
Node.js, React and Next.js client packages.

## Status

The default branch contains the Subsquid/TypeORM implementation. The multi-chain v3 rewrite is
in development on `lsp-indexer-v3`, tracked in [#391](https://github.com/chillwhales/lsp-indexer/pull/391).
That development branch is separate from the implementation and client packages documented here.

## Choose your starting point

| Goal                      | Start here                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query an existing indexer | Install a client package and follow the [client quickstart](apps/docs/src/app/docs/quickstart/page.mdx). You need a configured Hasura GraphQL endpoint. |
| Run an indexer            | Follow the [Docker quickstart](docs/docker/QUICKSTART.md) for local development, or the [production setup](docker/README.md#production-deployment).     |
| Contribute                | Read [CONTRIBUTING](docs/CONTRIBUTING.md), the [architecture](docs/ARCHITECTURE.md) and the [indexer guide](apps/docs/src/app/docs/indexer/page.mdx).   |

## Client packages

| Package                                | Purpose                                    |
| -------------------------------------- | ------------------------------------------ |
| [`@lsp-indexer/types`](packages/types) | Shared schemas and types                   |
| [`@lsp-indexer/node`](packages/node)   | Typed queries, services and parsers        |
| [`@lsp-indexer/react`](packages/react) | React providers, queries and subscriptions |
| [`@lsp-indexer/next`](packages/next)   | Next.js server integration and hooks       |

For a Node.js consumer:

```bash
pnpm add @lsp-indexer/node
```

See the [Node.js guide](apps/docs/src/app/docs/node/page.mdx) for client configuration and queries.
Configure public clients with the appropriate read-only access; Hasura admin credentials belong
in operator configuration, not browser bundles.

## Run locally with Docker

You need Docker with Compose, a working LUKSO RPC endpoint and a Hasura admin secret. From a clone
of this repository:

```bash
cp .env.example .env
# Edit .env: set RPC_URL and HASURA_GRAPHQL_ADMIN_SECRET.
# Set SQD_API_KEY if the configured archive requires it.
cd docker
./manage.sh start
./manage.sh status
./manage.sh logs indexer 50
```

This starts the development stack, including PostgreSQL, Hasura and monitoring. Hasura is required
by the current container entrypoint. The development Compose file builds the indexer from source;
use `docker compose --env-file ../.env up -d --build` from `docker/` to rebuild after source changes.
See the [quickstart](docs/docker/QUICKSTART.md) for startup checks and teardown.

For production, copy the same root template to `.env.prod` and set all six variables enforced by
[production Compose](docker/docker-compose.prod.yml): `POSTGRES_PASSWORD`,
`HASURA_GRAPHQL_ADMIN_SECRET`, `RPC_URL`, `SQD_API_KEY`, `GRAFANA_ADMIN_USER` and
`GRAFANA_ADMIN_PASSWORD`. Choose an indexer image tag for the intended release. Follow the
[production deployment guide](docker/README.md#production-deployment); the development command
above does not select the production Compose file.

The container generates and applies database migrations, waits for Hasura, applies its metadata,
and then starts indexing. You do not need to repeat those steps manually when using the container.
Back up existing data and review schema changes before upgrading an existing deployment.

## Repository layout

```text
packages/
  indexer/          Event pipeline, integrated ABI/entity codegen and migrations
  types/            Shared client schemas and types
  node/             Typed GraphQL client services and parsers
  react/            React queries and subscriptions
  next/             Next.js integration
  comparison-tool/  Indexer comparison tooling
apps/docs/          Next.js documentation and playground
charts/lsp-indexer/ Kubernetes Helm chart
docker/             Images, development/production Compose and management scripts
docs/               Architecture, contribution and deployment guides
sql/                SQL resources
```

ABI definitions and generated TypeORM entities live inside `packages/indexer`; there are no
separate `packages/abi` or `packages/typeorm` workspaces.

## Development

Use the Node.js versions pinned in [CI](.github/workflows/ci.yml) and the
[indexer Dockerfile](docker/Dockerfile), and the pnpm version pinned in [package.json](package.json).
For the indexer package:

```bash
pnpm install --frozen-lockfile
pnpm --filter @chillwhales/indexer build
```

The build runs ABI/entity code generation before compiling TypeScript. The client packages have
additional GraphQL code-generation configuration; consult the [contribution guide](docs/CONTRIBUTING.md)
and their manifests when working on those packages. Keep `pnpm-lock.yaml` when troubleshooting
installs so dependency resolution remains reproducible.

Supported standards, environment settings and pipeline details are documented in the
[indexer guide](apps/docs/src/app/docs/indexer/page.mdx) and [architecture](docs/ARCHITECTURE.md).

## License

[MIT](LICENSE).
