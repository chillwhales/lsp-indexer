# lsp-indexer Helm chart

Umbrella chart for running the LSP Indexer on Kubernetes.

## Deployment contract

- Docs app is served at `https://indexer.chillwhales.dev/`.
- Hasura stays internal except for the exact public GraphQL route
  `https://indexer.chillwhales.dev/graphql`.
- The `/graphql` ingress rewrites to Hasura's native `/v1/graphql` endpoint.
- Hasura console, metadata, and health endpoints are not exposed through ingress.
- Runtime secrets are supplied by existing Kubernetes Secrets, usually sealed in
  the GitOps repository.
- Production image tags must be overridden by the cluster values overlay. The
  default `sha-operator-required` tag is a sentinel, not a deployable release.

## Required Secrets

`secrets.existingSecret` is read by the indexer and Hasura:

| Key | Purpose |
| --- | --- |
| `POSTGRES_PASSWORD` | Password used in the app database URL |
| `HASURA_GRAPHQL_ADMIN_SECRET` | Hasura admin secret used by Hasura and the indexer entrypoint |
| `RPC_URL` | LUKSO RPC endpoint consumed by the indexer |

`cnpg.bootstrap.secretName` is an existing `kubernetes.io/basic-auth` Secret
used by CloudNativePG during `initdb`. It must contain:

| Key | Purpose |
| --- | --- |
| `username` | Database owner username |
| `password` | Database owner password |

In production the same password should back both Secrets so the app database URL
and CNPG bootstrap owner credentials agree.

The rendered database URLs use Kubernetes environment variable expansion for
`POSTGRES_PASSWORD`; credentials are read from Secrets at pod startup rather than
embedded into Helm-rendered manifests.

## Images

The repository publishes two images through the `Build images` workflow:

- `ghcr.io/chillwhales/lsp-indexer:sha-<short>`
- `ghcr.io/chillwhales/lsp-indexer-docs:sha-<short>`

The docs image currently bakes these public build-time variables:

- `NEXT_PUBLIC_INDEXER_URL=https://indexer.chillwhales.dev/graphql`
- `NEXT_PUBLIC_INDEXER_WS_URL=wss://indexer.chillwhales.dev/graphql`

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

cnpg:
  bootstrap:
    secretName: lsp-indexer-db
  backup:
    enabled: true
    existingSecret: cnpg-minio-credentials
    destinationPath: s3://cnpg-backups/lsp-indexer
```
