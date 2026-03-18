<!-- This file is auto-generated from src/app/docs/indexer/page.mdx — do not edit directly. Run `pnpm --filter docs generate` to regenerate. -->

# @lsp-indexer/indexer

The indexer is a [Subsquid](https://subsquid.io/)-based blockchain processor that listens to
LUKSO L1 events, decodes them according to LSP standards, and writes normalized data to PostgreSQL.
Hasura then exposes that database as a GraphQL API.

---

## Architecture

```mermaid
graph LR
  A[LUKSO L1] --> B[Subsquid Gateway]
  B --> C[Indexer]
  C --> D[PostgreSQL]
  D --> E[Hasura GraphQL]
  C -.-> F[IPFS / HTTP]
  F -.-> C
```

### Pipeline (6 steps)

1. **Extract** — EventPlugins decode blockchain events into entities
2. **Persist Raw** — Batch-insert all raw event entities
3. **Handle** — EntityHandlers create derived entities (token names, tallies, NFT metadata)
4. **Persist Derived** — Batch-insert handler output
5. **Verify** — Batch `supportsInterface()` via Multicall3 to validate addresses
6. **Enrich** — Batch-update FK references on already-persisted entities

### Supported LSP Standards

| Standard | What it indexes                                           |
| -------- | --------------------------------------------------------- |
| LSP0     | Universal Profiles (ERC725Account)                        |
| LSP3     | Profile metadata (name, description, images, links, tags) |
| LSP4     | Digital Asset metadata (token name, symbol, icons)        |
| LSP5     | Received Assets (asset registry per profile)              |
| LSP7     | Fungible token transfers and balances                     |
| LSP8     | NFT transfers, token IDs, and metadata                    |
| LSP12    | Issued Assets (assets created by a profile)               |
| LSP26    | Follower system (follow/unfollow events)                  |
| LSP29    | Encrypted assets                                          |
| LSP31    | URI decoding (multi-backend: IPFS, HTTP, base64)          |

---

## Running with Docker

### Prerequisites

- Docker 24+ and Docker Compose v2
- 8GB RAM minimum (PostgreSQL + Indexer + Hasura + Grafana)

### Quick Start

```bash
git clone https://github.com/chillwhales/lsp-indexer.git
cd lsp-indexer

# Configure environment
cp .env.example .env
# Edit .env — at minimum set:
#   HASURA_GRAPHQL_ADMIN_SECRET=your-secret-here

# Start everything
cd docker
docker compose --env-file ../.env up -d
```

### Services

| Service    | Port | Purpose               |
| ---------- | ---- | --------------------- |
| PostgreSQL | 5432 | Database storage      |
| Hasura     | 8080 | GraphQL API + Console |
| Indexer    | —    | Blockchain processor  |
| Grafana    | 3000 | Monitoring dashboards |
| Loki       | —    | Log aggregation       |
| Prometheus | —    | Metrics storage       |

### Environment Variables

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Blockchain sources
SQD_GATEWAY=https://v2.archive.subsquid.io/network/lukso-mainnet
RPC_URL=https://rpc.lukso.sigmacore.io
RPC_RATE_LIMIT=10
FINALITY_CONFIRMATION=75

# IPFS & Metadata
IPFS_GATEWAY=https://api.universalprofile.cloud/ipfs/
METADATA_WORKER_POOL_SIZE=4

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=your-secret-here
HASURA_GRAPHQL_ENABLE_CONSOLE=true
```

### Logs and Monitoring

```bash
# Follow indexer logs
docker compose --env-file ../.env logs -f indexer

# Open Hasura Console
open http://localhost:8080/console

# Open Grafana dashboards
open http://localhost:3000
```

---

## Running from Source

For development on the indexer itself:

```bash
# Install dependencies
pnpm install

# Build codegen packages first
pnpm --filter=@chillwhales/abi build
pnpm --filter=@chillwhales/typeorm build

# Build the indexer
pnpm --filter=@chillwhales/indexer build

# Run (requires PostgreSQL and Hasura running)
cd packages/indexer
node lib/app/index.js
```

---

## Hasura Configuration

On first startup, the indexer's entrypoint script automatically configures Hasura:

- Tracks all tables as GraphQL types
- Creates relationships between entities
- Sets up public read access (no auth required for queries)
- Configures subscriptions via WebSocket

After initial setup, the Hasura Console at `http://localhost:8080/console` lets you browse
the schema, run queries, and inspect relationships.

---

## Data Model

The indexer produces these main entity types:

| Entity         | Table             | Description                           |
| -------------- | ----------------- | ------------------------------------- |
| Profile        | `profile`         | Universal Profiles with LSP3 metadata |
| DigitalAsset   | `digital_asset`   | LSP7/LSP8 tokens with LSP4 metadata   |
| NFT            | `nft`             | Individual LSP8 token instances       |
| OwnedAsset     | `owned_asset`     | Profile → asset ownership             |
| OwnedToken     | `owned_token`     | Profile → NFT token ownership         |
| Creator        | `creator`         | Profile → asset creator relationship  |
| IssuedAsset    | `issued_asset`    | Assets issued by a profile            |
| Follow         | `follow`          | LSP26 follower relationships          |
| Transfer       | `transfer`        | LSP7 and LSP8 transfer events         |
| DataChanged    | `data_changed`    | ERC725Y data key change events        |
| EncryptedAsset | `encrypted_asset` | LSP29 encrypted asset metadata        |

---

## Next Steps

- [Quickstart](/docs/quickstart) — Install consumer packages and start querying
- [@lsp-indexer/node](/docs/node) — Low-level fetch functions and query keys
- [@lsp-indexer/react](/docs/react) — Client-side React hooks
- [@lsp-indexer/next](/docs/next) — Next.js server actions and hooks
