# LSP Indexer v3 GraphQL contract

Status: implemented for [#386](https://github.com/chillwhales/lsp-indexer/issues/386)

This document defines the read-only, multi-chain Hasura boundary consumed by the v3 Node, React,
and Next.js packages. The generated metadata and public schema snapshots in
`packages/indexer-v3/hasura` are the executable source of truth.

## Runtime boundary

Hasura tracks only the 15 security-barrier views in the PostgreSQL `api` schema. It does not track
physical chain schemas, migration state, Pipes cursors or snapshots, `network_config`, or the
internal `metadata_jobs` queue. The public role receives select, aggregate, relationship, and live
query subscription access. It receives no insert, update, delete, or mutation permissions.

The database roles are intentionally separate:

- `lsp_indexer_v3_api_owner` owns the generated cross-chain views and has no login.
- `lsp_indexer_v3_api_reader` can use the shared enum and API schemas and select the views.
- The login named by `DATABASE_API_LOGIN` is granted only the reader role during migration, with
  inheritance enabled but role switching and membership administration disabled.
- The migrator pins that login's search path to `api,lsp_v3,public` for the migrated database only,
  so enum filters resolve without granting physical chain-schema access or changing its sessions in
  any other database.
- Hasura connects its `v3` source through `HASURA_GRAPHQL_V3_DATABASE_URL`, using that login.
- Hasura sets `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public` for clients without an admin secret.
- `DATABASE_ADMIN_URL` and `HASURA_GRAPHQL_ADMIN_SECRET` are one-shot operator credentials and must
  not be available to indexer, metadata-worker, or public client processes.

`DATABASE_API_LOGIN` is authoritative on every migration run. When it is set, that login must be
the reader role's only direct or transitive member; when it is omitted, the reader role must have no
members. This makes retired Hasura credentials fail migration instead of retaining stale access.

The source contract is validated in CI against Hasura `v2.46.0`, PostgreSQL 17, the public HTTP
endpoint, and a real unauthenticated WebSocket connection.

## Public roots

Every row exposes `network` and its EIP-155 `chain_id`. Each select root has a matching aggregate
root and live-query subscription root.

| PostgreSQL view      | Select and subscription root | Aggregate root                 | Stable pagination suffix |
| -------------------- | ---------------------------- | ------------------------------ | ------------------------ |
| `blocks`             | `block`                      | `block_aggregate`              | `chain_id`, `id`         |
| `event_facts`        | `event_fact`                 | `event_fact_aggregate`         | `chain_id`, `id`         |
| `universal_profiles` | `universal_profile`          | `universal_profile_aggregate`  | `chain_id`, `id`         |
| `digital_assets`     | `digital_asset`              | `digital_asset_aggregate`      | `chain_id`, `id`         |
| `nfts`               | `nft`                        | `nft_aggregate`                | `chain_id`, `id`         |
| `owned_assets`       | `owned_asset`                | `owned_asset_aggregate`        | `chain_id`, `id`         |
| `owned_tokens`       | `owned_token`                | `owned_token_aggregate`        | `chain_id`, `id`         |
| `follower_edges`     | `follower`                   | `follower_aggregate`           | `chain_id`, `id`         |
| `creators`           | `lsp4_creator`               | `lsp4_creator_aggregate`       | `chain_id`, `id`         |
| `issued_assets`      | `lsp12_issued_asset`         | `lsp12_issued_asset_aggregate` | `chain_id`, `id`         |
| `controllers`        | `lsp6_controller`            | `lsp6_controller_aggregate`    | `chain_id`, `id`         |
| `chillwhales_nfts`   | `chillwhales_nft`            | `chillwhales_nft_aggregate`    | `chain_id`, `id`         |
| `data_values`        | `data_value`                 | `data_value_aggregate`         | `chain_id`, `id`         |
| `metadata_revisions` | `metadata_revision`          | `metadata_revision_aggregate`  | `chain_id`, `id`         |
| `indexed_heads`      | `indexed_head`               | `indexed_head_aggregate`       | `chain_id`, `network`    |

These are list roots because PostgreSQL views do not expose primary-key metadata to Hasura. V3
does not publish `*_by_pk` or streaming cursor roots. `indexed_head` deliberately has no synthetic
`id`; its natural identity is `(network, chain_id)`.

## Multi-chain semantics

An omitted network filter means all enabled chains in the deployed `api` views. An address, token
ID, block number, or relationship key is never globally unique without a chain. Consumers that
intend one chain must include a `chain_id` equality or membership filter.

Every manual Hasura relationship includes `chain_id` in its column mapping. Consequently, the same
address and token ID on two chains cannot join to one another. `network` remains an explicit
human-readable discriminator, while `chain_id` is the stable join identity.

The following relationship names are stable package inputs:

| Root type            | Relationships                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `block`              | `events`                                                                                                                 |
| `event_fact`         | `block`, `universalProfile`, `digitalAsset`                                                                              |
| `universal_profile`  | `ownedAssets`, `ownedTokens`, `controllers`, `issuedAssets`, `followed`, `followedBy`, `dataValues`, `metadataRevisions` |
| `digital_asset`      | `nfts`, `ownedAssets`, `ownedTokens`, `lsp4Creators`, `lsp12IssuedBy`, `dataValues`, `metadataRevisions`                 |
| `nft`                | `digitalAsset`, `chillwhales`, `ownedToken`, `ownedTokens`, `dataValues`, `metadataRevisions`                            |
| `owned_asset`        | `universalProfile`, `digitalAsset`, `tokenIds`                                                                           |
| `owned_token`        | `universalProfile`, `digitalAsset`, `nft`, `ownedAsset`                                                                  |
| `follower`           | `followerUniversalProfile`, `followedUniversalProfile`                                                                   |
| `lsp4_creator`       | `digitalAsset`, `creatorProfile`                                                                                         |
| `lsp12_issued_asset` | `universalProfile`, `digitalAsset`                                                                                       |
| `lsp6_controller`    | `universalProfile`, `controllerProfile`                                                                                  |
| `chillwhales_nft`    | `nft`, `digitalAsset`                                                                                                    |
| `data_value`         | `universalProfile`, `digitalAsset`, `nft`                                                                                |
| `metadata_revision`  | `universalProfile`, `digitalAsset`, `nft`                                                                                |

Every array relationship also has a matching `<name>_aggregate` field.

The singular `nft.ownedToken` relationship includes the NFT's current `owner_address` in addition
to its chain, contract, and token ID. `owned_asset.tokenIds` and `owned_token.ownedAsset` use the
same chain, holder, and asset identity. These mappings retain the familiar v2 ownership include
paths without allowing a holder or token on another chain to join accidentally.

## Filtering, ordering, and pagination

Select roots expose Hasura's `where`, `order_by`, `distinct_on`, `limit`, and `offset` arguments.
Aggregate roots accept the same selection filters and expose `count` plus scalar aggregates where
the underlying type supports them.

Hasura does not impose a default order. Any paginated query must supply its domain order and append
the stable suffix from the table above. For example, an asset query sorted by its latest change
must end with `chain_id` and `id`; `indexed_head` ends with `chain_id` and `network`. Offset
pagination is relative to the current snapshot and should not be treated as an immutable cursor.
The v3 Node package will centralize these suffixes in its query builders and cache keys.

```graphql
query ProfilesAcrossSelectedChains($chains: [bigint!]!, $limit: Int!, $offset: Int!) {
  universal_profile(
    where: { chain_id: { _in: $chains }, verification: { _eq: "verified" } }
    order_by: [{ last_block_number: desc }, { chain_id: asc }, { id: asc }]
    limit: $limit
    offset: $offset
  ) {
    id
    network
    chain_id
    address
    ownedAssets(order_by: [{ chain_id: asc }, { id: asc }]) {
      id
      digitalAsset {
        id
        network
        chain_id
      }
    }
  }
  universal_profile_aggregate(
    where: { chain_id: { _in: $chains }, verification: { _eq: "verified" } }
  ) {
    aggregate {
      count
    }
  }
}
```

## Subscriptions

Every select root is also a Hasura live-query subscription. It accepts the same chain filters,
ordering, limit, and offset as its query form. Each delivery is a refreshed result snapshot, not an
append-only event stream. Consumers must use the same deterministic order as their corresponding
query so cache replacement is stable.

```graphql
subscription IndexedHeads($chains: [bigint!]!) {
  indexed_head(where: { chain_id: { _in: $chains } }, order_by: [{ chain_id: asc }]) {
    network
    chain_id
    block_number
    block_hash
    finalized_block_number
    finalized_block_hash
  }
}
```

## Scalar boundary

The raw schema retains Hasura/PostgreSQL scalars including `bigint`, `numeric`, `jsonb`, and
`timestamptz`, plus the v3 enum scalars. The generated v3 package types and parsers, not Hasura
metadata, define their public TypeScript representations. Lossless quantities must never pass
through JavaScript number coercion. PostgreSQL view introspection also makes raw GraphQL columns
nullable even when every branch selects a `NOT NULL` base column; package parsers enforce the
documented non-null domain invariants at the service boundary. That package work belongs to #387
and uses the checked-in `hasura/schema.graphql` snapshot as its code-generation input.

## Operator workflow

Provision the Hasura login before migration, then let the migrator grant the reader role:

```bash
DATABASE_ADMIN_URL=postgresql://migration_admin:secret@localhost/lsp_indexer_v3 \
DATABASE_API_LOGIN=lsp_v3_hasura \
  pnpm --filter @chillwhales/indexer-v3 db:migrate
```

Configure Hasura's v3 source and apply the generated metadata:

```env
HASURA_GRAPHQL_V3_DATABASE_URL=postgresql://lsp_v3_hasura:secret@postgres/lsp_indexer_v3
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=public
```

```bash
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080
HASURA_GRAPHQL_ADMIN_SECRET=operator-secret

pnpm --filter @chillwhales/indexer-v3 hasura:generate
pnpm --filter @chillwhales/indexer-v3 hasura:apply
pnpm --filter @chillwhales/indexer-v3 hasura:schema:dump
```

`hasura:check` rejects generated metadata drift. `hasura:schema:check` introspects the public role
and rejects a live schema that differs from the checked-in snapshot. CI additionally seeds the same
addresses on two chains, exercises every root, aggregate, relationship, and pagination primitive,
opens a public WebSocket subscription, and proves that a public mutation is rejected.

`hasura:apply` exports the current metadata, replaces only the source named `v3`, and preserves
unrelated sources, remote schemas, actions, and other metadata. The replacement includes Hasura's
exported resource version, so a concurrent operator update fails instead of being overwritten.
