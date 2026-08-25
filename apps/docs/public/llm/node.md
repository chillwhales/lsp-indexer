<!-- This file is auto-generated from src/app/docs/node/page.mdx.
     Do not edit directly — run `pnpm --filter docs generate` to regenerate. -->

# @lsp-indexer/node v3

The Node package is the source of query behavior for all `@lsp-indexer` consumer packages. V3 uses
the multi-chain Hasura API, validates every response at runtime, preserves familiar high-level
services, and adds a uniform client for all public v3 domains.

```bash
npm install @lsp-indexer/node@^3 @lsp-indexer/types@^3
```

Every request has an exact network. V3 never silently selects LUKSO and never shares cache identity
between chains.

## Create a scoped client

```ts
import { createIndexerClient } from '@lsp-indexer/node';

const indexer = createIndexerClient({
  url: 'https://indexer.example.com/v1/graphql',
  network: 'lukso-mainnet',
});

const { items: profiles, totalCount } = await indexer.profiles({
  filter: { address: { eq: '0x...' } },
  sort: [{ field: 'lastBlockNumber', direction: 'desc' }],
  limit: 20,
});

const head = await indexer.indexedHead();
indexer.dispose();
```

`url` must be absolute HTTP(S), `wsUrl` must be WS(S), and `network` must be a lowercase network
slug. When `wsUrl` is omitted it is derived from `url`.

## Environment helpers

```env
NEXT_PUBLIC_INDEXER_URL=https://indexer.example.com/v1/graphql
NEXT_PUBLIC_INDEXER_NETWORK=lukso-mainnet

# Optional server-only overrides
INDEXER_URL=https://indexer.example.com/v1/graphql
INDEXER_NETWORK=lukso-mainnet
INDEXER_WS_URL=wss://indexer.example.com/v1/graphql
NEXT_PUBLIC_INDEXER_WS_URL=wss://indexer.example.com/v1/graphql
```

| Helper               | Source                        | Fallback                      |
| -------------------- | ----------------------------- | ----------------------------- |
| `getClientUrl()`     | `NEXT_PUBLIC_INDEXER_URL`     | throws                        |
| `getClientNetwork()` | `NEXT_PUBLIC_INDEXER_NETWORK` | throws                        |
| `getClientWsUrl()`   | `NEXT_PUBLIC_INDEXER_WS_URL`  | derived from client HTTP URL  |
| `getServerUrl()`     | `INDEXER_URL`                 | `NEXT_PUBLIC_INDEXER_URL`     |
| `getServerNetwork()` | `INDEXER_NETWORK`             | `NEXT_PUBLIC_INDEXER_NETWORK` |
| `getServerWsUrl()`   | `INDEXER_WS_URL`              | derived from server HTTP URL  |

HTTP helpers reject non-HTTP protocols; WebSocket helpers reject non-WS protocols. Missing and
invalid values throw `IndexerError` with category `CONFIGURATION`.

## Uniform v3 domains

The scoped client and `fetchV3*` functions cover every public Hasura root:

| Domain             | Client method       | Standalone function        | Runtime result type  |
| ------------------ | ------------------- | -------------------------- | -------------------- |
| Blocks             | `blocks`            | `fetchV3Blocks`            | `V3Block`            |
| Event facts        | `events`            | `fetchV3Events`            | `V3EventFact`        |
| Profiles           | `profiles`          | `fetchV3UniversalProfiles` | `V3UniversalProfile` |
| Digital assets     | `digitalAssets`     | `fetchV3DigitalAssets`     | `V3DigitalAsset`     |
| NFTs               | `nfts`              | `fetchV3Nfts`              | `V3Nft`              |
| Owned assets       | `ownedAssets`       | `fetchV3OwnedAssets`       | `V3OwnedAsset`       |
| Owned tokens       | `ownedTokens`       | `fetchV3OwnedTokens`       | `V3OwnedToken`       |
| Followers          | `followers`         | `fetchV3Followers`         | `V3Follower`         |
| Creators           | `creators`          | `fetchV3Creators`          | `V3Creator`          |
| Issued assets      | `issuedAssets`      | `fetchV3IssuedAssets`      | `V3IssuedAsset`      |
| LSP6 controllers   | `controllers`       | `fetchV3Controllers`       | `V3Controller`       |
| Chillwhales NFTs   | `chillwhalesNfts`   | `fetchV3ChillwhalesNfts`   | `V3ChillwhalesNft`   |
| Data values        | `dataValues`        | `fetchV3DataValues`        | `V3DataValue`        |
| Metadata revisions | `metadataRevisions` | `fetchV3MetadataRevisions` | `V3MetadataRevision` |
| Indexed heads      | `indexedHeads`      | `fetchV3IndexedHeads`      | `V3IndexedHead`      |

Standalone functions receive `(url, { network, ...params })`. Every list returns
`{ items, totalCount }`; `indexedHead()` returns the current scoped head or `null`.

### Filters, sorting, and pagination

V3 uses GraphQL-neutral operators instead of exposing generated Hasura input types:

```ts
import { fetchV3OwnedAssets } from '@lsp-indexer/node';

const result = await fetchV3OwnedAssets('https://indexer.example.com/v1/graphql', {
  network: 'lukso-mainnet',
  filter: {
    and: [{ ownerAddress: { eq: '0x...' } }, { balance: { gte: 1_000_000_000_000_000_000n } }],
    not: { balance: { isNull: true } },
  },
  sort: [{ field: 'balance', direction: 'desc', nulls: 'last' }],
  limit: 50,
  offset: 0,
});
```

Scalar operators are `eq`, `neq`, `in`, `notIn`, `gt`, `gte`, `lt`, `lte`, and `isNull`.
Filters also support `and`, `or`, and `not`. Unknown fields/operators and invalid values fail before
the request. `limit` is 1–100, `offset` is non-negative, addresses are normalized, bigints stay
lossless, and deterministic chain/id suffixes are appended to every sort. Default projection
recency and familiar `newest`/`oldest` sorts compare block number, transaction index, and log index
before those suffixes, so pagination preserves the complete EVM position within a block.

## Familiar high-level services

Existing domain-oriented names remain available, but `network` is now required:

```ts
import { fetchProfile, fetchProfiles } from '@lsp-indexer/node';

const profile = await fetchProfile('https://indexer.example.com/v1/graphql', {
  network: 'lukso-mainnet',
  address: '0x...',
});

const { profiles, totalCount } = await fetchProfiles('https://indexer.example.com/v1/graphql', {
  network: 'lukso-mainnet',
  filter: { name: 'whale' },
  sort: { field: 'newest', direction: 'desc' },
  limit: 20,
});
```

| Domain                | Services                                                                        | List result field          |
| --------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| Profiles              | `fetchProfile`, `fetchProfiles`                                                 | `profiles`                 |
| Digital assets        | `fetchDigitalAsset`, `fetchDigitalAssets`                                       | `digitalAssets`            |
| NFTs                  | `fetchNft`, `fetchNfts`                                                         | `nfts`                     |
| Owned assets          | `fetchOwnedAsset`, `fetchOwnedAssets`                                           | `ownedAssets`              |
| Owned tokens          | `fetchOwnedToken`, `fetchOwnedTokens`                                           | `ownedTokens`              |
| Followers             | `fetchFollows`, `fetchFollowCount`, `fetchIsFollowing`, `fetchIsFollowingBatch` | `follows`                  |
| Follow relationships  | `fetchMutualFollows`, `fetchMutualFollowers`, `fetchFollowedByMyFollows`        | `profiles`                 |
| Creators              | `fetchCreators`                                                                 | `creators`                 |
| Issued assets         | `fetchIssuedAssets`                                                             | `issuedAssets`             |
| Data changed          | `fetchDataChangedEvents`, `fetchLatestDataChangedEvent`                         | `dataChangedEvents`        |
| Token data changed    | `fetchTokenIdDataChangedEvents`, `fetchLatestTokenIdDataChangedEvent`           | `tokenIdDataChangedEvents` |
| Universal receiver    | `fetchUniversalReceiverEvents`                                                  | `universalReceiverEvents`  |
| Encrypted assets      | `fetchEncryptedAssets`, `fetchEncryptedAssetsBatch`                             | `encryptedAssets`          |
| Collection attributes | `fetchCollectionAttributes`                                                     | `attributes`               |

Omitting `include` returns the full familiar record. Passing `include: {}` returns only mandatory
identity/provenance fields; selected fields and nested includes are retained with inferred result
types. A requested relationship that does not exist is `null` rather than an invented object.

Features that the v3 views cannot implement—such as score sorting or nested encrypted-file size
ranges—throw a field-level `VALIDATION_FAILED` error. They are never silently ignored. See the
[v3 package migration guide](https://github.com/chillwhales/lsp-indexer/blob/lsp-indexer-v3/.github/V3_PACKAGE_MIGRATION.md)
for the exact disposition.

Familiar text filters use exact, case-sensitive matching in v3. Address, token ID, data-key, and
type-ID inputs are validated and normalized before querying. This replaces v2's substring `_ilike`
behavior and prevents malformed or empty hexadecimal input from silently broadening a request.
Digital-asset name and symbol filters match the projection value first, then current LSP4 metadata
only when the projection field is null—the same precedence used in returned records. Familiar name
and symbol sorts use that same displayed value. The unified API view supplies the current-metadata
fallback before Hasura filters, sorts, or paginates the rows. Familiar name and category filters also
require the related metadata revision's `isCurrent` marker, so an immutable superseded revision
cannot match current profile, asset, NFT, holder, issuer, creator, or event results.

`fetchEncryptedAssetsBatch` returns at most one newest canonical revision for each unique
`(address, contentId, revision)` tuple, in input order. It transparently pages matching immutable
history when duplicate revisions would otherwise consume a query limit, and duplicate input tuples
are coalesced.

NFT results, name filters, and collection attribute facets use only current token metadata. When
both direct LSP4 metadata and base-URI-derived metadata are available, direct metadata takes
precedence and the base URI remains a fallback regardless of which source changed most recently.

Some nullable compatibility fields have no v3.0 read-model source and therefore remain `null`,
including projection `timestamp` values, digital-asset `owner`, NFT `score`/`rank`, token-event
`nft`, universal-receiver sender relations, and encrypted-asset `arrayIndex`. The migration guide
contains the complete field disposition; use canonical `lastBlock*`/`lastTransaction*` provenance
instead of inferring missing values. A nested NFT holder include preserves `timestamp: string | null`
and currently returns `null` rather than claiming a non-null acquisition timestamp.

## Subscriptions

All 15 uniform domains support live-query subscriptions:

```ts
const subscription = indexer.subscribe(
  'profiles',
  { filter: { address: { eq: '0x...' } }, limit: 10 },
  {
    onData(profiles) {
      console.log(profiles);
    },
    onReconnect() {
      console.log('reconnected');
    },
  },
);

subscription.subscribe(() => {
  if (subscription.error) console.error(subscription.error);
});

subscription.dispose();
```

Familiar builders such as `buildProfileSubscriptionConfig` and
`buildUniversalReceiverEventSubscriptionConfig` are also exported. They require `network` and are
used by the React package. Empty live-query snapshots are delivered as `[]`, parse failures become
`IndexerError`, reconnect callbacks run after an interrupted connection, and `dispose()` releases
subscriptions plus the shared socket.

## Runtime types and errors

`@lsp-indexer/types` exports Zod schemas and inferred types for all 15 domains plus `NetworkRef`,
`BlockRef`, `EventRef`, and `ProjectionRef`. Transport decimal strings become `bigint` for balances,
supplies, values, and array indexes. Safe-integer fields reject lossy numbers. Every top-level
record contains `network` and `chainId`; projections/events also contain their canonical block and
transaction provenance. Metadata source revisions are canonical 32-byte hashes, and
`V3MetadataRevision.isCurrent` distinguishes the canonical source from preserved history. A
controller's `arrayIndex` is nullable because a controller removed from the LSP6 address array can
remain current through independent permission, allowed-call, or allowed-data-key mappings.

All public failures use `IndexerError` categories: `CONFIGURATION`, `VALIDATION`, `NETWORK`, `HTTP`,
`GRAPHQL`, and `PARSE`. Inspect `category`, `code`, `validationErrors`, and `statusCode` rather than
matching message text.

## Cache keys and low-level exports

`v3Keys` and every familiar key factory include `v3` plus the exact network. The same address on two
chains therefore produces different keys. Generated GraphQL documents and the old public
`build*Where`, `build*IncludeVars`, `build*OrderBy`, and `stripExcluded` helpers were removed. They
coupled callers to the deleted v2 schema; use the typed services, `buildV3DomainVariables`, or the
network-scoped key factories instead.
