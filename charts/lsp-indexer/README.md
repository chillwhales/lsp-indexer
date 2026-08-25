# LSP Indexer v3 Helm chart

This chart deploys the from-scratch, multi-chain v3 stack. It does not run the legacy Squid or
TypeORM indexer.

## Deployment contract

- One `Recreate` indexer Deployment and one `Recreate` metadata-worker Deployment are rendered for
  every enabled network. Stable Pipes IDs come from the chain ID, never the pod name.
- Every network gets a distinct PostgreSQL login, database URL, RPC URL, physical chain schema,
  metrics Service, and failure boundary.
- A revision-named Job applies the idempotent Drizzle migrations for all enabled networks. Runtime
  init containers wait for its schema/role boundary before starting. Completed migration Jobs are
  retained for one day for evidence and then removed by the Kubernetes TTL controller. The revision
  hashes the chart version and every value that affects the immutable Job pod template, including
  image-pull Secrets and database Secret keys, so an upgrade creates a new Job instead of attempting
  an invalid in-place patch.
- Hasura uses the CNPG owner only for its metadata database. Its `v3` data source uses the separate,
  read-only URL in `HASURA_GRAPHQL_V3_DATABASE_URL`.
- A post-install/post-upgrade Job waits for Hasura, replaces only the generated `v3` source, and
  rejects inconsistent metadata.
- Docs are served at the configured ingress root. Only `/v1/graphql` is routed to Hasura; the
  console, metadata API, and health endpoint remain internal.
- The default `sha-operator-required` image tags are sentinels. A deployment overlay must select
  reviewed immutable image tags.
- Indexer Deployments are unbounded services. Run a finite parity replay through the CLI or local
  Compose stack; setting `INDEXER_TO_BLOCK` in a Deployment would restart completed work forever.

The runtime containers are non-root, do not receive service-account tokens, drop Linux
capabilities, and use read-only root filesystems. The default egress policy permits cluster DNS,
the release's CNPG pods, and public HTTP(S), while excluding private and reserved IPv4 ranges. Add
`networkPolicy.additionalEgress` rules for an approved external database or private RPC, Portal, or
IPFS endpoint. Metadata workers receive only their network database credential; RPC credentials are
mounted into the corresponding indexer alone.

## Required Secrets and logins

`secrets.existingSecret` must already contain full URLs and source credentials:

| Default key                      | Consumer                    | Purpose                          |
| -------------------------------- | --------------------------- | -------------------------------- |
| `HASURA_GRAPHQL_ADMIN_SECRET`    | Hasura and metadata hook    | One-shot Hasura administration   |
| `DATABASE_ADMIN_URL`             | Migration hook              | One-shot migration administrator |
| `HASURA_GRAPHQL_V3_DATABASE_URL` | Hasura                      | Read-only v3 API login           |
| `DATABASE_URL_LUKSO_MAINNET`     | LUKSO indexer and worker    | LUKSO-only writer login          |
| `DATABASE_URL_ETHEREUM_MAINNET`  | Ethereum indexer and worker | Ethereum-only writer login       |
| `DATABASE_URL_ETHEREUM_SEPOLIA`  | Optional Sepolia processes  | Sepolia-only writer login        |
| `RPC_URL_LUKSO_MAINNET`          | LUKSO indexer               | Validated LUKSO RPC endpoint     |
| `RPC_URL_ETHEREUM_MAINNET`       | Ethereum indexer            | Validated Ethereum RPC endpoint  |
| `RPC_URL_ETHEREUM_SEPOLIA`       | Optional Sepolia indexer    | Validated Sepolia RPC endpoint   |

Provision the login names in `indexer.networks[*].runtimeLogin` and
`indexer.migration.apiLogin` before the migration hook runs. The migrator does not create login
credentials. It grants each existing runtime login only its network writer role and grants the API
login only the non-login read role. The full URLs above must use those same logins; never place the
migration administrator in a long-running runtime Secret.

`cnpg.bootstrap.secretName` is a separate `kubernetes.io/basic-auth` Secret used to create the CNPG
database owner. Its `username` must match `cnpg.bootstrap.owner`. Hasura constructs only its metadata
database URL from this Secret.

When object-store backups are enabled, `cnpg.backup.existingSecret` contains the keys selected by
`accessKeyIdKey` and `secretAccessKeyKey`. The optional Reflector shell copies that Secret from the
configured infrastructure namespace.

## Production overlay

```yaml
global:
  imagePullSecrets:
    - name: ghcr-pull-chillwhales

indexer:
  image:
    tag: sha-abcdef0
  networks:
    - key: lukso-mainnet
      enabled: true
      runtimeLogin: lsp_v3_lukso_mainnet
      databaseSecretKey: DATABASE_URL_LUKSO_MAINNET
      rpcSecretKey: RPC_URL_LUKSO_MAINNET
      portalUrl: https://portal.sqd.dev/datasets/lukso-mainnet
      sourceMode: fallback
      rpcRateLimit: 10
      fromBlock: '0'
      metricsPort: 9090
      metadataMetricsPort: 9091
      ipfsGateways: https://api.universalprofile.cloud/ipfs/
    - key: ethereum-mainnet
      enabled: true
      runtimeLogin: lsp_v3_ethereum_mainnet
      databaseSecretKey: DATABASE_URL_ETHEREUM_MAINNET
      rpcSecretKey: RPC_URL_ETHEREUM_MAINNET
      portalUrl: https://portal.sqd.dev/datasets/ethereum-mainnet
      sourceMode: fallback
      rpcRateLimit: 10
      fromBlock: '0'
      metricsPort: 9090
      metadataMetricsPort: 9091
      ipfsGateways: https://ipfs.io/ipfs/

hasura:
  replicaCount: 2

docs:
  image:
    tag: sha-abcdef0

cnpg:
  instances: 2
  backup:
    enabled: true
    schedule: '0 0 2 * * *'
    retentionPolicy: 30d
    existingSecret: cnpg-minio-credentials
    destinationPath: s3://cnpg-backups/lsp-indexer-v3
    reflector:
      enabled: true
      sourceNamespace: infrastructure

monitoring:
  enabled: true
```

Replace the network list as one complete value in overlays; Helm arrays do not merge by `key`.

## Observability

With `monitoring.enabled=true`, the chart creates a ServiceMonitor, alerts, and the
`LSP Indexer v3` Grafana dashboard. Alerts cover process/database availability, committed-head
absence and lag, cursor drift, all-source stalls, source flapping, and old metadata work. Runtime gauges read
the committed PostgreSQL indexed head and Pipes cursor, so a processed-but-uncommitted batch never
looks healthy. The dashboard shows both committed and diagnostic processed throughput plus
per-process resident memory and CPU for every indexer and metadata worker. It expects the Prometheus
Grafana datasource UID to be `prometheus`.

The Prometheus Operator CRDs must exist before enabling monitoring. CNPG and ScheduledBackup CRDs
must exist before enabling their resources.

## Backups and rollout safety

`cnpg.backup.enabled=true` configures both the object store on the Cluster and a CNPG
`ScheduledBackup`. Backups are not accepted until an operator restores one into an isolated cluster,
checks the catalog, starts an indexer from the restored cursor, and records the exercise.

Use the repository runbooks for deployment, [backup/recovery](../../.github/runbooks/v3-recovery.md),
[shadow acceptance](../../.github/runbooks/v3-acceptance.md), and
[cutover/rollback](../../.github/runbooks/v3-cutover.md). Never delete v2 state or merge the
integration PR as part of a Helm release.
