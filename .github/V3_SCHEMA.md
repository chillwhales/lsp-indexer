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
and checks the underlying session login as well: it cannot be a superuser, reach an unexpected role,
hold direct ACLs or database-object ownership beyond non-grantable connection access, or have direct
or inherited write privileges on another configured chain schema. Readiness also inventories the
assumed writer: it may own or receive privileges only inside its chain schema, plus non-grantable
`USAGE` on `lsp_v3` and the four canonical enums.

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

`indexed_heads` uses the same exact block-identity foreign key. A replay range with no matching
events therefore cannot publish a new head hash while the old canonical block remains at that
height. Deleting a block cascades to its head row, while Pipes orders tracked rollback operations so
parent blocks are restored before their dependent heads.

Current projections carry `network`, `chain_id`, and their last block hash and number. Event-driven
projections also retain transaction and log position. Domain reducers in #384 must apply updates in
canonical block, transaction, and log order and use idempotent inserts/upserts.

Addresses and bytes32 values are lowercase, fixed-width hex strings checked by PostgreSQL. EVM
unsigned integers use `numeric(78, 0)`. Block and chain numbers use `bigint` in PostgreSQL and are
validated as safe integers at the TypeScript boundary. ERC725Y creator and issued-asset array
indexes use `numeric(39, 0)` and TypeScript `bigint` to preserve the full unsigned 128-bit key
suffix. Nullable token scopes use `NULLS NOT DISTINCT` unique constraints, preventing duplicate
contract-wide ERC725Y or metadata revisions.

## Transaction and rollback contract

The official `drizzleTarget` owns the serializable transaction and advisory cursor lock. The v3
wrapper registers all mutable application tables, calls the domain writer, upserts `indexed_heads`,
and lets Pipes save its cursor before one commit. Any thrown decoder, RPC, reducer, constraint, or
database error rolls the entire batch back. When a source batch omits a finalized cursor, the
indexed head retains its previously known finalized number and hash. A lower finalized cursor also
cannot reduce that watermark during forward processing; only restoration of the tracked head
snapshot may move it backwards during fork handling. A source that reports a conflicting hash at the
stored finalized height aborts the transaction. The target takes rollback retention directly from
the validated network database configuration.

For an unfinalized block, triggers retain the earliest before-image per primary key and block. Fork
resolution deletes facts first, restores parent rows before children, removes consumed snapshots,
and removes cursor rows above the common ancestor. PostgreSQL integration tests cover injected
failure, duplicate replay, one-block rollback, multi-block rollback, and isolation from another
chain schema.

## Migrations and views

Drizzle Kit generates one schema-relative migration series. The normalization step removes its
default `public` qualifiers and enum creation; the migration owner creates shared enum types once in
`lsp_v3` and rejects any pre-existing definition whose labels or ordering differ. Deterministic
owner and writer roles must be capability-limited non-login roles without direct or transitive role
memberships. The migrator traverses the reverse membership graph for each writer and fails if any
role other than the migration admin or configured runtime login can reach it; an old login must be
revoked before credential rotation. The runtime membership cannot carry `ADMIN OPTION` and must
carry `SET OPTION`. Migration and startup inventory every writer ACL, ownership dependency, default
ACL, and policy reference. Anything outside the assigned chain schema is rejected except exact,
non-grantable `USAGE` on the shared schema and canonical enum types. This includes read-only foreign
grants, shared-schema `CREATE`, and grant options. Only the current migration admin may reach the API
owner role. Each chain has an independent migration history whose normalized hashes are verified on
every run. Exported entry points reject duplicate network keys, chain IDs, schemas, writer roles,
and runtime logins before connecting. They also require the deterministic schema and writer-role
mapping for every network and reject reserved collisions. Existing chain schemas must have an empty
identity table or exactly the configured singleton before it is seeded. A cluster-wide advisory
lock rejects concurrent migration commands, and reapplying the same plan is idempotent.

After every enabled chain is current, the migrator transactionally replaces 14 security-barrier
views in `api` with `UNION ALL` selections. Internal jobs, cursor history, network identity,
migration history, and rollback artifacts are intentionally absent. Unexpected API relations abort
the rebuild. The shared namespace is accepted only when it contains the four canonical enums and
their generated array types. The reader may not own a schema, relation, routine, type, or database
and may hold only API/shared schema usage, canonical enum usage, and `SELECT` on the 14 enumerated
views. Effective access inherited from `PUBLIC` is included in that inventory; implicit public type
usage is removed from API view types and shared enums, while a publicly executable user-defined
routine aborts migration. Hasura and future packages must join, filter, cache, and subscribe with
both `network` and `chain_id`.

Pipes `1.0.0-beta.3` does not reconcile a snapshot table after a tracked column changes. A pending
migration therefore fails before execution whenever any snapshot table exists, even if retention
has emptied it. Alpha databases must be rebuilt, or the repository owner must approve a separately
tested preservation procedure.
