<!-- This file is auto-generated from src/app/docs/indexer/page.mdx.
     Do not edit directly — run `pnpm --filter docs generate` to regenerate. -->

# @lsp-indexer/indexer

The indexer is a [Subsquid](https://subsquid.io/)-based blockchain processor that listens to
LUKSO L1 events, decodes them according to LSP standards, and writes normalized data to PostgreSQL.
Hasura then exposes that database as a GraphQL API.

---

## Indexer v3 alpha development

V3 is being built from scratch in `packages/indexer-v3` on the SQD Pipes SDK. It runs beside the
deployable v2 indexer until domain parity, reorg correctness, package v3 releases, and shadow
production validation are complete. The current alpha foundation includes:

- A typed catalog for LUKSO Mainnet, Ethereum Mainnet, and Ethereum Sepolia
- One validated production network per process with stable EIP-155 Pipes identity
- Portal dataset, coverage, and real-time capability checks
- RPC chain-ID and configured-contract bytecode validation plus block-pinned Multicall reads
- Pipes EVM field selection and a bounded raw-log source probe
- Narrow Pipes-native queries and ABI decoding for all 11 v2 event-plugin signatures
- Current and legacy LSP0/LSP7/LSP8 verification with deterministic domain reducers
- UP, digital-asset, NFT, ownership, follower, registry, supply, and product-extension projections
- Drizzle tables and repeatable migrations for isolated PostgreSQL schemas per network
- Official Pipes PostgreSQL target wiring with atomic data, indexed-head, snapshot, and cursor writes
- Deterministic chain-scoped IDs, read-only cross-network API views, and PostgreSQL fork tests
- Finalized durable metadata jobs and independently scalable LSP3/LSP4/LSP8/LSP29 workers
- A local-only multi-network runner for source development

It does **not** yet include applied Hasura metadata or the v3 consumer package contracts. Those land
in subsequent v3 goals and the v2 implementation remains the production path meanwhile.

The new `chillwhales_nfts` domain is available only as a LUKSO Mainnet v3 alpha projection. It
stores CHILL/ORBS claim flags and Orb level, cooldown, and faction state; Node, React, and Next.js
consumer APIs are deliberately deferred to the v3 package-contract goal.

### Multi-chain process model

```mermaid
flowchart LR
  PortalA[Portal: network A] --> PipeA[Pipes process A]
  PortalB[Portal: network B] --> PipeB[Pipes process B]
  RpcA[RPC: network A] --> PipeA
  RpcB[RPC: network B] --> PipeB
  PipeA --> SchemaA[(chain_a schema)]
  PipeB --> SchemaB[(chain_b schema)]
  SchemaA <--> WorkerA[Metadata worker A]
  SchemaB <--> WorkerB[Metadata worker B]
  WorkerA --> Content[IPFS / HTTP]
  WorkerB --> Content
  SchemaA --> API[(read-only api views)]
  SchemaB --> API
```

Production uses one process or container per network. The SDK's multi-pipe development runner is
not a production supervisor: separate processes provide failure isolation and independent scaling.
Stream IDs and future database schemas are deterministic and cannot collide across the initial
catalog.

| Network key        | Chain ID | Pipes stream ID                  | Database schema          |
| ------------------ | -------: | -------------------------------- | ------------------------ |
| `lukso-mainnet`    |       42 | `lsp-indexer:v3:eip155:42`       | `chain_lukso_mainnet`    |
| `ethereum-mainnet` |        1 | `lsp-indexer:v3:eip155:1`        | `chain_ethereum_mainnet` |
| `ethereum-sepolia` | 11155111 | `lsp-indexer:v3:eip155:11155111` | `chain_ethereum_sepolia` |

The registry also carries optional LSP23 factory and LSP26 follower-system deployments with their
first safe indexing block. An unavailable contract is omitted instead of using the zero address.
The exported registry and every nested configuration value are read-only and frozen. Later domain
decoders can therefore select contract-scoped capabilities without scattering chain allowlists
through event modules.

### V3 environment variables

| Variable                                | Required | Default or behavior                                         |
| --------------------------------------- | -------- | ----------------------------------------------------------- |
| `INDEXER_NETWORK`                       | Yes      | One network key from the table above                        |
| `INDEXER_FROM_BLOCK`                    | No       | Network start, or a contiguous existing-cursor continuation |
| `INDEXER_TO_BLOCK`                      | No       | Inclusive bound; required for `probe:network`               |
| `SQD_PORTAL_URL`                        | No       | Selected network's catalog URL                              |
| `RPC_URL`                               | No       | Generic RPC override                                        |
| `RPC_URL_LUKSO_MAINNET`                 | No       | Network override; takes priority over `RPC_URL`             |
| `RPC_URL_ETHEREUM_MAINNET`              | No       | Network override; takes priority over `RPC_URL`             |
| `RPC_URL_ETHEREUM_SEPOLIA`              | No       | Network override; takes priority over `RPC_URL`             |
| `INDEXER_ALLOW_HISTORICAL_SOURCE`       | No       | `false`; explicit opt-in for an unbounded historical source |
| `INDEXER_METRICS_PORT`                  | No       | `9090` for the local development runner                     |
| `DATABASE_URL`                          | Runtime  | Generic runtime PostgreSQL URL                              |
| `DATABASE_URL_<NETWORK>`                | No       | Network override; takes priority over `DATABASE_URL`        |
| `DATABASE_ADMIN_URL`                    | Migrate  | Admin URL for the one-shot migration command                |
| `DATABASE_MIGRATION_NETWORKS`           | No       | Enabled comma-separated set; defaults to all networks       |
| `DATABASE_RUNTIME_LOGIN_<NETWORK>`      | No       | Existing login granted only its network writer role         |
| `DATABASE_POOL_MAX`                     | No       | `10`                                                        |
| `DATABASE_CONNECTION_TIMEOUT_MS`        | No       | `10000`                                                     |
| `DATABASE_IDLE_TIMEOUT_MS`              | No       | `30000`                                                     |
| `DATABASE_STATEMENT_TIMEOUT_MS`         | No       | `60000`                                                     |
| `DATABASE_LOCK_TIMEOUT_MS`              | No       | `10000`                                                     |
| `DATABASE_IDLE_TRANSACTION_TIMEOUT_MS`  | No       | `60000`                                                     |
| `DATABASE_UNFINALIZED_BLOCKS_RETENTION` | No       | Defaults to max(`1000`, finality × 4); must exceed finality |
| `METADATA_CONCURRENCY`                  | No       | `8` jobs per worker                                         |
| `METADATA_POLL_INTERVAL_MS`             | No       | `1000`                                                      |
| `METADATA_REQUEST_TIMEOUT_MS`           | No       | `15000`                                                     |
| `METADATA_MAX_RESPONSE_BYTES`           | No       | `2097152`                                                   |
| `METADATA_MAX_REDIRECTS`                | No       | `3`                                                         |
| `METADATA_MAX_ATTEMPTS`                 | No       | `6`                                                         |
| `METADATA_RETRY_BASE_MS`                | No       | `5000`                                                      |
| `METADATA_RETRY_MAX_MS`                 | No       | `1800000`                                                   |
| `METADATA_LEASE_TIMEOUT_MS`             | No       | `300000`; exceeds timeout × 5 locations × gateway count     |
| `METADATA_METRICS_PORT`                 | No       | `9091`; make unique for colocated network workers           |
| `METADATA_IPFS_GATEWAYS`                | No       | Ordered list; defaults to the network's configured gateway  |
| `METADATA_ALLOW_HTTP`                   | No       | `false`; explicitly permit public plain-HTTP sources        |
| `METADATA_RUN_ONCE`                     | No       | `false`; process one bounded claim batch and exit           |

Every URL, integer, boolean, block range, network key, Portal dataset, Portal starting height, RPC
chain ID, configured contract deployment, database role, database schema, and stored chain identity
is checked before the relevant program runs.

### V3 persistence model

`db:migrate` applies the same schema-relative Drizzle migrations to each enabled network. Each
chain schema has canonical block and event facts; profile, digital-asset, NFT, ownership, follower,
creator, issued-asset, permission, ERC725Y, Chillwhales, metadata, and indexed-head projections; a
durable metadata queue; and the Pipes cursor. All 16 application tables changed by ingestion have primary
keys and are registered with the official Pipes rollback target. A cluster-wide advisory lock
rejects concurrent migration commands. Raw event facts reference the exact canonical block hash,
and indexed heads reference that same exact block identity. Before advancing the head, the target
validates every parent link after the previously indexed head, so a replay cannot retain a stale
intermediate block and append a disconnected tip. Forward writes cannot move the indexed head
backwards; only Pipes rollback restoration can do that. Pipes cursor timestamps are milliseconds
and are converted directly to PostgreSQL timestamps without rescaling. Both current and finalized
head identities must reference exact canonical block rows. During forward processing, indexed heads
retain a known finalized watermark when a later source batch omits finality or reports a lower
height. An advancing finalized pair is accepted only when its local canonical block has the same
hash; a finalized block outside the stored range does not advance the watermark, and the finalized
number and hash must both be present or both be null. When a live source reports finality ahead of a
historical backfill cursor, the target records the processed cursor and its hash as the highest
finalized block available locally. The target consumes the loaded database configuration directly, so
`DATABASE_UNFINALIZED_BLOCKS_RETENTION` controls Pipes retention without a second fallback.
ERC725Y creator, issued-asset, and controller array indexes are unsigned 128-bit values stored as
`numeric(39, 0)` and mapped to TypeScript `bigint`, so adversarial high data-key indexes cannot
truncate or abort a batch. Every raw event topic array must be one-dimensional, nonempty, null-free,
contain only canonical lowercase bytes32 values, and start with the separately indexed `topic0`.

Mutable state is never shared across chains. The runtime login assumes one deterministic non-login
writer role and connects with `chain_<network>,lsp_v3,public` as its fixed `search_path`. The
`lsp_v3` schema contains only four immutable enum types so `api` views can `UNION ALL` identical
columns across chains; existing definitions must match their canonical labels and ordering, and any
other shared-schema object aborts migration. The `api` schema excludes migration history, cursors,
metadata jobs, snapshots, functions, and triggers. Unexpected API relations or routines abort
migration. Every chain schema's schema, relation, sequence, column, routine, type, and default ACLs
are also inventoried. Only its writer's privileges plus the API owner's non-grantable schema `USAGE`
and `SELECT` on enumerated public tables are accepted. PostgreSQL's non-grantable `PUBLIC USAGE` on
writer-owned table row types, including Pipes snapshots, is the sole ambient exception; `PUBLIC`
lacks chain-schema usage and relation privileges, so it cannot expose rows. The API reader may not
own a schema, relation, routine, type, or database and may hold only shared-enum usage, API schema
usage, and `SELECT` on the enumerated public views; any inventoried stale privilege aborts migration.
The inventory includes privileges inherited from PostgreSQL's `PUBLIC` pseudo-role and implicit
default ACLs on reachable user-defined routines and types. Public type usage is removed from the
shared enums and API view row types, and a publicly executable custom routine—including a
default-public `SECURITY DEFINER` routine—aborts migration. Migration installs a restrictive writer
function default and normalizes existing chain functions so Pipes rollback functions never retain
PostgreSQL's implicit `PUBLIC EXECUTE`.
Runtime readiness separately expands the active credential's effective `PUBLIC` privileges across
schemas, relations, columns, routines, types, the database, and default ACLs. Its allowlist is limited
to PostgreSQL's ambient system access, non-grantable connection and temporary-database access, and
canonical shared-enum usage. `PUBLIC CREATE`, grant options, and reachable custom routines abort
startup.

Before applying table migrations, `db:migrate` removes the enumerated API views so PostgreSQL can
change source columns that existing views depend on, then rebuilds the views after every enabled
schema is current. View removal, all enabled network migrations, and view replacement share one
PostgreSQL transaction, so a failure on any chain or during the rebuild rolls back earlier chain
changes and restores the prior views. Migration and startup also inventory the migration table,
cursor, and every expected chain table, plus the migration history sequence, and require the
deterministic writer role to own each one. A preflight with pending migrations audits all existing
expected objects while permitting latest-schema tables that the pending migrations have not created
yet; the post-migration audit requires the complete inventory. A deterministic PostgreSQL 17
live-catalog fingerprint covers all
non-snapshot tables and sequences, relation settings, columns and defaults, constraints, indexes,
and sequence parameters. Migration verifies a fully current schema before changing it and verifies
every schema afterward; startup readiness checks it again. Out-of-band added or dropped columns,
foreign keys, checks, indexes, and other reviewed storage objects are rejected even when the Drizzle
journal still matches. Dynamic Pipes `__snapshots` tables are excluded.

Create runtime login roles through your PostgreSQL provisioning system, then grant them during the
one-shot migration. Each login must be unique to one network, remain `LOGIN NOSUPERUSER NOCREATEDB
NOCREATEROLE NOREPLICATION NOBYPASSRLS`, and may reach only its assigned network writer role.
Migration and startup both revalidate every capability and reject direct or transitive memberships
in any other role. Deterministic schema owner and writer roles remain `NOLOGIN NOINHERIT
NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS` roles without direct or transitive
memberships in other roles. Migration also inventories every role that can reach a writer role and
allows only the migration admin and that network's configured runtime login. Runtime membership may
not carry `ADMIN OPTION` and must carry `SET OPTION` so the runtime pool can assume the writer role.
Migration and startup revalidate both membership options. Only the current migration admin may
reach the API owner role. Revoke the previous membership before rotating either credential.
Because a PostgreSQL session can `RESET ROLE`, migration and startup also reject direct ACLs,
object ownership, default ACLs, and policy references held by the underlying runtime login; the only
permitted direct database ACL is non-grantable `CONNECT` on the current database. The writer itself
may own or receive privileges only inside its assigned chain schema.
Its privileges outside that schema are non-grantable `USAGE` on `lsp_v3` and the four canonical
shared enums, plus a global function default ACL containing only the writer's own `EXECUTE`; that
default exists solely to remove implicit `PUBLIC EXECUTE`. Read-only grants on another chain,
shared-schema `CREATE`, grant options, foreign ownership, other default privileges, and policy
references all abort migration and readiness. Programmatic migration calls require every schema and
writer role to match the deterministic mapping for its network, reject reserved mappings and
duplicate identities, and require an existing chain schema to contain only its expected singleton
`network_config` identity:

```bash
DATABASE_ADMIN_URL=postgresql://migration_admin:secret@localhost/lsp_indexer_v3 \
DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET=lsp_v3_ethereum_runtime \
  pnpm --filter @chillwhales/indexer-v3 db:migrate
```

Verify that a runtime connection has the expected role and schema and remains inside its privilege
boundary. Readiness checks both the assumed role and the underlying session login for superuser
status, login and inheritance flags, database/role creation, replication, row-security bypass,
every reachable role membership, direct privilege or ownership dependencies, complete chain ACL
and ownership drift, effective `PUBLIC` privileges, live-catalog fingerprint drift, and foreign
write privileges:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 db:check
```

The PostgreSQL 17 integration suite creates a disposable database and proves clean and repeatable
migrations, same-address cross-chain isolation, writer privileges, atomic failure, deterministic
replay, snapshot placement, one- and multi-block rollback, finalized metadata claims, lease
recovery, and stale-write rejection:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost/postgres \
  pnpm --filter @chillwhales/indexer-v3 test:persistence
```

The released Pipes target does not reconcile existing snapshot tables when tracked columns change.
V3 therefore rejects ordinary pending schema migrations whenever rollback snapshot tables exist,
even when they are empty.

The projection rollout contains one reviewed `destructive-replay` alpha migration. Stop every v3
indexer before running it. The migration transactionally removes old snapshot functions, triggers,
and tables and clears every mutable chain table and Pipes cursor across all enabled networks while
preserving network identity and migration history. Pipes recreates all 16 rollback artifacts on
restart, and ingestion replays from the configured network start block. A fresh or reset schema
with a later `INDEXER_FROM_BLOCK` is rejected. With an existing cursor, a custom start is accepted
only when it does not leave a gap after the latest committed block. Other migrations cannot bypass
the snapshot guard.

### V3 raw event ingestion

The production event query selects only the signatures handled by the 11 v2 plugins. Global events
are topic-filtered; LSP23 and LSP26 events additionally use the selected network's configured
singleton address and deployment block. The query also requests and persists every block header,
including blocks without a matching event, so canonical parent links and the exact indexed-head
block identity remain continuous without storing unrelated logs. Pipes millisecond timestamps are
persisted directly.

| Event                    | Stored domain | Scope                |
| ------------------------ | ------------- | -------------------- |
| `DataChanged`            | `erc725y`     | Global exact topic   |
| `Executed`               | `erc725x`     | Global exact topic   |
| `UniversalReceiver`      | `lsp0`        | Global exact topic   |
| LSP7 `Transfer`          | `lsp7`        | Global exact topic   |
| LSP8 `Transfer`          | `lsp8`        | Global exact topic   |
| `OwnershipTransferred`   | `lsp14`       | Global exact topic   |
| `TokenIdDataChanged`     | `lsp8`        | Global exact topic   |
| `Follow`, `Unfollow`     | `lsp26`       | Configured singleton |
| `DeployedContracts`      | `lsp23`       | Configured singleton |
| `DeployedERC1167Proxies` | `lsp23`       | Configured singleton |

Every event fact includes network and chain identity; block number, hash, parent hash, and
timestamp; transaction hash and index; log index; and the lossless raw address, topics, and data.
The ID is deterministic from chain ID and log position. Decoded fields retain their familiar v2
names, while unsigned integers are JSON decimal strings and LSP8 transfers retain `amount: "1"`.

A known topic with malformed ABI data is still stored with its event name and domain and
`decoded = null`. Unknown topics and LSP23/LSP26 logs outside their configured address or deployment
range are not stored. Malformed fundamental provenance fails the transaction, leaving the Pipes
cursor unchanged.

### V3 domain projections

The event pipe also performs deterministic current-state reduction. It deduplicates verification
candidates by exact block number and hash, category, and address; checks current and legacy
LSP0/LSP7/LSP8 interface IDs through bounded direct reads before the configured Multicall3
deployment and bounded Multicall3 batches afterward; and pins every RPC read to its triggering
block. Each actual `eth_call` uses the Portal hash through EIP-1898 with canonical membership
required. The provider's block hash is also checked before and after either path, so results from a
changing fork or a different load-balanced backend cannot commit. The RPC endpoint must support
EIP-1898 block identifiers.

Only newly inserted event facts reach the reducer. Existing projection rows are loaded with bounded
state queries so a large Pipes batch cannot exceed PostgreSQL's bind-parameter limit. Facts are
applied in block, transaction, and log order to produce verified Universal Profiles and digital
assets; NFTs; supply; UP-scoped asset and token ownership; follower tombstones; creators; issued
assets; controllers and permissions; and raw ERC725Y current values. A transfer mutates typed state
only when its LSP7/LSP8 event domain matches the asset's verified standard. NFT formatting and
base-URI changes also update existing NFT token locations.

Invalid interface candidates do not create typed rows. If a previously verified contract later
fails verification, its core row becomes `invalid` and later facts cannot mutate typed state until
it verifies again. A later successful verification refreshes the asset's current standard and
standard-specific fields, so implementation upgrades do not retain a stale classification. A
change from LSP8 to another standard clears the collection-only format, reference, base URI, NFTs,
token ownership, and extension rows while preserving raw facts and ERC725Y values. Controller array
membership is independent of permission maps: removing an array slot clears its index but retains
the controller until its permission, allowed-call, and allowed-data-key maps are all empty.
The canonical empty ERC725Y value for a creator, issued-asset, or controller array length means
length zero. It removes creator and issued-asset members and clears every controller array index,
while controllers with independent permission maps remain. Other malformed lengths are ignored. RPC
transport or result-shape failures abort the batch before the cursor commits. Exact replay can
validate existing deterministic facts but cannot double-apply balances or supply. Changed creator,
issued-asset, and controller rows are deleted before reinsertion so unique array indexes may safely
swap within one batch. A creator's derived `verified` flag is refreshed whenever that address gains
or loses LSP0 verification, even when the triggering fact is unrelated to the creator registry.

LUKSO Mainnet additionally enables a Chillwhales extension for CHILL/ORBS claim flags and Orb level,
cooldown, and faction. Clearing or replacing packed Orb level data with fewer than eight bytes
clears both level and cooldown without disturbing faction. Claim reads happen only at the Portal's
available head and use its exact number and hash rather than RPC `latest`. Each head checks at most
250 tokens, prioritizing new mints and then due unresolved rows. Successful false results are
checked again after 720 blocks; individual failed calls retry after 30 blocks. Polling-only heads
load the extension row together with its verified asset guard before applying status or
retry-schedule updates. Other networks neither query nor populate the extension. The same
projection transaction creates or supersedes durable metadata jobs from verified LSP3/LSP4 values,
LSP29 array entries, and derived LSP8 token locations; external fetches run only in the worker.

Run one network's event and projection pipe after database migration and readiness checks:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 index:events
```

Use `INDEXER_TO_BLOCK` to bound an initial replay. A custom `INDEXER_FROM_BLOCK` is accepted only as
a contiguous continuation from an existing cursor; a fresh or reset projection database must begin
at the configured network start. Production still uses one isolated process per network; this
command does not turn the local development runner into a supervisor.

### V3 metadata workers

The projection transaction creates or supersedes metadata jobs from verified LSP3 and LSP4
VerifiableURIs, LSP29 encrypted-asset entries (including LSP31 multi-storage references), and
derived LSP8 token URIs. HTTP and IPFS access happens only in the separate worker after the source
block is finalized:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 metadata:worker
```

Workers use bounded concurrency, durable retry timestamps, jittered exponential backoff,
`FOR UPDATE SKIP LOCKED`, and expiring processing leases. Multiple replicas may drain the same
network queue. Shutdown signals wake idle workers immediately and close their metrics server and
database pool after in-flight work settles. Each worker reloads the current source before the request and inside the publication
transaction; a changed URI, hash, verification state, or source revision cancels the stale result.
Token metadata additionally requires both the NFT and its LSP8 parent collection to remain verified.
Raw metadata values remain stored when their target is not yet verified. When a later event changes
the affected profile, asset, collection, or NFT to a verified state, the same projection transaction
reloads those target scopes in bounded pages and queues their current metadata sources. Recovered
jobs use the eligibility-changing block for finality, so an older metadata row cannot be fetched
before its verification transition is finalized. Repeated events with the identical current value
retain the first source provenance and do not reset an existing job.
LSP29 index entries are eligible only while their index is below the profile's authoritative current
array length. Length changes rescan the affected profile in bounded pages, cancel out-of-range jobs,
and are checked again by the worker before fetching and publishing.
Published deterministic revisions are immutable, so a later fetch for the same chain source cannot
replace their bytes or provenance. A revision records the storage location that actually returned
the validated content, while its durable job remains keyed by the primary chain source.

Requests accept bounded `data:` content, IPFS through an ordered gateway list, HTTPS, and public
plain HTTP only with `METADATA_ALLOW_HTTP=true`. Before every connection and redirect, the worker
normalizes IP literals, rejects mixed or non-public DNS answers, and pins the socket to a validated
address while retaining the original hostname for TLS. Requests also enforce deadlines, response
and redirect limits, UTF-8/JSON and LSP schemas, and LSP2/LSP31 keccak verification. IPFS schemes are
case-insensitive and normalized before use. LSP31 jobs accept at most five supported storage entries,
try them in backend-preference order, and try every configured gateway for each IPFS entry. A
retryable failure on any attempted location keeps the job retryable even when a later fallback ends
with a terminal response. Metrics on
`METADATA_METRICS_PORT` report throughput, outcomes, categorized failures, retries, backlog and its
oldest age and maximum attempts, queue/request latency, and response bytes. The worker needs only
the network database connection; it does not open Portal or RPC connections.

### Validate a source

V3 requires Node.js 22.15 or newer. Check readiness without consuming blocks:

```bash
INDEXER_NETWORK=ethereum-mainnet \
  pnpm --filter @chillwhales/indexer-v3 check:network
```

Exercise the real Pipes stream with a small inclusive range:

```bash
INDEXER_NETWORK=ethereum-mainnet \
INDEXER_FROM_BLOCK=22000000 \
INDEXER_TO_BLOCK=22000010 \
  pnpm --filter @chillwhales/indexer-v3 probe:network
```

The probe intentionally refuses an unbounded range and explicitly requests empty blocks as well as
blocks containing logs. It reports the selected network and stream ID, batch count, block count, log
count, and first and last blocks, without writing data. It fails unless the source returns every
block exactly once in ascending order across the inclusive range, so a partial response is not
reported as a successful diagnostic.

### LUKSO live-source gate

The current LUKSO Mainnet Portal metadata reports `real_time: false`. Bounded historical reads are
supported. Setting `INDEXER_ALLOW_HISTORICAL_SOURCE=true` only acknowledges an unbounded historical
source; it does not provide head-following behavior. V3 cannot replace production until an official
real-time Portal or Pipes RPC source passes the restart, finality, and reorg acceptance suite.

The implementation decisions and remaining gates are tracked in the repository's
`V3_ARCHITECTURE.md`, `V3_ROADMAP.md`, and `V3_ACCEPTANCE_GATES.md` documents.

---

## Current v2 architecture

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

# Build the indexer (runs codegen + tsc)
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
