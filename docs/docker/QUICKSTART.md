# Docker quickstart

## Prerequisites

- Docker 24 or newer with Compose v2.24.4 or newer
- enough disk for PostgreSQL and the selected block ranges
- RPC access for LUKSO and Ethereum

## 1. Configure a bounded run

From the repository root:

```bash
cp .env.example .env
```

For a quick validation, edit `.env` and set an inclusive upper bound for each process:

```dotenv
INDEXER_FROM_BLOCK_LUKSO_MAINNET=0
INDEXER_TO_BLOCK_LUKSO_MAINNET=100
INDEXER_FROM_BLOCK_ETHEREUM_MAINNET=0
INDEXER_TO_BLOCK_ETHEREUM_MAINNET=100
```

The defaults are unbounded and are intended for a complete backfill. A fresh database must start at
each network's configured origin; use `probe:network` when you need an arbitrary later source range
without persistence. Do not accidentally begin a full chain replay on a small development host.

## 2. Validate and start

```bash
cd docker
./manage.sh config
./manage.sh start
./manage.sh status
```

The one-shot `database-logins`, `migration`, and `hasura-apply` services should show exit code zero.
The metadata workers remain healthy; each bounded local indexer becomes healthy while running and
then exits zero at its configured final block without restarting.

## 3. Inspect

```bash
./manage.sh health
./manage.sh logs indexer-lukso
./manage.sh logs indexer-ethereum
./manage.sh logs metadata-lukso
```

- Hasura: `http://localhost:8080`
- Grafana: `http://localhost:3000`
- PostgreSQL: `postgresql://postgres:postgres@127.0.0.1:5432/lsp_indexer_v3`

The local Hasura admin secret is `hasura-local`. These development defaults must never be used in a
shared or production environment.

## 4. Stop without deleting data

```bash
./manage.sh down
```

Named volumes remain. Volume deletion is deliberately not wrapped by `manage.sh`; deleting indexed
or monitoring data requires an explicit Docker command and operator decision.

For production configuration and recovery, continue with the [reference](./REFERENCE.md).
