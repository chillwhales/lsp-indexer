# LSP Indexer v3 compatibility contract

Status: proposed for review in [#380](https://github.com/chillwhales/lsp-indexer/issues/380)

V3 is a major release with a new multi-chain data structure. It preserves familiar domain behavior
and package roles, not accidental coupling to the v2 TypeORM schema.

## Compatibility levels

| Level                                                 | V3 policy                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Package names and entry points                        | Preserve unless a documented v3 replacement is necessary.                  |
| High-level fetch functions, hooks, and server actions | Preserve names and intent for every supported v2 domain.                   |
| Result fields                                         | Preserve meaningful v2 fields; add mandatory network and chain provenance. |
| Filters, includes, sorting, and pagination            | Preserve supported behavior and add network-aware semantics.               |
| Subscription lifecycle                                | Preserve connection, retry, reconnect, and cache invalidation behavior.    |
| GraphQL schema and generated types                    | Regenerate for v3; exact v2 Hasura names are not guaranteed.               |
| Internal parser and query-builder signatures          | May change; document any public removals in the migration guide.           |
| Database tables, IDs, and foreign keys                | Replaced by the v3 model; no compatibility promise.                        |
| Environment variables                                 | Replaced by validated v3 configuration with a migration table.             |

## Cross-cutting v3 types

`@lsp-indexer/types` will introduce shared schemas before domain packages are ported:

```typescript
type NetworkId = 'lukso-mainnet' | 'ethereum-mainnet' | 'ethereum-sepolia' | (string & {});

interface NetworkRef {
  network: NetworkId;
  chainId: number;
}

interface BlockRef extends NetworkRef {
  blockNumber: number;
  blockHash: string;
  timestamp: string;
}

interface EventRef extends BlockRef {
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
}
```

The implementation may use branded types without assertions at call sites, but JSON remains plain
strings and safe integers. Every detail lookup has one exact network. List APIs use one exact network
in v3.0; cross-network aggregation can be added later without weakening cache or identity rules.

Standalone functions make network explicit:

```typescript
fetchProfile(url, { network: 'lukso-mainnet', address });
```

V3 may also add an ergonomic client with a default network:

```typescript
const indexer = createIndexerClient({ url, network: 'lukso-mainnet' });
await indexer.fetchProfile({ address });
```

The client default never changes database identity. It only fills a required request field.

## Package contract

| Package              | Preserved                                                                                                   | V3 additions and intentional changes                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@lsp-indexer/types` | Zod-first domain models, filters, includes, sorts, hook params, errors, subscription interfaces             | Network schemas, block/event provenance, chain-aware params, v3 migration aliases where useful                     |
| `@lsp-indexer/node`  | `fetch*` service names, typed results, parsers, query keys, `IndexerError`, GraphQL WebSocket subscriptions | `createIndexerClient`, network-aware documents and keys, indexed-head/network discovery, regenerated GraphQL types |
| `@lsp-indexer/react` | Existing detail/list/infinite/subscription hook names and TanStack Query behavior                           | Network-scoped params and cache keys, optional client/provider default, network/head hooks                         |
| `@lsp-indexer/next`  | Existing query hooks, `actions` entry point, and `server` WebSocket proxy                                   | Network-scoped actions, v3 environment configuration, network-aware proxy behavior                                 |

React and Next do not implement their own query semantics. They call the v3 Node services so fixes
remain centralized.

## Domain matrix

| Public domain                | V2 capability retained                                              | Mandatory v3 change                                           | Candidate v3 addition                                   |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Profiles                     | Detail/list/infinite queries, includes, subscriptions               | Network-scoped address identity and provenance                | Indexed owner and metadata revision visibility          |
| Digital assets               | Detail/list/infinite queries, standard/type filters, subscriptions  | Network-scoped contract identity                              | Interface verification evidence and indexed-head status |
| NFTs                         | Detail/list/infinite queries, metadata and collection relationships | `(network, address, tokenId)` identity                        | Reference-contract and metadata-source provenance       |
| Owned assets                 | Detail/list/infinite balances and nested profiles/assets            | Network-scoped owner and asset key                            | Last canonical transfer provenance                      |
| Owned tokens                 | Detail/list/infinite token ownership and nested NFT data            | Network-scoped owner, asset, and token key                    | Last canonical transfer provenance                      |
| Followers                    | Follows, counts, batch checks, mutual relationships, subscriptions  | Network-scoped follower edge                                  | Canonical follow/unfollow provenance                    |
| Creators                     | Creator queries, includes, subscriptions                            | Network-scoped creator and asset relationship                 | Verification state                                      |
| Issued assets                | Issuer-to-asset queries, includes, subscriptions                    | Network-scoped issuer and asset relationship                  | Registry position provenance                            |
| Collection attributes        | Distinct facets and collection count                                | Network-scoped collection                                     | Stable facet ordering and indexed-head status           |
| Data changed events          | History/latest queries, filters, includes, subscriptions            | Deterministic event ID, network, block hash, transaction hash | Raw topic/data provenance where useful                  |
| Token ID data changed events | History/latest queries, filters, includes, subscriptions            | Deterministic event ID and full chain provenance              | Metadata revision linkage                               |
| Universal receiver events    | History queries, filters, includes, subscriptions                   | Deterministic event ID and full chain provenance              | Decoded type classification where available             |
| Encrypted assets             | List/batch queries, nested structures, subscriptions                | Network-scoped content identity and durable fetch state       | Retry/source revision visibility where safe             |

Existing event domains not yet exposed through the packages remain available to Hasura only when
they meet the v3 schema, permission, and documentation requirements. New package domains are added
through their own issues and documentation rather than silently appearing during parity work.

The ingestion-level field and behavior mapping for all 11 legacy event plugins is recorded in
[`V3_EVENT_DISPOSITION.md`](./V3_EVENT_DISPOSITION.md). Public package exposure remains governed by
the domain matrix and the #386–#388 API tasks.

## Result-shape rules

- `network` and `chainId` are required on every top-level domain result.
- Historical event results also require `blockHash` and `transactionHash`.
- Existing flat `blockNumber`, `timestamp`, `transactionIndex`, and `logIndex` fields remain for
  familiar consumption; v3 does not force consumers through a nested provenance object.
- Addresses remain `0x` strings. Storage normalizes case, and response formatting is consistent
  across every domain.
- Big integer amounts are decimal strings at the GraphQL/JSON transport boundary.
- `@lsp-indexer/node` parses `totalSupply`, owned-asset `balance`, universal-receiver `value`, and
  future big integer amounts to JavaScript `bigint` before result validation. React and Next expose
  the same parsed values, preserving the v2 runtime and Zod contract.
- An unavailable optional include is omitted according to the existing include result machinery; a
  requested relationship that is genuinely absent is `null` or an empty array as documented.
- Every list has deterministic tie-break sorting based on chain provenance or its natural key.
- Cache keys include API version, network, domain, filters, includes, sorting, and pagination.

## Intentional breaking changes

V3 is allowed to break the following behavior:

- Address-only lookups without a network
- Random UUID event IDs
- Case-insensitive `_ilike` address comparisons
- Direct reliance on TypeORM table or relationship names
- Stale v2 generated GraphQL types
- Environment defaults that silently select LUKSO
- Cross-chain cache collisions
- Treating an indexer endpoint as current without checking its indexed head

The migration guide will list every removed export and provide a direct replacement or state that no
replacement exists.

## Compatibility evidence

Each public domain needs all of the following before its v3 task is complete:

1. A v2-to-v3 field matrix with retained, changed, added, and removed fields.
2. Runtime Zod fixtures for minimal, full-include, null-relationship, and invalid responses.
3. Node service tests for detail/list/latest/batch behavior as applicable.
4. React cache-key and hook tests including two networks with the same address.
5. Next server action and SSR-safe import tests.
6. GraphQL query and subscription integration tests against the v3 Hasura schema.
7. Updated Node, React, Next, quickstart, and domain documentation.

## V2 deletion boundary

The v2 runtime remains available for comparison and rollback through #389's production cutover and
the full owner-approved rollback window. Only after that window closes with signed-off recovery
evidence does the final v3 program delete the legacy processor, TypeORM, schema codegen, pipeline,
and deployment paths. It does not delete published v2 npm versions; consumers can remain pinned
while following the migration guide. No v2 compatibility shim runs inside the production v3
indexer.
