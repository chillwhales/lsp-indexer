# LSP Indexer v3 architecture

Status: proposed for review in [#380](https://github.com/chillwhales/lsp-indexer/issues/380)

This document records the architecture boundary for a from-scratch, multi-chain LSP Indexer v3.
Detailed tables belong to #382 and detailed domain transitions belong to #384, but those workstreams
must preserve the decisions below.

## Decision summary

| ID   | Decision                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A001 | Build v3 beside v2 in `packages/indexer-v3` through the post-cutover rollback window; do not adapt the v2 pipeline.                              |
| A002 | Run one isolated Pipes process or container per network in production.                                                                           |
| A003 | Use one shared PostgreSQL cluster, but isolate mutable Pipes tables and rollback snapshots in a physical schema per network.                     |
| A004 | Expose a unified, read-only `api` schema composed from cross-network PostgreSQL views and track that schema in Hasura.                           |
| A005 | Use Drizzle for schema definitions, migrations, transactions, and the official Pipes PostgreSQL target. Do not build a custom target by default. |
| A006 | Use stable EIP-155 chain IDs plus stable network keys everywhere; never infer a network from an address.                                         |
| A007 | Use deterministic event and projection IDs. V3 does not create random IDs for replayable chain data.                                             |
| A008 | Keep raw event facts separate from mutable current-state projections.                                                                            |
| A009 | Bind RPC reads to the triggering block identity and reject results if the provider cannot verify that exact hash.                                |
| A010 | Queue immutable metadata revisions transactionally, but fetch outside Pipes only after the source block is finalized.                            |
| A011 | Keep Hasura as the query and subscription runtime while replacing the old Squid and TypeORM stack.                                               |
| A012 | Preserve familiar high-level package APIs, but make network scope explicit and version all breaking contracts as v3.                             |

Changing one of these decisions requires updating this document, the compatibility contract, the
acceptance gates, and the affected goal issue in the same pull request.

## Verified SDK baseline

The initial implementation spike targets exact versions rather than floating prerelease tags:

| Component         | Baseline       | Reason                                                |
| ----------------- | -------------- | ----------------------------------------------------- |
| Node.js           | `22.15.0`      | Exact minimum required by the published Pipes package |
| `@subsquid/pipes` | `1.0.0-beta.3` | Current published release when #380 was researched    |
| `drizzle-orm`     | `0.44.7`       | Pipes peer dependency                                 |
| `pg`              | `8.16.3`       | Pipes peer dependency                                 |

The baseline is evidence for the architecture, not permission to ship an outdated beta. Every
runtime or SDK upgrade is reviewed explicitly, and production uses an exact version. Primary
references:

- [Pipes v1.0.0-beta.3 release](https://github.com/subsquid/pipes-sdk/releases/tag/pipes-v1.0.0-beta.3)
- [Pipes quickstart](https://docs.sqd.dev/en/sdk/pipes-sdk/evm/quickstart)
- [Drizzle PostgreSQL target](https://docs.sqd.dev/en/sdk/pipes-sdk/evm/guides/basic-development/targets/postgres-drizzle)
- [Released runner guidance](https://github.com/subsquid/pipes-sdk/blob/pipes-v1.0.0-beta.3/packages/pipes/src/runtime/node/runner.ts)
- [Released rollback tracker](https://github.com/subsquid/pipes-sdk/blob/pipes-v1.0.0-beta.3/packages/pipes/src/targets/drizzle/node-postgres/drizzle-tracker.ts)

## Target topology

```mermaid
flowchart LR
  PortalA[Portal or official RPC source] --> PipeA[One Pipes process: network A]
  PortalB[Portal or official RPC source] --> PipeB[One Pipes process: network B]
  PipeA --> SchemaA[(chain_a schema)]
  PipeB --> SchemaB[(chain_b schema)]
  SchemaA --> Views[(api union views)]
  SchemaB --> Views
  PipeA --> Jobs[(finalized metadata jobs)]
  PipeB --> Jobs
  Jobs --> Workers[Metadata workers]
  Workers --> SchemaA
  Workers --> SchemaB
  Views --> Hasura[Hasura queries and subscriptions]
  Hasura --> NodeSDK[@lsp-indexer/node v3]
  NodeSDK --> ReactSDK[@lsp-indexer/react v3]
  NodeSDK --> NextSDK[@lsp-indexer/next v3]
```

The database migration job and Hasura metadata job are separate from every indexer process. A
network process never races another process to apply migrations.

## Multi-chain runtime

### Production isolation

The Pipes `devRunner` documentation explicitly limits its multi-pipe runner to local development
because pipes share one JavaScript thread and process fate. Production therefore runs one identical
artifact per network. Each deployment receives one `INDEXER_NETWORK` key, one RPC endpoint, and one
stable pipe ID.

The stable pipe ID format is:

```text
lsp-indexer:v3:eip155:<chainId>
```

It is never derived from a pod name, deployment revision, hostname, or database schema. This ID is
the Pipes cursor key and must survive restarts and infrastructure replacement.

### Network configuration contract

Static, non-secret capabilities live in a typed registry. URLs and credentials can be overridden or
injected through validated environment variables.

```typescript
interface NetworkConfig {
  key: string;
  chainId: number;
  displayName: string;
  startBlock: number;
  portalDataset?: string;
  rpcUrlEnv: string;
  finalityConfirmations: number;
  multicallAddress: string;
  ipfsGateway: string;
  contracts: {
    lsp23Factory?: { address: string; fromBlock: number };
    lsp26FollowerSystem?: { address: string; fromBlock: number };
  };
  extensions: readonly string[];
}
```

An absent contract is represented by `undefined`, never the zero address. Domain capabilities are
selected from configuration rather than scattering `supportedChains` arrays through every event or
projection module.

### Initial validation catalog

The earlier multi-chain work in [PR #366](https://github.com/chillwhales/lsp-indexer/pull/366)
established the intended first catalog. V3 reimplements it rather than merging its v2 architecture:

| Network key        | EIP-155 chain ID | Portal status on 2026-08-20 | Initial role                               |
| ------------------ | ---------------: | --------------------------- | ------------------------------------------ |
| `lukso-mainnet`    |               42 | Historical, not real-time   | Full parity and historical backfill        |
| `ethereum-mainnet` |                1 | Real-time                   | Multi-chain and live-ingestion validation  |
| `ethereum-sepolia` |         11155111 | Real-time                   | Test deployments and controlled validation |

The catalog is extensible without changing domain code. A network is enabled only when its source,
RPC, Multicall3, start height, finality, and deployed contract capabilities are validated.

## Source and decoding boundary

Each network builds one EVM source with named decoder outputs. The source selects only required
block, transaction, and log fields. Decoded events always retain:

- Network key and EIP-155 chain ID
- Block number, block hash, parent hash, and timestamp
- Transaction hash and transaction index
- Log index, emitting address, topics, and data

The released event decoder already provides block hash, timestamp, transaction hash, transaction
index, and log index. V3 must not throw that provenance away when producing domain facts.

RPC calls used for `supportsInterface`, decimals, ownership, or other state reads carry the
triggering block number and hash. When a client supports EIP-1898, it reads by hash. A number-only
client must verify that the provider maps that number to the triggering hash immediately before and
after each read. A mismatch on either side rejects the result instead of mixing state from two
forks. Reads run in a transform before the database transaction so a slow provider does not hold
database locks. Provider transport failures and block-identity mismatches abort the batch; because
the cursor has not committed, retry starts from the same canonical position.

Deterministic contract-level failures are isolated per call. A revert, unsupported selector, or
invalid return value records an invalid or unknown verification result, preserves the raw fact, and
does not abort the batch or any other call. A failed verification result cannot create a typed
relationship or projection. This prevents a malicious or nonconforming emitter from indefinitely
stalling one network's cursor.

### Current source gates

- The live `lukso-mainnet` Portal metadata currently reports `real_time: false`:
  [dataset metadata](https://portal.sqd.dev/datasets/lukso-mainnet/metadata).
- Pipes RPC fallback remains an open draft:
  [subsquid/pipes-sdk#109](https://github.com/subsquid/pipes-sdk/pull/109).
- LUKSO production cannot cut over until one of those official paths provides live data and passes
  our fork/recovery suite.
- V3 does not copy the old processor into a fallback adapter. A temporary custom source requires a
  separate owner-approved architecture change because it creates a permanent correctness burden.

## PostgreSQL and rollback boundary

### Why physical per-network isolation is required

Pipes persists cursor state by pipe ID, but the released Drizzle snapshot tracker cleans and rolls
back snapshot rows using block number alone. It does not include the pipe ID in snapshot rows or
rollback predicates. Two networks at different heights writing the same physical tables could
therefore clean or restore each other's rollback history.

V3 prevents that class of corruption structurally:

- Every network owns a PostgreSQL schema such as `chain_lukso_mainnet`.
- Each indexer connection uses only its network schema for mutable chain tables, snapshot tables,
  rollback functions, and Pipes cursor state.
- The fixed runtime search path is `chain_<network>,lsp_v3,public`; `lsp_v3` contains only immutable
  enum types shared so cross-network union views have compatible PostgreSQL column types.
- Application table names remain identical across network schemas so one Drizzle definition and one
  migration series can be applied repeatedly.
- No indexer role receives write access to another network schema.
- The migration test must prove the target's unqualified trigger SQL stays inside the configured
  connection `search_path`; otherwise #382 must select separate databases instead.

The shared `api` schema contains read-only `UNION ALL` views over enabled network schemas. Each view
includes `network` and `chain_id`, and relationships include network identity in their join. Hasura
supports exposing PostgreSQL views to both queries and subscriptions:
[Hasura view documentation](https://github.com/hasura/graphql-engine/blob/master/docs/docs/schema/postgres/views.mdx).

Adding a network is a migration operation: create its schema, apply every v3 migration, validate its
constraints, replace the affected `api` views transactionally, and apply Hasura metadata. It is not
a runtime `CREATE TABLE` side effect.

Drizzle Kit emits `public` qualifiers for unqualified schemas. The checked-in migration generation
step removes enum DDL (the immutable catalog is bootstrapped once in `lsp_v3`) and normalizes other
references to schema-relative SQL. CI rejects any remaining `public` qualifier. Migration history
stores and verifies each normalized SQL hash, so editing an applied migration is detected as drift.

### Data conventions

- Network keys use lowercase kebab case and never change after publication.
- Addresses are stored as canonical lowercase `0x` strings with database validation; equality is
  exact rather than case-insensitive pattern matching.
- Chain IDs and block heights use PostgreSQL `bigint` and are validated as safe integers at the SDK
  boundary.
- Token IDs remain canonical bytes32 hex strings; they are not coerced into decimal numbers.
- EVM unsigned integer values use lossless PostgreSQL numeric values and strings in public JSON.
- Timestamps are UTC and serialized as ISO 8601 strings.
- Every mutable table has a declared primary key and is registered with the Drizzle target.
- Foreign keys use natural chain-scoped keys; nullable relationships never decide whether a raw
  fact is retained.

### Deterministic identities

Raw log identity is the tuple:

```text
(chain_id, block_number, transaction_index, log_index)
```

The public `id` is a deterministic encoding of that tuple. Block hash and transaction hash are
stored as provenance and checked during replay. Current-state natural keys are:

| Projection        | Natural key                                                 |
| ----------------- | ----------------------------------------------------------- |
| Universal Profile | `(chain_id, address)`                                       |
| Digital asset     | `(chain_id, address)`                                       |
| NFT               | `(chain_id, address, token_id)`                             |
| Owned asset       | `(chain_id, owner_address, asset_address)`                  |
| Owned token       | `(chain_id, owner_address, asset_address, token_id)`        |
| Follower edge     | `(chain_id, follower_address, followed_address)`            |
| Metadata revision | `(chain_id, address, token_id?, data_key, source_revision)` |

Random UUIDs are allowed only for genuinely off-chain operational records that have no deterministic
natural key.

### Transaction flow

For each batch:

1. Pipes fetches and decodes selected events.
2. Pure transforms normalize facts and derive block-pinned RPC read requests.
3. RPC reads complete at the triggering block; failure leaves the cursor unchanged.
4. The Drizzle target opens a serializable transaction and acquires the Pipes advisory lock.
5. Raw facts are inserted idempotently.
6. Current-state projections are reduced in canonical block, transaction, and log order.
7. Metadata jobs and indexed-head visibility are updated.
8. Pipes commits data, rollback snapshots, finalized watermark, and cursor atomically.

Domain logic may read existing state inside step 6. It must not keep an unversioned in-memory mirror.
Any future stateful transform must implement and test the Pipes rollback hook.

The initial #382 schema has canonical `blocks` and `event_facts`; current profiles, assets, NFTs,
owned assets and tokens, follower edges, creators, issued assets, controllers, and ERC725Y values;
metadata revisions and durable jobs; indexed head visibility; network identity; and the Pipes cursor.
The raw fact shape is stable while #383 and #384 add event-specific decoding and reduction logic.

### Schema evolution gates

The released target does not reconcile snapshot tables after tracked columns are added:
[subsquid/pipes-sdk#150](https://github.com/subsquid/pipes-sdk/issues/150). During the alpha, destructive
fresh-database rebuilds are acceptable. Production migrations cannot add or change tracked columns
until the released SDK safely reconciles snapshots or an owner-approved migration procedure proves
that rollback data is preserved.

The migration runner enforces that rule: if a pending migration exists and any rollback snapshot
table contains rows, it fails before executing the migration. PostgreSQL integration tests exercise
that refusal with a synthetic tracked-table schema change.

The bounded-finality fix is also still a draft:
[subsquid/pipes-sdk#143](https://github.com/subsquid/pipes-sdk/pull/143). Backfill completion evidence
must verify that the requested finalized tail was actually committed rather than trusting process
exit alone.

## Facts, projections, and extensions

V3 stores three categories deliberately:

1. **Raw facts:** decoded chain events required by public history APIs, auditability, replay, or
   projection rebuilding.
2. **Core projections:** profiles, digital assets, NFTs, ownership, followers, creators, issued
   assets, metadata, supply, permissions, and related current state.
3. **Optional extensions:** Chillwhales-specific and future product modules enabled only on networks
   with the required contracts.

A raw fact is retained even if later verification says its address does not implement an expected
interface. Verification affects typed relationships and projections, not historical truth. This
preserves the useful v2 behavior without porting its enrichment queue implementation.

## Metadata subsystem

Network transactions write durable metadata jobs containing the source natural key, source block,
data key, content URI, declared verification method and digest when present, immutable source
revision, and status. Workers claim jobs with bounded concurrency and `FOR UPDATE SKIP LOCKED`.

Workers process only jobs whose source block is finalized. A successful write includes the source
revision in its predicate, so an old response cannot replace newer on-chain metadata. Retry state,
next-attempt time, terminal error, response size, content type, and latency are observable. IPFS and
HTTP side effects are never performed inside the Pipes database transaction.

Metadata locations are untrusted contract input. The worker uses a closed scheme allowlist: bounded
`data:` content, `ipfs:` through an operator-configured gateway, `https:`, and `http:` only when the
owner explicitly enables it. Every network request normalizes IP literals, resolves all DNS A and
AAAA answers, and rejects loopback, link-local, private, carrier-grade NAT, multicast, reserved, and
other non-public destinations before opening a connection. The client connects only to the validated
address, preserves the validated hostname for TLS, caps redirects, and repeats scheme and address
validation for every redirect. Production egress policy independently blocks the same destinations.

Workers retain the exact fetched bytes until verification finishes. When the source declares a
VerifiableURI method and digest, the worker computes that method over those bytes before parsing or
publishing them. A digest mismatch or unsupported method may use the bounded retry policy but can
never update a metadata projection; its terminal state and reason remain observable. Content without
a declared digest is explicitly unverified and is never presented as verified chain state.

Each source revision has an immutable deterministic job identity, and job state is registered with
the Pipes rollback target. If unfinalized revision B supersedes a processing job for finalized
revision A, B snapshots A before cancelling it. Settlement by A's old claim writes nothing. Rolling
B back removes B and restores A's prior job and lease; normal expired-lease recovery then reclaims A
and can publish its immutable revision. #385 must include a PostgreSQL integration test for this
exact A → B → rollback → A recovery sequence.

## Query and package boundary

Hasura tracks the `api` views, their manually configured relationships, permissions, and live-query
subscriptions. Internal chain schemas, snapshot tables, cursor tables, and metadata job tables are
not part of the public GraphQL schema.

`@lsp-indexer/types` defines the public contract first. `@lsp-indexer/node` owns transport,
documents, parsing, query keys, and subscriptions. React and Next remain thin integrations over the
Node contract. All cache keys and subscriptions include network identity.

The detailed preservation and breaking-change rules are in
[V3_COMPATIBILITY.md](./V3_COMPATIBILITY.md).
The implemented PostgreSQL object and rollback contract is in [V3_SCHEMA.md](./V3_SCHEMA.md).

## Development and cutover layout

During development:

```text
packages/indexer/       # deployable v2 reference through the rollback window
packages/indexer-v3/    # clean Pipes implementation
```

V3 uses a new database or database cluster for backfill and shadow validation. It never points at
the production v2 tables. The comparison tool compares v2 and v3 endpoints at a shared finalized
height.

The final integration PR stays draft throughout production validation and the rollback window. The
cutover sequence is:

1. Stop v3 schema changes and complete a final clean replay or verified migration.
2. Run v2 and v3 in parallel through the agreed finalized height.
3. Cut production and consumers to the reviewed v3 candidate during the documented window while
   retaining the deployable v2 source, artifacts, database, and endpoint.
4. Exercise and retain the tested v2 rollback path for the full owner-approved rollback window.
5. Only after that window closes with owner sign-off, delete the v2 runtime and rename
   `packages/indexer-v3` to `packages/indexer` on `lsp-indexer-v3`; then rerun the final build,
   replay, package, parity, and recovery gates.
6. Only the repository owner may mark PR #391 ready and merge `lsp-indexer-v3` to `main`.

## Explicit non-goals

- Porting `BatchContext`, the enrichment queue, the plugin registry, or TypeORM entity classes
- Sharing mutable rollback-tracked tables between network pipes
- Using the Pipes local `devRunner` as the production supervisor
- Treating Portal availability as equivalent to live availability
- Calling current-state RPC methods at `latest` during historical replay
- Performing HTTP or IPFS requests while a database transaction is open
- Preserving undocumented v2 database details as public v3 contracts
- Merging the v3 integration PR before shadow-production acceptance is complete
