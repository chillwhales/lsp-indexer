# LSP Indexer v3 database contract

Status: implemented through domain projections for
[#382](https://github.com/chillwhales/lsp-indexer/issues/382) and
[#384](https://github.com/chillwhales/lsp-indexer/issues/384), including the metadata lifecycle in
[#385](https://github.com/chillwhales/lsp-indexer/issues/385) and the public Hasura contract in
[#386](https://github.com/chillwhales/lsp-indexer/issues/386)

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
and checks the underlying session login as well: it must remain `LOGIN NOSUPERUSER NOCREATEDB
NOCREATEROLE NOREPLICATION NOBYPASSRLS`, cannot reach an unexpected role, cannot hold direct ACLs
or database-object ownership beyond non-grantable connection access, and cannot have direct or
inherited write privileges on another configured chain schema. The assumed writer must remain
`NOLOGIN NOINHERIT` with the same five elevated capabilities disabled. Readiness also inventories
the writer and every ACL in its chain schema. The writer may own or receive arbitrary privileges
only inside that schema; the API owner may hold only non-grantable schema `USAGE` and `SELECT` on
the enumerated public chain tables. Grants to any other role across schema, relation, sequence,
column, routine, type, or default ACL surfaces abort migration and startup. The only ambient
chain-schema exception is PostgreSQL's non-grantable `PUBLIC USAGE` on writer-owned table row types,
including Pipes snapshots; `PUBLIC` has neither schema usage nor relation privileges, so that
catalog default cannot expose rows. Readiness separately expands the effective privileges inherited
from PostgreSQL's `PUBLIC` pseudo-role across schemas, relations, columns, routines, types, the
database, and default ACLs. The allowlist contains only PostgreSQL's ambient system access,
non-grantable connection and temporary-database access, and the expected shared enum usage; `PUBLIC
CREATE`, grant options, or a reachable user-defined routine abort startup.

## Table inventory

Every chain schema has the same application tables.

| Table                | Category          | Natural or primary key                                        | Rollback | API |
| -------------------- | ----------------- | ------------------------------------------------------------- | :------: | :-: |
| `network_config`     | Static identity   | `(network, chain_id)`                                         |    No    | No  |
| `sqd_cursor`         | Pipes state       | `(id, current_number)`                                        |  Pipes   | No  |
| `blocks`             | Canonical fact    | `(chain_id, number)`                                          |   Yes    | Yes |
| `event_facts`        | Raw log fact      | deterministic ID; unique chain/block/transaction/log position |   Yes    | Yes |
| `universal_profiles` | Projection        | `(chain_id, address)`                                         |   Yes    | Yes |
| `digital_assets`     | Projection        | `(chain_id, address)`                                         |   Yes    | Yes |
| `nfts`               | Projection        | `(chain_id, address, token_id)`                               |   Yes    | Yes |
| `owned_assets`       | Projection        | `(chain_id, owner_address, asset_address)`                    |   Yes    | Yes |
| `owned_tokens`       | Projection        | `(chain_id, owner_address, asset_address, token_id)`          |   Yes    | Yes |
| `follower_edges`     | Projection        | `(chain_id, follower_address, followed_address)`              |   Yes    | Yes |
| `creators`           | Projection        | `(chain_id, asset_address, creator_address)`                  |   Yes    | Yes |
| `issued_assets`      | Projection        | `(chain_id, issuer_address, asset_address)`                   |   Yes    | Yes |
| `controllers`        | Projection        | `(chain_id, profile_address, controller_address)`             |   Yes    | Yes |
| `chillwhales_nfts`   | Product extension | `(chain_id, address, token_id)`                               |   Yes    | Yes |
| `data_values`        | Projection        | deterministic ID; unique address/token/data-key scope         |   Yes    | Yes |
| `metadata_revisions` | Revision fact     | deterministic ID; unique source revision                      |   Yes    | Yes |
| `metadata_jobs`      | Internal queue    | deterministic source-revision ID                              |   Yes    | No  |
| `indexed_heads`      | Visibility        | `(network, chain_id)`                                         |   Yes    | Yes |

`__drizzle_migrations` is also present in each chain schema but is migration bookkeeping, not an
application table. When the target starts, Pipes creates one `<table>__snapshots` table,
`maybe_snapshot_<table>()` function, and `<table>_snapshot_trigger` for each of the 16 rollback
tables. The official target manages `sqd_cursor` separately in the same serializable transaction.

## Facts and projections

`event_facts` retains raw emitting address, topics, data, decoded JSON when available, and complete
block/transaction/log provenance. Interface verification never determines whether this historical
fact survives. Its `(chain_id, block_number, block_hash)` foreign key must match the exact canonical
`blocks` row, so a cursor reset cannot attach new-fork facts to a stale block height. Event-specific
decoding populates `event_name`, `event_domain`, and `decoded` for all 11 v2 plugin signatures without
weakening the raw identity. A syntactically valid known-topic log whose ABI payload cannot decode
keeps its raw fact and routing identity with `decoded = NULL`; unknown topics are not selected. The
raw topic array must be one-dimensional, nonempty, null-free, and contain only canonical lowercase
bytes32 values; its first element must equal the separately indexed `topic0`.

The event source requests and persists every canonical block header even when that block has no
selected log. Portal timestamps are already milliseconds and are stored without rescaling. This
continuous block history supplies the exact parent links and indexed-head identity checked below
without retaining unrelated event payloads.

`indexed_heads` uses the same exact block-identity foreign key. A replay range with no matching
events therefore cannot publish a new head hash while the old canonical block remains at that
height. Before advancing the head, the target also validates every parent link after the previously
indexed height, so a conflicting intermediate block cannot be ignored while a disconnected new tip
is committed. Forward writes reject a head below the stored height; only snapshot restoration may
move it backwards. Pipes block-cursor timestamps are milliseconds and are persisted without a unit
conversion. Both the current and finalized head triples have exact block-identity foreign keys, and
the finalized number and hash must either both be null or both be present. Deleting a block cascades
to its head row, while Pipes orders tracked rollback operations so parent blocks are restored before
their dependent heads.

Current projections carry `network`, `chain_id`, and their last block hash and number. Event-driven
projections also retain transaction and log position. The #384 reducer applies only newly inserted
facts in canonical block, transaction, and log order. This makes a cursor-reset replay idempotent
without hiding a conflicting fact at the same deterministic position.

`nfts` retains the raw bytes32 token ID plus its current formatted representation, mint/burn state,
owner, and derived base-URI location. Creator, issued-asset, and controller array/map records are
collapsed into one row per natural relationship; array shrink events delete stale current rows.
Changed relationship rows are removed before reinsertion so unique array-index swaps cannot
collide. `chillwhales_nfts` is a network-gated product extension rather than a core LSP table. Its
indexed `claim_check_after_block` field bounds due-token polling and remains rollback tracked.

Verification reads current and legacy LSP0/LSP7/LSP8 interface IDs at the exact triggering block
number and hash. The provider hash is checked before and after every Multicall. A verified result
may create a typed profile or asset. An invalid result never removes the raw fact or `data_values`
row and never creates a false typed projection. Optional EOA references such as a controller
address remain valid relationship fields without pretending to be Universal Profiles.

Addresses and bytes32 values are lowercase, fixed-width hex strings checked by PostgreSQL. EVM
unsigned integers use `numeric(78, 0)`. Block and chain numbers use `bigint` in PostgreSQL and are
validated as safe integers at the TypeScript boundary. ERC725Y creator, issued-asset, and controller
array indexes use `numeric(39, 0)` and TypeScript `bigint` to preserve the full unsigned 128-bit key
suffix. Nullable token scopes use `NULLS NOT DISTINCT` unique constraints, preventing duplicate
contract-wide ERC725Y or metadata revisions.

## Metadata revisions and jobs

`metadata_jobs` is a rollback-tracked internal queue, not a public projection. Its ID is the same
deterministic source-revision ID used by the eventual `metadata_revisions` row. A job records the
network, natural source scope, kind, URI, optional on-chain hash, source block, status, attempts,
next-attempt time, claim lease, bounded error, and creation/update timestamps.

The projection writer inserts or resets current LSP3, LSP4, LSP29/LSP31, and derived LSP8 jobs in
the same transaction as `data_values`, NFTs, indexed-head state, rollback snapshots, and the Pipes
cursor. Jobs for older or invalid revisions in that natural scope become `cancelled`. Exact event
replay does not reset a job because no projection mutation is applied.

Workers claim only jobs at or below `indexed_heads.finalized_block_number`. PostgreSQL row locks and
`SKIP LOCKED` divide work between replicas; `claimed_at` is also the claim token and an expired lease
can be reclaimed after a crash. A retry clears that lease and persists `next_attempt_at`. Terminal
transport/content failures become `failed`; a valid current result becomes `succeeded`.

Settlement locks and rebuilds the current verified profile, asset, or NFT target and its
`data_values` or derived NFT source before locking the exact job claim. Verification, natural key,
URI, hash, and revision must still match; token metadata also requires a verified LSP8 parent
collection. If any changed, the job is cancelled and no revision is written. A successful
serializable transaction inserts the parsed JSON and response metadata into
`metadata_revisions` without ever overwriting an existing immutable revision, retaining direct
event provenance or the derived token-location source block.
PostgreSQL integration tests cover finality gating, durable retry, verification revocation, lease
recovery, lost claims, stale-result rejection, successful revision publication, projection-created
job rollback, and the finalized A → unfinalized B → rollback → recovered A sequence.

## Transaction and rollback contract

The official `drizzleTarget` owns the serializable transaction and advisory cursor lock. The v3
wrapper registers all mutable application tables, calls the domain writer, upserts `indexed_heads`,
and lets Pipes save its cursor before one commit. Any thrown decoder, RPC, reducer, constraint, or
database error rolls the entire batch back. When a source batch omits a finalized cursor, the
indexed head retains its previously known finalized number and hash. A lower finalized cursor also
cannot reduce that watermark during forward processing; only restoration of the tracked head
snapshot may move it backwards during fork handling. When a live source reports a finalized head
ahead of the historical cursor being processed, the target records that processed cursor and its
hash as the highest finalized block available locally. Every advancing finalized pair is checked
against its local canonical block; a missing local height does not advance the watermark, and a hash
conflict aborts the transaction. The target takes rollback retention directly from the validated
network database configuration.

For an unfinalized block, triggers retain the earliest before-image per primary key and block. Fork
resolution deletes facts first, restores parent rows before children, removes consumed snapshots,
and removes cursor rows above the common ancestor. PostgreSQL integration tests cover injected
failure, duplicate replay, one-block rollback, multi-block rollback, metadata-job rollback, and
isolation from another chain schema.

## Migrations and views

Drizzle Kit generates one schema-relative migration series. The normalization step removes its
default `public` qualifiers and enum creation; the migration owner creates shared enum types once in
`lsp_v3` and rejects any pre-existing definition whose labels or ordering differ. Deterministic
owner and writer roles must be capability-limited non-login roles without direct or transitive role
memberships. The runtime login must be a login role while remaining non-superuser and unable to
create databases or roles, replicate, or bypass row-level security. Both migration and startup
revalidate every one of these attributes. The migrator traverses the reverse membership graph for
each writer and fails if any role other than the migration admin or configured runtime login can
reach it; an old login must be revoked before credential rotation. The runtime membership cannot
carry `ADMIN OPTION` and must carry `SET OPTION`; migration and startup revalidate both options.
They also inventory every writer ACL, ownership dependency, default ACL, and policy reference.
Anything outside the assigned chain schema is rejected except exact, non-grantable `USAGE` on the
shared schema and canonical enum types, plus the writer's global function default ACL containing
only its own `EXECUTE`. That restrictive default ACL removes PostgreSQL's built-in `PUBLIC EXECUTE`
from future Pipes rollback functions; the migrator also revokes it from existing functions. This
includes rejection of read-only foreign grants, shared-schema `CREATE`, and grant options. A
separate complete chain-schema ACL inventory allows only the writer, the API owner's exact read
grants, and PostgreSQL's inert row-type default described above. Only the current migration admin
may reach the API owner role. Each chain has an independent migration history whose normalized
hashes are verified on every run. Exported entry points reject duplicate network keys, chain IDs,
schemas, writer roles, and runtime logins before connecting. They also require the deterministic
schema and writer-role mapping for every network and reject reserved collisions. Existing chain
schemas must have an empty identity table or exactly the configured singleton before it is seeded.
A cluster-wide advisory lock rejects concurrent migration commands, and reapplying the same plan is
idempotent.

The migrator drops all enumerated API views before applying source-table changes and rebuilds them
after all enabled schemas are current. View removal, every enabled network migration, and view
replacement share one PostgreSQL transaction, so a failure on any chain or during the rebuild rolls
back earlier chain changes and restores the prior views. Migration and startup inventory the
migration table and sequence, cursor, and every expected chain table and require the deterministic
writer role to own each object. When migrations are pending, the preflight audits ownership of the
expected objects that already exist without treating not-yet-created latest tables as drift; the
complete inventory is mandatory after migration. A deterministic live-catalog
fingerprint then verifies all non-snapshot tables and sequences, relation settings, columns and
defaults, constraints, indexes, and sequence parameters. The migrator checks a fully current schema
before changing it and checks every schema after migration; startup readiness checks it again. A
dropped or added column, foreign key, check, index, or other reviewed storage object therefore fails
even if the Drizzle journal is unchanged. Pipes-managed `__snapshots` tables are excluded because
their lifecycle is dynamic.

After every enabled chain is current, the migrator transactionally replaces 15 security-barrier
views in `api` with `UNION ALL` selections. Internal jobs, cursor history, network identity,
migration history, and rollback artifacts are intentionally absent. Unexpected API relations abort
the rebuild. The shared namespace is accepted only when it contains the four canonical enums and
their generated array types. The reader may not own a schema, relation, routine, type, or database
and may hold only API/shared schema usage, canonical enum usage, and `SELECT` on the 15 enumerated
views. Effective access inherited from `PUBLIC` is included in that inventory; implicit public type
usage is removed from API view types and shared enums, while a publicly executable user-defined
routine aborts migration. Hasura and future packages must join, filter, cache, and subscribe with
both `network` and `chain_id`.

The migration owner grants view access to the non-login `lsp_indexer_v3_api_reader` role. When
`DATABASE_API_LOGIN` names an existing login, the migrator grants it only that reader role with
`INHERIT TRUE`, `SET FALSE`, and `ADMIN FALSE`. Its `api,lsp_v3,public` search path is scoped to the
migrated database. Hasura's `v3` source uses the login through
`HASURA_GRAPHQL_V3_DATABASE_URL`; it does not connect to physical chain schemas with a writer or
migration credential.

Generated Hasura metadata exposes a select, aggregate, and live-query subscription root for all 15
views to the `public` role. It exposes no mutations, metadata jobs, or primary-key roots. Every
paginated domain root has the stable suffix `chain_id, id`; `indexed_head` uses
`chain_id, network`. The complete root, relationship, scalar, and subscription contract is in
[V3_API.md](./V3_API.md).

Pipes `1.0.0-alpha.22` does not reconcile a snapshot table after a tracked column changes. An ordinary
pending migration therefore fails before execution whenever any snapshot table exists, even if
retention has emptied it. The projection rollout is the sole marked alpha exception: with all v3
indexers stopped, one transaction drops obsolete rollback artifacts and truncates all mutable
tables plus `sqd_cursor` across enabled schemas while preserving `network_config` and migration
history. Pipes recreates the 16 artifacts from the new tracked schema on restart, and the configured
range is replayed from the network start. Startup rejects a missing cursor with a later start block
and rejects a gap after an existing cursor. PostgreSQL integration tests exercise non-empty old
snapshots, atomic reset, and artifact recreation.
