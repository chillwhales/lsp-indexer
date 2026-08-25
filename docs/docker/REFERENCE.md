# Docker reference for LSP Indexer v3

## Architecture

The Compose topology has one failure boundary per network:

```text
PostgreSQL
  ├─ login provisioning → one-shot schema migration
  ├─ LUKSO indexer      + LUKSO metadata worker
  ├─ Ethereum indexer   + Ethereum metadata worker
  └─ Hasura metadata DB + read-only v3 API source → metadata apply

Alloy → Prometheus/Loki → Grafana
```

Both indexers use the Pipes `portal`, `rpc`, or ordered `fallback` source mode. Each network writes to
its own PostgreSQL schema using a distinct login. Metadata workers share only their network's writer
boundary. Hasura queries generated API views through a separate read-only login.

## Compose files

`docker-compose.yml` owns the entire topology and local defaults. `docker-compose.prod.yml` is an
override and is not standalone:

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  --env-file .env.prod \
  config
```

The production render fails unless these are present:

- immutable `INDEXER_VERSION`
- PostgreSQL, runtime, API, Hasura, and Grafana passwords
- LUKSO and Ethereum RPC URLs
- Grafana admin user

Generate hexadecimal passwords so they remain safe inside PostgreSQL URLs:

```bash
openssl rand -hex 32
```

## Service lifecycle

| Service                                              | Lifecycle    | Purpose                                         |
| ---------------------------------------------------- | ------------ | ----------------------------------------------- |
| `postgres`                                           | long-running | v3 state and Hasura metadata                    |
| `database-logins`                                    | one-shot     | create/update unprivileged login roles          |
| `migration`                                          | one-shot     | validate boundaries and migrate enabled schemas |
| `indexer-lukso`                                      | long-running | LUKSO event ingestion                           |
| `metadata-lukso`                                     | long-running | LUKSO metadata queue                            |
| `indexer-ethereum`                                   | long-running | Ethereum event ingestion                        |
| `metadata-ethereum`                                  | long-running | Ethereum metadata queue                         |
| `hasura`                                             | long-running | v3 GraphQL API                                  |
| `hasura-apply`                                       | one-shot     | deterministic metadata apply/consistency check  |
| `alloy`, `prometheus`, `loki`, `grafana`, `cadvisor` | long-running | observability                                   |

`service_completed_successfully` dependencies prevent a runtime from starting against an unmigrated
schema. Re-running login provisioning and migrations is idempotent; unexpected privileges,
memberships, ownership, migration history, or schema fingerprints fail closed.

Local indexers use `on-failure`, so a bounded backfill exits zero and stays complete. The production
override removes both `INDEXER_TO_BLOCK` values and changes the unbounded indexers to
`unless-stopped`. `manage.sh health` accepts either a live health endpoint or a bounded local
indexer container that exited successfully.

## Commands

```bash
cd docker
./manage.sh help
./manage.sh start
./manage.sh status
./manage.sh logs indexer-lukso
./manage.sh migrate
./manage.sh hasura-apply
./manage.sh db
./manage.sh db-dump ./backup.dump
./manage.sh down
```

Add `--production` immediately after `manage.sh` to use `.env.prod` and the production override:

```bash
./manage.sh --production config
./manage.sh --production start
./manage.sh --production health
```

The production override requires Compose v2.24.4 or newer. It explicitly removes every local build
context, so the stack can run only the immutable registry image selected by `INDEXER_VERSION`.

Set `LSP_INDEXER_ENV_FILE` to select a different environment file without copying or sourcing it.

## Network configuration

The default enabled migration set is `lukso-mainnet,ethereum-mainnet`. Runtime configuration is
network-specific:

- `INDEXER_SOURCE_MODE_<NETWORK>`
- `INDEXER_FROM_BLOCK_<NETWORK>` / `INDEXER_TO_BLOCK_<NETWORK>`
- `INDEXER_RPC_RATE_LIMIT_<NETWORK>`
- `RPC_URL_<NETWORK>`
- `SQD_PORTAL_URL_<NETWORK>`
- `METADATA_IPFS_GATEWAYS_<NETWORK>`

The shared fallback thresholds apply to both indexers. Keep an explicit RPC available when using
fallback, especially for LUKSO while its Portal dataset is historical.

Ethereum Sepolia is supported by the v3 runtime and Helm values. The fixed local Compose topology
runs two networks to keep the acceptance boundary small; use the chart or an explicit additional
service pair when a third simultaneous process is required.

## Security boundary

The PostgreSQL admin URL exists only in `migration` and Hasura's metadata connection. Indexer and
metadata containers receive one network login each. Hasura's v3 data source receives the API reader
login. Runtime containers never receive the admin URL.

`HASURA_GRAPHQL_ENABLE_CONSOLE`, `HASURA_GRAPHQL_DEV_MODE`, and
`HASURA_GRAPHQL_ENABLED_LOG_TYPES` control the local API process. The production override always
disables the console and development mode; keep log types free of query variables or secrets.

PostgreSQL binds to loopback only. Production disables the Hasura console and development errors.
Use an external secret manager or Compose secrets in a real deployment; an env file is a local
operator interface, not a secret-management system.

## Metrics, alerts, and logs

Pipes exposes `/health` and `/metrics` from every runtime. Alloy attaches `component` and
`deployment_network` labels, scrapes the four endpoints, and forwards samples to Prometheus. The
shared dashboard shows:

- committed head, finality, cursor, and wall-clock lag
- database availability and cursor drift
- active/failing fallback source and source switches
- committed and diagnostic block throughput
- resident memory and CPU for every indexer and metadata worker
- metadata job counts and oldest backlog age

Prometheus evaluates availability, missing-committed-head, source-stall, lag, cursor-drift,
source-flapping, and metadata-age rules. The Compose stack does not bundle notification credentials;
connect Prometheus to the target Alertmanager. Alloy sends Docker logs to Loki. Grafana provides
both datasources.

## Backup and recovery

Manual backup:

```bash
./manage.sh --production db-dump ./v3-$(date -u +%Y%m%d).dump
```

A backup is not accepted until a restore drill proves that migration history, schema fingerprints,
committed heads, and cursor state are intact and indexing resumes without gaps. Use the
[recovery runbook](../../.github/runbooks/v3-recovery.md). CloudNativePG scheduled backups in the Helm
chart are the reference automated path.

## Production acceptance

Do not cut traffic over merely because containers are healthy. The required gates are documented in
the [acceptance runbook](../../.github/runbooks/v3-acceptance.md): exact finalized-height parity,
failure/recovery drills, a 24-hour two-network soak, resource/lag evidence, backup restoration, and an
owner decision. The permanent v3-to-main pull request remains owner-controlled.
