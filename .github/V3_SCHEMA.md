# LSP Indexer v3 database contract

Status: implemented foundation for [#382](https://github.com/chillwhales/lsp-indexer/issues/382)

This document is the persistence contract between the Pipes ingestion work, domain reducers,
metadata workers, Hasura, and the v3 consumer packages. The Drizzle definitions and generated SQL
in `packages/indexer-v3` are executable source of truth; this file records why the objects exist and
which boundaries consumers may rely on.

## Physical layout

One PostgreSQL cluster contains four kinds of schema:

| Schema                   | Contents                                                         | Writable by indexer |
| ------------------------ | ---------------------------------------------------------------- | ------------------- |
| `chain_lukso_mainnet`    | LUKSO facts, projections, jobs, cursor, snapshots, migrations    | LUKSO role only     |
| `chain_ethereum_mainnet` | Ethereum facts, projections, jobs, cursor, snapshots, migrations | Ethereum role only  |
| `chain_ethereum_sepolia` | Sepolia facts, projections, jobs, cursor, snapshots, migrations  | Sepolia role only   |
| `lsp_v3`                 | Four immutable enum types                                        | Migration owner     |
| `api`                    | Cross-network read-only views                                    | No                  |

The runtime search path is always `chain_<network>,lsp_v3,public`. The released Pipes rollback
tracker emits unqualified DDL and rollback SQL, so pinning that search path is a correctness
requirement rather than a convenience. Startup readiness rejects the wrong current role or schema
and checks the underlying session login as well: it cannot be a superuser, hold a foreign writer
membership, or have direct or inherited write privileges on another configured chain schema.

## Table inventory

Every chain schema has the same application tables.

| Table                | Category        | Natural or primary key                                        | Rollback | API |
| -------------------- | --------------- | ------------------------------------------------------------- | :------: | :-: |
| `network_config`     | Static identity | `(network, chain_id)`                                         |    No    | No  |
| `sqd_cursor`         | Pipes state     | `(id, current_number)`                                        |  Pipes   | No  |
| `blocks`             | Canonical fact  | `(chain_id, number)`                                          |   Yes    | Yes |
| `event_facts`        | Raw log fact    | deterministic ID; unique chain/block/transaction/log position |   Yes    | Yes |
| `universal_profiles` | Projection      | `(chain_id, address)`                                         |   Yes    | Yes |
| `digital_assets`     | Projection      | `(chain_id, address)`                                         |   Yes    | Yes |
| `nfts`               | Projection      | `(chain_id, address, token_id)`                               |   Yes    | Yes |
| `owned_assets`       | Projection      | `(chain_id, owner_address, asset_address)`                    |   Yes    | Yes |
| `owned_tokens`       | Projection      | `(chain_id, owner_address, asset_address, token_id)`          |   Yes    | Yes |
| `follower_edges`     | Projection      | `(chain_id, follower_address, followed_address)`              |   Yes    | Yes |
| `creators`           | Projection      | `(chain_id, asset_address, creator_address)`                  |   Yes    | Yes |
| `issued_assets`      | Projection      | `(chain_id, issuer_address, asset_address)`                   |   Yes    | Yes |
| `controllers`        | Projection      | `(chain_id, profile_address, controller_address)`             |   Yes    | Yes |
| `data_values`        | Projection      | deterministic ID; unique address/token/data-key scope         |   Yes    | Yes |
| `metadata_revisions` | Revision fact   | deterministic ID; unique source revision                      |   Yes    | Yes |
| `metadata_jobs`      | Internal queue  | deterministic source-revision ID                              |   Yes    | No  |
| `indexed_heads`      | Visibility      | `(network, chain_id)`                                         |   Yes    | Yes |

`__drizzle_migrations` is also present in each chain schema but is migration bookkeeping, not an
application table. When the target starts, Pipes creates one `<table>__snapshots` table,
`maybe_snapshot_<table>()` function, and `<table>_snapshot_trigger` for each of the 15 rollback
tables. The official target manages `sqd_cursor` separately in the same serializable transaction.

## Facts and projections

`event_facts` retains raw emitting address, topics, data, decoded JSON when available, and complete
block/transaction/log provenance. Interface verification never determines whether this historical
fact survives. Its `(chain_id, block_number, block_hash)` foreign key must match the exact canonical
`blocks` row, so a cursor reset cannot attach new-fork facts to a stale block height. Event-specific
decoding added in #383 may populate `event_name`, `event_domain`, and `decoded` without weakening
the raw identity.

Current projections carry `network`, `chain_id`, and their last block hash and number. Event-driven
projections also retain transaction and log position. Domain reducers in #384 must apply updates in
canonical block, transaction, and log order and use idempotent inserts/upserts.

Addresses and bytes32 values are lowercase, fixed-width hex strings checked by PostgreSQL. EVM
unsigned integers use `numeric(78, 0)`. Block and chain numbers use `bigint` in PostgreSQL and are
validated as safe integers at the TypeScript boundary. Nullable token scopes use `NULLS NOT
DISTINCT` unique constraints, preventing duplicate contract-wide ERC725Y or metadata revisions.

## Transaction and rollback contract

The official `drizzleTarget` owns the serializable transaction and advisory cursor lock. The v3
wrapper registers all mutable application tables, calls the domain writer, upserts `indexed_heads`,
and lets Pipes save its cursor before one commit. Any thrown decoder, RPC, reducer, constraint, or
database error rolls the entire batch back. When a source batch omits a finalized cursor, the
indexed head retains its previously known finalized number and hash.

For an unfinalized block, triggers retain the earliest before-image per primary key and block. Fork
resolution deletes facts first, restores parent rows before children, removes consumed snapshots,
and removes cursor rows above the common ancestor. PostgreSQL integration tests cover injected
failure, duplicate replay, one-block rollback, multi-block rollback, and isolation from another
chain schema.

## Migrations and views

Drizzle Kit generates one schema-relative migration series. The normalization step removes its
default `public` qualifiers and enum creation; the migration owner creates shared enum types once in
`lsp_v3`. Each chain has an independent migration history whose normalized hashes are verified on
every run. A cluster-wide advisory lock rejects concurrent migration commands, and reapplying the
same plan is idempotent.

After every enabled chain is current, the migrator transactionally replaces 14 security-barrier
views in `api` with `UNION ALL` selections. Internal jobs, cursor history, network identity,
migration history, and rollback artifacts are intentionally absent. Hasura and future packages must
join, filter, cache, and subscribe with both `network` and `chain_id`.

Pipes `1.0.0-beta.3` does not reconcile a snapshot table after a tracked column changes. A pending
migration therefore fails before execution whenever any snapshot table exists, even if retention
has emptied it. Alpha databases must be rebuilt, or the repository owner must approve a separately
tested preservation procedure.
