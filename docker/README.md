# LSP Indexer v3 with Docker

This directory runs only the Pipes-based v3 indexer. The base Compose file starts isolated LUKSO
and Ethereum indexers, one metadata worker per network, PostgreSQL, Hasura, and the local monitoring
stack. The production file is a small override, so service topology is maintained in one place.
Compose v2.24.4 or newer is required for the production file's explicit build-context reset.

## Startup order

1. PostgreSQL becomes healthy.
2. `database-logins` creates or updates the enabled networks' unprivileged runtime logins and the
   read-only API login.
3. `migration` creates the v3 schemas, generated writer/reader roles, and API views, then grants each
   login only its intended role.
4. The two indexers and two metadata workers start independently.
5. Hasura starts with its metadata database login and the read-only v3 data-source login.
6. `hasura-apply` applies deterministic metadata and rejects inconsistencies.

The login, migration, and Hasura-apply containers are expected to finish with exit code zero. A
bounded local indexer also exits zero at its configured final block and is not restarted; production
uses `unless-stopped` for its unbounded indexers. `manage.sh health` treats a successful bounded exit
as complete rather than unhealthy.

## Local stack

```bash
cp .env.example .env

# For a short local run, set bounded ranges in .env first.
# INDEXER_TO_BLOCK_LUKSO_MAINNET=100
# INDEXER_TO_BLOCK_ETHEREUM_MAINNET=100

cd docker
./manage.sh config
./manage.sh start
./manage.sh status
./manage.sh logs indexer-lukso
```

Hasura is exposed on port `8080`, Grafana on `3000`, and PostgreSQL only on
`127.0.0.1:5432` by default.

## Production override

```bash
cp .env.example .env.prod
# Fill every production-required value, use URL-safe random passwords, pin
# INDEXER_VERSION to an immutable sha-* image, and configure private RPCs.
# Production deliberately removes local INDEXER_TO_BLOCK bounds.

cd docker
./manage.sh --production config
./manage.sh --production start
./manage.sh --production health
```

The equivalent direct command is:

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.prod.yml \
  --env-file .env.prod \
  up -d
```

The override disables local builds, requires every enabled-network secret and both production RPC
endpoints, disables the Hasura console/dev mode, and requires an immutable operator-selected image
tag.

For Kubernetes production, the Helm chart is the reference deployment because it also provides
CloudNativePG replication, scheduled object-store backups, PodDisruptionBudgets, NetworkPolicies,
ServiceMonitor discovery, PrometheusRule alerts, and Argo CD ordering.

## Monitoring

Grafana provisions the shared v3 dashboard from `charts/lsp-indexer/dashboards/v3-overview.json`.
Alloy scrapes both indexer and metadata metrics endpoints and forwards them to Prometheus. The local
Prometheus evaluates `prometheus/alerts.yml`; connect an Alertmanager in the target environment to
route notifications. Alloy also forwards container logs to Loki.

Important signals include committed block lag, committed head/cursor drift, database availability,
missing committed heads, active Pipes source, fallback switches, throughput, and metadata backlog
age.

## Backups and restore

Create a manual custom-format backup:

```bash
./manage.sh db-dump ./v3-backup.dump
```

The Docker stack does not claim scheduled-backup durability. Production operators must schedule and
test PostgreSQL backups externally, or use the chart's CloudNativePG `ScheduledBackup`. Follow
`.github/runbooks/v3-recovery.md` for restore and replay validation. Never treat an untested backup as
a passing recovery gate.

## Files

- `Dockerfile` — reproducible Node 22/pnpm 10 v3-only image
- `docker-compose.yml` — shared two-network topology
- `docker-compose.prod.yml` — production-only requirements and image override
- `entrypoint.sh` — explicit v3 runtime and acceptance commands
- `postgres/init-v3-logins.sh` — idempotent login provisioning
- `alloy/`, `prometheus/`, `loki/`, `grafana/` — local observability
- `manage.sh` — small wrapper around the two Compose modes

See [the public Docker quickstart](../docs/docker/QUICKSTART.md),
[the reference](../docs/docker/REFERENCE.md), and
[the v3 deployment runbook](../.github/runbooks/v3-deployment.md).
