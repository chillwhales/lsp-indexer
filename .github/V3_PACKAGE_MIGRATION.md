# Migrating consumer packages from v2 to v3

V3 replaces the single-chain TypeORM GraphQL contract with the multi-chain Pipes/Hasura contract.
The package names stay the same, but consumers must upgrade `@lsp-indexer/types`,
`@lsp-indexer/node`, `@lsp-indexer/react`, and `@lsp-indexer/next` together because they are released
as one fixed major-version group.

```bash
pnpm up @lsp-indexer/types@^3 @lsp-indexer/node@^3 \
  @lsp-indexer/react@^3 @lsp-indexer/next@^3
```

Published v2 packages remain available for an application-level rollback. V3 does not contain a
v2 compatibility shim and must not be pointed at the v2 GraphQL schema.

## Required network scope

Every detail, list, batch, server-action, hook, and subscription request now requires a `network`.
It is part of the request identity and every cache key.

```ts
const profile = await fetchProfile(url, {
  network: 'lukso-mainnet',
  address: '0x...',
});

const indexer = createIndexerClient({
  url,
  network: 'lukso-mainnet',
});

const { items } = await indexer.profiles({ limit: 20 });
```

The same address on two chains is intentionally two different records and two different cache
entries. The scoped client fills its configured network into requests; it does not change database
identity or enable cross-network detail lookups.

## Configuration changes

| Runtime               | Required v3 variables                                    | Optional override                        |
| --------------------- | -------------------------------------------------------- | ---------------------------------------- |
| Browser/React         | `NEXT_PUBLIC_INDEXER_URL`, `NEXT_PUBLIC_INDEXER_NETWORK` | `NEXT_PUBLIC_INDEXER_WS_URL`             |
| Next.js server        | `INDEXER_URL`, `INDEXER_NETWORK`                         | `INDEXER_WS_URL`                         |
| Next.js subscriptions | browser variables plus the existing WS proxy settings    | server WS URL derived from `INDEXER_URL` |

`INDEXER_URL` and `INDEXER_NETWORK` fall back only to their explicit `NEXT_PUBLIC_*` counterparts.
There is no implicit network. HTTP variables accept only HTTP(S), WebSocket variables accept only
WS(S), and invalid or missing configuration throws an `IndexerError` with category
`CONFIGURATION`.

Next.js server actions now receive the same network-bearing parameter object as their matching
Node service. React and Next hooks likewise require `network`; update calls such as
`useProfile({ address })` to `useProfile({ network, address })`.

## Result and input changes

All top-level results add `network` and `chainId`. Projection records add their deterministic ID,
verification state, and last canonical block/transaction provenance. Historical events add stable
block hash and transaction hash provenance. Addresses remain hex strings, timestamps remain ISO
strings, and lossless quantities such as balances, supplies, event values, and array indexes are
parsed as `bigint`. Metadata `sourceRevision` values are canonical 32-byte hashes, not numeric
revision counters.

The uniform v3 API exposes these 15 domains: blocks, event facts, profiles, digital assets, NFTs,
owned assets, owned tokens, followers, creators, issued assets, controllers, Chillwhales NFTs, data
values, metadata revisions, and indexed heads. Each list returns `{ items, totalCount }`, accepts
GraphQL-neutral filters/sorts, and enforces a limit of 1–100. The familiar services retain their
domain-specific result property names.

| Familiar domain       | Retained                                                             | Changed or added in v3                                                       | Compatibility fields rejected by v3                                       |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Profiles              | detail/list filters, includes, pagination, subscriptions             | network/chain identity, owner, verification, canonical projection provenance | `name`, `followerCount`, and `followingCount` sorts                       |
| Digital assets        | detail/list metadata, owner/holder filters, includes, subscriptions  | `UNKNOWN` standard, verification and canonical projection provenance         | `holderCount`, `creatorCount`, and `createdAt` sorts                      |
| NFTs                  | detail/list token, holder, metadata and Chillwhales filters/includes | deterministic chain/token identity, owner, URI, verification/provenance      | `score` sort                                                              |
| Owned assets          | list/detail balances and nested profile/asset data                   | chain-scoped owner/asset identity and canonical provenance                   | `digitalAssetName` and `tokenIdCount` sorts                               |
| Owned tokens          | list/detail token ownership and nested NFT/asset data                | chain-scoped owner/asset/token identity and canonical provenance             | none                                                                      |
| Followers             | lists, counts, checks, mutual/followed-by helpers and subscriptions  | chain-scoped edge plus follow/unfollow provenance                            | `followerName` and `followedName` sorts                                   |
| Creators              | list/includes/subscriptions                                          | chain-scoped relationship, array index, verification and provenance          | timestamp filters plus `creatorName` and `digitalAssetName` sorts         |
| Issued assets         | list/includes/subscriptions                                          | chain-scoped relationship, array index and provenance                        | timestamp filters plus `issuerName` and `digitalAssetName` sorts          |
| Collection attributes | distinct traits and collection count                                 | latest revision per token, required network, deterministic ordering          | none                                                                      |
| Data changed events   | history/latest filters/includes/subscriptions                        | deterministic event ID and full chain/block/transaction provenance           | `universalProfileName` and `digitalAssetName` sorts                       |
| Token data changed    | history/latest filters/includes/subscriptions                        | deterministic event ID and full chain/block/transaction provenance           | `nftName` filter plus `digitalAssetName` and `nftName` sorts              |
| Universal receiver    | history filters/includes/subscriptions                               | decoded type ID and full chain/block/transaction provenance                  | sender profile/asset name filters and all profile/asset name sorts        |
| Encrypted assets      | list/batch content, encryption and file includes/subscriptions       | metadata-revision identity, fetch status and canonical provenance            | nested `fileSize` filter plus `contentId`, `revision`, `arrayIndex` sorts |

An unavailable filter or sort is not ignored. The service throws `IndexerError` with code
`VALIDATION_FAILED` and a field-level path so applications cannot accidentally broaden a query.
Null relationships remain `null`; the client never invents a related entity.

Familiar v3 text filters are exact and case-sensitive. V2's substring `_ilike` behavior is not
available for metadata stored in v3 JSON revisions. Address and canonical-hash inputs are still
case-insensitive at the boundary because the client validates and normalizes hexadecimal values
before querying. Metadata-backed familiar filters consider only revisions whose `isCurrent` marker
is true; superseded immutable names and categories remain available through the uniform metadata
revision domain but cannot match current-state profile, asset, NFT, holder, issuer, creator, or event
queries.

Uniform `V3MetadataRevision` records add `isCurrent`. Uniform `V3Controller.arrayIndex` is nullable:
an address removed from the LSP6 controller array remains a controller while any independent
permission, allowed-call, or allowed-data-key mapping still exists.

### Familiar fields without a v3 source

The familiar shapes keep these nullable fields so migration does not require a second model, but
the v3.0 read models cannot populate them. They are `null` when included and omitted when their
include flag is absent:

| Domain                    | Fields that are always `null` in v3.0            |
| ------------------------- | ------------------------------------------------ |
| Profiles                  | `timestamp`                                      |
| Digital assets            | `owner`, `timestamp`                             |
| NFTs                      | `timestamp`, `holder.timestamp`, `score`, `rank` |
| Owned assets / tokens     | `timestamp`                                      |
| Followers                 | legacy event `address`                           |
| Creators / issued assets  | `timestamp`                                      |
| Token ID data changed     | `nft`                                            |
| Universal receiver events | `fromProfile`, `fromAsset`                       |
| Encrypted assets          | `arrayIndex`                                     |

Use `lastBlockNumber`, `lastBlockHash`, `lastTransactionHash`, `lastTransactionIndex`, and
`lastLogIndex` for projection provenance. Historical event domains continue to expose their actual
block timestamp and transaction position. Future v3 schema additions may make an always-null field
available in a later minor release, but applications must not infer a value in v3.0.

## Include behavior

Omitting `include` returns the full familiar result. Passing `include: {}` returns only mandatory
identity and provenance fields. Passing selected fields keeps the existing conditional result-type
inference. This distinction is intentional and is covered by runtime fixtures.

## Removed Node exports

Generated v2 operation documents were public by accident. The following exports are removed:

```text
CreatorSubscriptionDocument
DataChangedEventSubscriptionDocument
DigitalAssetSubscriptionDocument
EncryptedAssetSubscriptionDocument
FollowerSubscriptionDocument
GetCollectionAttributesDocument
GetCreatorsDocument
GetDataChangedEventsDocument
GetDigitalAssetDocument
GetDigitalAssetsDocument
GetEncryptedAssetsDocument
GetFollowCountDocument
GetFollowersDocument
GetIssuedAssetsDocument
GetNftDocument
GetNftsDocument
GetOwnedAssetDocument
GetOwnedAssetsDocument
GetOwnedTokenDocument
GetOwnedTokensDocument
GetProfileDocument
GetProfilesDocument
GetTokenIdDataChangedEventsDocument
GetUniversalReceiverEventsDocument
IssuedAssetSubscriptionDocument
NftSubscriptionDocument
OwnedAssetSubscriptionDocument
OwnedTokenSubscriptionDocument
ProfileSubscriptionDocument
TokenIdDataChangedEventSubscriptionDocument
UniversalReceiverEventSubscriptionDocument
```

Use the familiar `fetch*` services/subscription builders or the uniform `createIndexerClient`
methods instead. V3 deliberately does not expose generated GraphQL documents; this prevents the
package API from becoming coupled to Hasura-generated type names again.

The following v2 query-construction helpers are also removed:

```text
buildCreatorIncludeVars
buildCreatorWhere
buildDataChangedEventIncludeVars
buildDataChangedEventOrderBy
buildDataChangedEventWhere
buildDigitalAssetIncludeVars
buildDigitalAssetOrderBy
buildDigitalAssetWhere
buildEncryptedAssetIncludeVars
buildEncryptedAssetWhere
buildFollowerIncludeVars
buildFollowerWhere
buildIssuedAssetIncludeVars
buildIssuedAssetWhere
buildNftIncludeVars
buildNftOrderBy
buildNftWhere
buildOwnedAssetIncludeVars
buildOwnedAssetWhere
buildOwnedTokenWhere
buildProfileIncludeDirectives
buildProfileIncludeVars
buildProfileOrderBy
buildProfileWhere
buildTokenIdDataChangedEventIncludeVars
buildTokenIdDataChangedEventOrderBy
buildTokenIdDataChangedEventWhere
buildUniversalReceiverEventIncludeVars
buildUniversalReceiverEventWhere
```

Use `buildV3DomainVariables(domain, params)` for the uniform API. Prefer a high-level service when
one exists because it maps familiar filters and includes to the v3 schema and rejects unsupported
behavior. The internal `stripExcluded` export is removed; public parser/service include parameters
provide its replacement.

## New public entry points

- `createIndexerClient`, `IndexerClient`, and `IndexerClientConfig`
- `fetchV3*` query functions and uniform `fetchBlocks`, `fetchEvents`,
  `fetchUniversalProfiles`, `fetchControllers`, `fetchChillwhalesNfts`, `fetchDataValues`,
  `fetchMetadataRevisions`, and `fetchIndexedHead(s)` aliases
- `buildV3DomainVariables`, `buildV3SubscriptionConfig`, `v3Api`, `v3Keys`, and `v3Parsers`
- Runtime `parseV3*` parsers and strict raw scalar helpers
- `getClientNetwork` and `getServerNetwork`
- Zod schemas and inferred TypeScript types for all 15 domains plus `NetworkRef`, `BlockRef`,
  `EventRef`, `ProjectionRef`, `VerificationStatus`, and generic v3 filters/sorts/results

The generated GraphQL schema is now sourced from
`packages/indexer-v3/hasura/schema.graphql`. Consumers should not import or copy generated types;
the stable package types and Zod schemas are the public boundary.

## Rollback

Rollback means pinning all four packages to their last compatible v2 versions and using the v2
endpoint. Do not mix v2 and v3 package majors. The final integration PR retains the legacy runtime
until the owner approves the production cutover and rollback window; published v2 npm artifacts
are never deleted.
