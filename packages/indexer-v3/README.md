# `@chillwhales/indexer-v3`

Multi-chain LSP indexer built from scratch on the SQD Pipes SDK.

> **Alpha foundation:** this package provides the typed network catalog, validated single-network
> runtime, Portal and RPC readiness checks, Pipes EVM source construction, PostgreSQL/Drizzle
> persistence, and a bounded source probe. It does not yet decode every LSP domain or expose the
> final v3 GraphQL contract, so it is not a replacement for the production v2 indexer.

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

Each chain schema contains the same 17-table Drizzle model: canonical blocks and raw event facts;
profiles, digital assets, NFTs, ownership, followers, creators, issued assets, permissions,
ERC725Y data, metadata revisions, metadata jobs, indexed head, and the Pipes cursor. Fifteen
application tables are registered with the official Pipes rollback target. Snapshot tables,
functions, triggers, and cursors are created and used only inside that chain schema.
Creator and issued-asset ERC725Y array indexes retain their complete unsigned 128-bit range as
PostgreSQL `numeric(39, 0)` values mapped to TypeScript `bigint`.
Raw events and indexed heads reference the exact `(chain_id, block_number, block_hash)` block
identity. Before advancing the head, the target verifies every parent link after the previously
indexed head, rejecting a replay that retains a stale intermediate block and appends a disconnected
tip. Forward writes cannot lower the indexed head; Pipes snapshot restoration is the only backward
path. Both current and finalized head identities reference exact canonical block rows. An advancing
finalized pair must match its locally stored block, while a finalized height outside the stored range
does not advance the watermark. Lower or omitted finality retains the previous watermark.
Source-wide finality ahead of a historical backfill is clamped to the processed cursor and its hash.

The immutable enum types live in `lsp_v3`; sharing only those types lets read-only `api` views use
`UNION ALL` across chain schemas. No mutable chain row or rollback artifact is shared. Hasura will
track only the `api` views, not chain schemas or internal job/cursor tables.

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
role. Every login must be unique to one network, must not have elevated PostgreSQL capabilities or
delegation rights, and may reach no role other than its assigned writer. Its writer membership must
carry `SET OPTION` so the pool can assume the role, and must not carry `ADMIN OPTION`. Migration and
startup reject direct or transitive memberships in any other role. Because a session can `RESET
ROLE`, they also reject direct ACLs, object ownership, default ACLs, and policy references held by
the runtime login, except for non-grantable `CONNECT` on the current database. Existing
deterministic owner and writer roles are accepted only when they remain `NOLOGIN NOINHERIT`,
capability-limited, and have no direct or transitive role memberships. A writer may own or receive
privileges only inside its assigned chain schema; outside it, the sole exceptions are non-grantable
`USAGE` on `lsp_v3` and its four canonical enum types. Migration and startup reject stale read-only
grants, shared-schema `CREATE`, grant options, foreign ownership, default privileges, and policy
references. The migrator inventories every role that can reach each writer role and permits only
the migration admin and currently configured runtime login; only the current migration admin may
reach the API owner role. Revoke old memberships before rotating either credential. Each existing
chain schema must have no identity or exactly its configured singleton identity. The shared schema
is rejected unless it contains only the four canonical enums and their PostgreSQL-generated array
types. The API reader is rejected if it owns a schema, relation, routine, type, or database, or has
direct or effective `PUBLIC` access outside shared-enum usage, API schema usage, and `SELECT` on the
enumerated public views. Publicly executable custom routines, including default-public `SECURITY
DEFINER` routines, are rejected.

The migrator drops the enumerated API views before source-table migrations and rebuilds them after
every enabled schema is current, allowing column removal, reordering, and type changes. A rejected
migration attempts to restore the views before returning. Migration and startup require the writer
to own the migration table, cursor, and every expected chain table.

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
superuser status, every reachable role membership, writer ownership and ACL drift, and direct
privilege or ownership dependencies:

```bash
INDEXER_NETWORK=ethereum-mainnet \
DATABASE_URL=postgresql://lsp_v3_ethereum_runtime:secret@localhost/lsp_indexer_v3 \
  pnpm --filter @chillwhales/indexer-v3 db:check
```

Generated migrations are normalized to stay schema-relative. `db:migrations:check` rejects a
public-schema qualifier. Because Pipes beta.3 does not reconcile snapshot tables after tracked
columns change, pending migrations fail safely whenever rollback snapshot tables exist, even when
they are empty; alpha operators must rebuild the database or use an owner-approved preservation
procedure.

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

The probe reports batches, blocks, logs, and the network-scoped stream identity. It refuses to run
without `INDEXER_TO_BLOCK` and fails unless the source returns every block exactly once in ascending
order across the inclusive range; it is a source diagnostic, not the domain indexer.

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
[roadmap](../../.github/V3_ROADMAP.md), and
[acceptance gates](../../.github/V3_ACCEPTANCE_GATES.md).
