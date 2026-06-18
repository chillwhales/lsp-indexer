# lsp-indexer Helm chart

Umbrella chart for running the LSP Indexer on Kubernetes.

## Deployment contract

- Docs app is served at `https://indexer.chillwhales.dev/`.
- Hasura stays internal except for the exact public GraphQL route
  `https://indexer.chillwhales.dev/v1/graphql`.
- The `/v1/graphql` ingress uses a prefix path that routes to Hasura's native
  `/v1/graphql` endpoint before the docs catch-all route.
- Hasura console, metadata, and health endpoints are not exposed through ingress.
- Runtime secrets are supplied by existing Kubernetes Secrets, usually sealed in
  the GitOps repository.
- Production image tags must be overridden by the cluster values overlay. The
  default `sha-operator-required` tag is a sentinel, not a deployable release.

## Required Secrets

`secrets.existingSecret` is read by the indexer and Hasura:

| Key | Purpose |
| --- | --- |
| `HASURA_GRAPHQL_ADMIN_SECRET` | Hasura admin secret used by Hasura and the indexer entrypoint |
| `RPC_URL` | LUKSO RPC endpoint consumed by the indexer |
| `SQD_API_KEY` | Optional SQD legacy gateway API key consumed by the indexer when `secrets.keys.sqdApiKey` is set |

`cnpg.bootstrap.secretName` is an existing `kubernetes.io/basic-auth` Secret
used by CloudNativePG during `initdb`. By default, Hasura and the indexer also
read the username and password keys specified by `postgres.passwordSecret` from
this Secret for their database URLs so runtime credentials cannot drift from the
database owner credentials. It must contain:

| Key | Purpose |
| --- | --- |
| `username` | Database owner username; must match `cnpg.bootstrap.owner` |
| `password` | Database owner password |

The rendered deployments read credentials from Secrets at pod startup and
percent-encode `POSTGRES_PASSWORD` before constructing database URLs. Generated
passwords may contain URL-reserved characters such as `+`, `/`, and `=`.

The chart defaults to a dedicated `lsp_indexer` database and owner rather than
the PostgreSQL superuser role. When backups are enabled, CNPG reads the S3 access
key from `cnpg.backup.accessKeyIdKey` and the S3 secret key from
`cnpg.backup.secretAccessKeyKey`; these default to `ACCESS_KEY_ID` and
`SECRET_ACCESS_KEY`. Set `cnpg.backup.secretAccessKeyKey` in the values overlay
when a cluster uses a different Secret key name.

## Images

The repository publishes two images through the `Build images` workflow:

- `ghcr.io/chillwhales/lsp-indexer:sha-<short>`
- `ghcr.io/chillwhales/lsp-indexer-docs:sha-<short>`

The docs image currently bakes these public build-time variables:

- `NEXT_PUBLIC_INDEXER_URL=https://indexer.chillwhales.dev/v1/graphql`
- `NEXT_PUBLIC_INDEXER_WS_URL=wss://indexer.chillwhales.dev/v1/graphql`

If preview environments need per-PR hosts later, move the docs app to runtime
public configuration before adding an ApplicationSet.

## Minimal values overlay

```yaml
global:
  imagePullSecrets:
    - name: ghcr-pull-chillwhales

indexer:
  image:
    tag: sha-abcdef0

docs:
  image:
    tag: sha-abcdef0

secrets:
  existingSecret: lsp-indexer-secrets
  keys:
    sqdApiKey: SQD_API_KEY

cnpg:
  bootstrap:
    secretName: lsp-indexer-db
  backup:
    enabled: true
    existingSecret: cnpg-minio-credentials
    destinationPath: s3://cnpg-backups/lsp-indexer
```
