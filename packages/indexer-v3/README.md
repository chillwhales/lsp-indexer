# `@chillwhales/indexer-v3`

Multi-chain LSP indexer built from scratch on the SQD Pipes SDK.

> **Alpha implementation:** this package provides the typed network catalog, validated
> single-network runtime, Portal and RPC readiness checks, Pipes EVM source construction,
> PostgreSQL/Drizzle persistence, v2-parity raw LSP event ingestion, block-pinned verification, and
> deterministic LSP domain projections. It does not yet run the external metadata workers or expose
> the final v3 GraphQL/package contract, so it is not a replacement for the production v2 indexer.

## Requirements

- Node.js 22.15 or newer
- pnpm 10.15
- An RPC endpoint for the selected EVM network
- An SQD Portal dataset that covers the requested range
- PostgreSQL 17 for migrations and persistence

Dependencies that define the runtime boundary are pinned exactly, including
`@subsquid/pipes@1.0.0-beta.3`.

## Network model

Production runs one process or container per network. Each configured network has a stable EIP-155
Pipes identity and a separate PostgreSQL schema.

| Network key        | Chain ID | Pipes stream ID                  | Database schema          |
| ------------------ | -------: | -------------------------------- | ------------------------ |
| `lukso-mainnet`    |       42 | `lsp-indexer:v3:eip155:42`       | `chain_lukso_mainnet`    |
| `ethereum-mainnet` |        1 | `lsp-indexer:v3:eip155:1`        | `chain_ethereum_mainnet` |
| `ethereum-sepolia` | 11155111 | `lsp-indexer:v3:eip155:11155111` | `chain_ethereum_sepolia` |

Well-known LSP23 and LSP26 deployments are optional typed capabilities in the same registry. A
contract that is not deployed is absent; v3 never substitutes the zero address. The exported
registry and every nested configuration value are read-only and frozen. This lets later domain
decoders derive their contract filters from configuration instead of per-plugin chain lists.

The Pipes `devRunner` wrapper is available for local multi-network development only. Production
must keep network processes isolated so a crash, CPU spike, or provider failure on one chain does
not stop another.

Each chain schema contains the same 18-table Drizzle model: canonical blocks and raw event facts;
profiles, digital assets, NFTs, ownership, followers, creators, issued assets, permissions,
ERC725Y data, the network-gated Chillwhales extension, metadata revisions, metadata jobs, indexed
head, and the Pipes cursor. Sixteen
application tables are registered with the official Pipes rollback target. Snapshot tables,
functions, triggers, and cursors are created and used only inside that chain schema.
Creator, issued-asset, and controller ERC725Y array indexes retain their complete unsigned 128-bit
range as PostgreSQL `numeric(39, 0)` values mapped to TypeScript `bigint`.
Raw events and indexed heads reference the exact `(chain_id, block_number, block_hash)` block
identity. Before advancing the head, the target verifies every parent link after the previously
indexed head, rejecting a replay that retains a stale intermediate block and appends a disconnected
tip. Forward writes cannot lower the indexed head; Pipes snapshot restoration is the only backward
path. Pipes cursor timestamps are milliseconds and are converted directly to PostgreSQL timestamps
without rescaling. Both current and finalized head identities reference exact canonical block rows.
An advancing finalized pair must match its locally stored block, while a finalized height outside
the stored range does not advance the watermark. The finalized number and hash must both be present
or both be null. Lower or omitted finality retains the previous watermark.
Source-wide finality ahead of a historical backfill is clamped to the processed cursor and its hash.
Every raw event topic array must be one-dimensional, nonempty, null-free, contain only canonical
lowercase bytes32 values, and start with the separately indexed `topic0`.

The immutable enum types live in `lsp_v3`; sharing only those types lets read-only `api` views use
`UNION ALL` across chain schemas. No mutable chain row or rollback artifact is shared. Hasura will
track only the `api` views, not chain schemas or internal job/cursor tables.

## Raw event ingestion

The production query is limited to the 11 signatures handled by the v2 event plugins. Seven
signatures are global. LSP23 factory and LSP26 follower events are additionally constrained by the
selected network's configured singleton address and deployment block. In parallel with those
narrow log filters, the query requests and persists every block header, including blocks without a
matching event. This keeps canonical parent links and the exact indexed-head block identity
continuous while storing no unrelated logs. Pipes millisecond timestamps are persisted directly.

| Event                    | Domain    | Scope                |
| ------------------------ | --------- | -------------------- |
| `DataChanged`            | `erc725y` | Global topic         |
| `Executed`               | `erc725x` | Global topic         |
| `UniversalReceiver`      | `lsp0`    | Global topic         |
| LSP7 `Transfer`          | `lsp7`    | Global topic         |
| LSP8 `Transfer`          | `lsp8`    | Global topic         |
| `OwnershipTransferred`   | `lsp14`   | Global topic         |
| `TokenIdDataChanged`     | `lsp8`    | Global topic         |
| `Follow`, `Unfollow`     | `lsp26`   | Configured singleton |
| `DeployedContracts`      | `lsp23`   | Configured singleton |
| `DeployedERC1167Proxies` | `lsp23`   | Configured singleton |

Every fact has network, chain, block hash, parent hash, transaction hash, transaction index, and log
index provenance. Its ID is derived from the EIP-155 chain ID and canonical log position. Decoded
unsigned integers are decimal strings and LSP8 keeps its v2-compatible synthetic amount of `1`.

A known topic with a syntactically valid raw log is retained with `decoded = null` when ABI decoding
fails. Unknown topics, wrong singleton addresses, pre-deployment singleton logs, and unavailable
network capabilities are excluded. Invalid fundamental provenance fails the atomic batch instead of
advancing the cursor.

## Domain projections

The event command also runs the v3 projection pipeline. It deduplicates verification candidates by
exact block number and hash, interface category, and address; executes current and legacy
LSP0/LSP7/LSP8 interface checks through the configured Multicall3 deployment in bounded batches;
and pins every read to its triggering block. The RPC block hash is checked both before and after
each Multicall so a provider reorg cannot commit results from the wrong fork. Decimals are accepted
only for verified LSP7 assets.

The reducer applies only newly inserted facts in block/transaction/log order and atomically writes:

- Universal Profiles and digital assets, including owner, standard, decimals, supply, and LSP4/LSP8
  scalar state
- NFTs with raw and formatted token IDs, mint/burn state, owner, and derived base-URI location
- UP-scoped asset balances and token ownership
- Follower tombstones, creators, issued assets, controllers, permissions, and raw ERC725Y values
- The LUKSO-only Chillwhales extension for claim flags and Orb level, cooldown, and faction

A failed individual interface call produces no typed entity. Its raw event and ERC725Y value remain
stored. A transport or malformed-response failure aborts the transaction and leaves the cursor at
the preceding position. Exact replay validates existing deterministic facts but does not reduce
them again, preventing double-applied balances and supply. Changed creator, issued-asset, and
controller relationships are deleted before reinsertion so two rows may safely exchange a unique
ERC725Y array index in one batch.

CHILL and ORBS claim checks run only at the Portal's available head and are pinned to its exact
number and hash. Each head processes at most 250 tokens, prioritizing new mints and then due stored
tokens. An unresolved token is scheduled 720 blocks later after a successful false result or 30
blocks later after an individual failed call; true flags remain monotonic. IPFS/HTTP metadata
parsing and publication remain owned by the later metadata-worker goal; the projection pipeline
already persists their durable chain inputs.

## Configuration

| Variable                                | Required | Purpose                                                     |
| --------------------------------------- | -------- | ----------------------------------------------------------- |
| `INDEXER_NETWORK`                       | Yes      | Network key from the catalog                                |
| `INDEXER_FROM_BLOCK`                    | No       | Inclusive start block; defaults to the network start block  |
| `INDEXER_TO_BLOCK`                      | No       | Inclusive end block; required by the bounded source probe   |
| `SQD_PORTAL_URL`                        | No       | Override the selected network's Portal dataset URL          |
| `RPC_URL`                               | No       | Generic RPC override                                        |
| `RPC_URL_LUKSO_MAINNET`                 | No       | LUKSO-specific RPC override; takes priority over `RPC_URL`  |
| `RPC_URL_ETHEREUM_MAINNET`              | No       | Ethereum-specific RPC override                              |
| `RPC_URL_ETHEREUM_SEPOLIA`              | No       | Sepolia-specific RPC override                               |
| `INDEXER_ALLOW_HISTORICAL_SOURCE`       | No       | Explicitly permit an unbounded run against a historical set |
| `INDEXER_METRICS_PORT`                  | No       | Local runner metrics port; defaults to `9090`               |
| `DATABASE_URL`                          | Runtime  | Generic PostgreSQL runtime URL                              |
| `DATABASE_URL_<NETWORK>`                | No       | Network URL override; takes priority over `DATABASE_URL`    |
| `DATABASE_ADMIN_URL`                    | Migrate  | Admin URL used only by the one-shot migration command       |
| `DATABASE_MIGRATION_NETWORKS`           | No       | Comma-separated enabled set; defaults to the full catalog   |
| `DATABASE_RUNTIME_LOGIN_<NETWORK>`      | No       | Existing login to grant the network writer role             |
| `DATABASE_POOL_MAX`                     | No       | Runtime connection limit; defaults to `10`                  |
| `DATABASE_CONNECTION_TIMEOUT_MS`        | No       | Connection timeout; defaults to `10000`                     |
| `DATABASE_IDLE_TIMEOUT_MS`              | No       | Idle connection timeout; defaults to `30000`                |
| `DATABASE_STATEMENT_TIMEOUT_MS`         | No       | Statement timeout; defaults to `60000`                      |
| `DATABASE_LOCK_TIMEOUT_MS`              | No       | Lock timeout; defaults to `10000`                           |
| `DATABASE_IDLE_TRANSACTION_TIMEOUT_MS`  | No       | Idle transaction timeout; defaults to `60000`               |
| `DATABASE_UNFINALIZED_BLOCKS_RETENTION` | No       | Defaults to max(`1000`, finality × 4); must exceed finality |

URLs, ranges, boolean values, the network key, Portal dataset identity, Portal coverage, RPC chain
ID, and configured contract bytecode are validated before a network program starts. A
network-specific RPC or database variable takes priority over its generic counterpart.
The persistence target consumes this loaded database configuration directly, including
`DATABASE_UNFINALIZED_BLOCKS_RETENTION`; there is no separate target-level fallback.

## Database setup

The migration command is separate from every indexer process. It creates the immutable `lsp_v3`
type schema, one physical schema and non-login writer role per enabled network, Drizzle migration
history and cursor tables, and the read-only `api` views. A cluster-wide advisory lock rejects
concurrent migration commands. Exported migration entry points reject duplicate network keys, chain
IDs, schemas, writer roles, and runtime logins before connecting, and every schema and role must
equal its deterministic network mapping without colliding with a reserved schema or role. Runtime
login roles must already exist; provide their names to grant each login only its matching writer
role. Every login must be unique to one network, remain `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
NOREPLICATION NOBYPASSRLS`, and may reach no role other than its assigned writer. Its writer
membership must carry `SET OPTION` so the pool can assume the role, and must not carry `ADMIN
OPTION`. Migration and startup revalidate both membership options and every capability, then reject
direct or transitive memberships in any other role. Because a session can `RESET ROLE`, they also
reject direct ACLs, object ownership, default ACLs, and policy references held by the runtime login,
except for non-grantable `CONNECT` on the current database. Existing deterministic owner and writer
roles are accepted only when they remain `NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE
NOREPLICATION NOBYPASSRLS` and have no direct or transitive role memberships. A writer may own or
receive privileges only inside its assigned chain schema; outside it, the exceptions are
non-grantable `USAGE` on `lsp_v3` and its four canonical enum types plus a global function default
ACL containing only the writer's own `EXECUTE`. That restrictive default removes PostgreSQL's
built-in `PUBLIC EXECUTE` from future Pipes rollback functions, and migration revokes it from
existing chain functions. Migration and startup reject stale read-only grants, shared-schema
`CREATE`, grant options, foreign ownership, other default privileges, and policy references. They
also inventory schema, relation, sequence, column, routine, type, and default ACLs inside every
chain schema: only the writer's privileges and the API owner's non-grantable schema `USAGE` plus
`SELECT` on enumerated public tables are accepted. PostgreSQL's non-grantable `PUBLIC USAGE` on
writer-owned table row types, including Pipes snapshots, is the sole ambient exception; without
chain schema usage or relation privileges it cannot expose rows. The migrator inventories every
role that can reach each writer role and permits only the migration admin and currently configured
runtime login; only the current migration admin may reach the API owner role. Revoke old memberships
before rotating either credential. Each existing chain schema must have no identity or exactly its
configured singleton identity. The shared schema is rejected unless it contains only the four
canonical enums and their PostgreSQL-generated array types. The API reader is rejected if it owns a
schema, relation, routine, type, or database, or has direct or effective `PUBLIC` access outside
shared-enum usage, API schema usage, and `SELECT` on the enumerated public views. Publicly executable
custom routines, including default-public `SECURITY DEFINER` routines, are rejected. Runtime
readiness independently audits the active credential's effective `PUBLIC` privileges across
schemas, relations, columns, routines, types, the database, and default ACLs. Its explicit allowlist
covers only ambient system access, non-grantable connection and temporary-database access, and
canonical shared-enum usage; `PUBLIC CREATE`, grant options, and reachable custom routines are
startup failures.

The migrator drops the enumerated API views before source-table migrations and rebuilds them after
every enabled schema is current, allowing column removal, reordering, and type changes. View
removal, every enabled network migration, and view replacement share one PostgreSQL transaction; a
failure on any chain or during the rebuild rolls back earlier chain changes and restores the prior
views. Migration and startup require the writer to own the migration table and its sequence, the
cursor, and every expected chain table. Before a pending migration, the ownership audit permits
latest-schema tables that have not been created yet, then requires the complete inventory after
migration. A deterministic PostgreSQL 17 catalog
fingerprint additionally covers all non-snapshot tables and sequences, relation settings, columns
and defaults, constraints, indexes, and sequence parameters. It runs before changing a fully current
schema, after every migration, and during startup readiness, so an out-of-band dropped or added
column, foreign key, check, index, or other reviewed object is rejected even when the migration
journal still matches. Dynamic Pipes `__snapshots` tables are intentionally excluded.

```bash
DATABASE_ADMIN_URL=postgresql://migration_admin:secret@localhost/lsp_indexer_v3 \
DATABASE_RUNTIME_LOGIN_ETHEREUM_MAINNET=lsp_v3_ethereum_runtime \
  pnpm --filter @chillwhales/indexer-v3 db:migrate
```

The runtime pool automatically assumes the deterministic network role and pins this search path:

```text
chain_<network>,lsp_v3,public
```

Check the role, schema, seeded chain identity, and privilege boundary before starting a pipe.
Readiness validates both the assumed writer role and the underlying session login, including
every login, inheritance, superuser, database/role creation, replication, and row-security-bypass
capability; every reachable role membership; writer ownership; the complete chain ACL surface; and
direct privilege or ownership dependencies. It also rejects unexpected effective `PUBLIC`
privileges and any mismatch between the live chain catalog and the reviewed schema fingerprint:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 db:check
```

Generated migrations are normalized to stay schema-relative. `db:migrations:check` rejects a
public-schema qualifier. Because Pipes beta.3 does not reconcile snapshot tables after tracked
columns change, ordinary pending migrations fail safely whenever rollback snapshot tables exist,
even when they are empty.

The projection rollout is an explicit, tested alpha rebuild exception. Stop every v3 indexer before
running it. Its reviewed `destructive-replay` migration drops old Pipes snapshot functions,
triggers, and tables and clears every mutable chain table plus `sqd_cursor` in the same transaction
across all enabled networks. It preserves `network_config` and migration history. On restart, Pipes
recreates all 16 rollback artifacts from the new schema and ingestion replays from
`INDEXER_FROM_BLOCK`. No other migration bypasses the snapshot guard.

## Commands

Check that a Portal and RPC endpoint match a configured network:

```bash
INDEXER_NETWORK=ethereum-mainnet \
  pnpm --filter @chillwhales/indexer-v3 check:network
```

Exercise the real Pipes source with a deliberately small, bounded raw-log range:

```bash
INDEXER_NETWORK=ethereum-mainnet \
INDEXER_FROM_BLOCK=22000000 \
INDEXER_TO_BLOCK=22000010 \
  pnpm --filter @chillwhales/indexer-v3 probe:network
```

The probe explicitly requests every block, including blocks without logs. It reports batches,
blocks, logs, and the network-scoped stream identity, refuses to run without `INDEXER_TO_BLOCK`, and
fails unless the source returns every block exactly once in ascending order across the inclusive
range; it is a source diagnostic, not the domain indexer.

After migrations and readiness checks pass, run the event and projection indexer for exactly one
configured network:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 index:events
```

The command uses the narrow event query, query-aware decoder, block-pinned RPC planner,
deterministic reducer, official rollback-aware Drizzle target, and the same stable per-network
cursor ID. Add `INDEXER_FROM_BLOCK` and `INDEXER_TO_BLOCK` for a bounded backfill or fixture run.

Run local validation:

```bash
pnpm --filter @chillwhales/indexer-v3 typecheck
pnpm --filter @chillwhales/indexer-v3 test:coverage
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost/postgres \
  pnpm --filter @chillwhales/indexer-v3 test:persistence
pnpm --filter @chillwhales/indexer-v3 build
```

## Current source gate

The LUKSO Mainnet Portal dataset currently reports that it is not real-time. Bounded historical
ranges are safe to probe. An unbounded historical run requires
`INDEXER_ALLOW_HISTORICAL_SOURCE=true`, but that opt-in does not make the source live. Production
cutover remains blocked until an official real-time Portal or Pipes RPC source passes the recovery
and reorg acceptance suite.

See the repository's [v3 architecture](../../.github/V3_ARCHITECTURE.md),
[database contract](../../.github/V3_SCHEMA.md),
[raw event disposition](../../.github/V3_EVENT_DISPOSITION.md),
[projection disposition](../../.github/V3_PROJECTION_DISPOSITION.md),
[roadmap](../../.github/V3_ROADMAP.md), and
[acceptance gates](../../.github/V3_ACCEPTANCE_GATES.md).
