<!-- This file is auto-generated from src/app/docs/react/page.mdx.
     Do not edit directly — run `pnpm --filter docs generate` to regenerate. -->

# @lsp-indexer/react

Client-side React hooks for querying LUKSO blockchain data. The browser connects to Hasura
directly — no server needed. Built on top of `@tanstack/react-query`.

```bash
npm install @lsp-indexer/react @tanstack/react-query
```

---

## Environment Setup

Set the client-side env var (browser-accessible):

```env
NEXT_PUBLIC_INDEXER_URL=http://localhost:8080/v1/graphql
# Optional — for subscriptions
NEXT_PUBLIC_INDEXER_WS_URL=ws://localhost:8080/v1/graphql
```

The `NEXT_PUBLIC_` prefix exposes the URL to the browser. This is intentional — the browser
needs to reach Hasura directly. Do **not** put secrets in these variables.

---

## Provider Setup

Wrap your app with `QueryClientProvider` and (optionally) `IndexerSubscriptionProvider`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndexerSubscriptionProvider } from '@lsp-indexer/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <IndexerSubscriptionProvider>{children}</IndexerSubscriptionProvider>
    </QueryClientProvider>
  );
}
```

The subscription provider is optional — only needed if you use `use*Subscription` hooks.
It creates a single shared WebSocket connection to Hasura.

---

## Hook Patterns

Every domain follows the same 4-hook pattern:

### Single entity — `useProfile`

```tsx
import { useProfile } from '@lsp-indexer/react';

function ProfileCard({ address }: { address: string }) {
  const { profile, isLoading, error, isFetching } = useProfile({ address });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorAlert error={error} />;

  return <div>{profile?.name}</div>;
}
```

### Paginated list — `useProfiles`

```tsx
import { useProfiles } from '@lsp-indexer/react';

function ProfileList() {
  const { profiles, totalCount, isLoading, error } = useProfiles({
    filter: { name: 'whale' },
    sort: { field: 'name', direction: 'asc' },
    limit: 10,
  });

  return (
    <div>
      <p>{totalCount} results</p>
      {profiles?.map((p) => <div key={p.address}>{p.name}</div>)}
    </div>
  );
}
```

### Infinite scroll — `useInfiniteProfiles`

```tsx
import { useInfiniteProfiles } from '@lsp-indexer/react';

function InfiniteProfileList() {
  const { profiles, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteProfiles({
    filter: { name: 'whale' },
    pageSize: 20,
  });

  return (
    <div>
      {profiles?.map((p) => <div key={p.address}>{p.name}</div>)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          Load more
        </button>
      )}
    </div>
  );
}
```

### Real-time subscription — `useProfileSubscription`

```tsx
import { useProfileSubscription } from '@lsp-indexer/react';

function LiveProfiles() {
  const { data, isConnected, isSubscribed, error } = useProfileSubscription({
    filter: { name: 'whale' },
    limit: 10,
  });

  return (
    <div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {data?.map((p) => <div key={p.address}>{p.name}</div>)}
    </div>
  );
}
```

---

## Available Domains

All 12 domains follow the same pattern. Replace `Profile` with any domain name:

| Domain                | Hooks                                                                                                                                                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profiles              | `useProfile`, `useProfiles`, `useInfiniteProfiles`, `useProfileSubscription`                                                                                                                                                                                                             |
| Digital Assets        | `useDigitalAsset`, `useDigitalAssets`, `useInfiniteDigitalAssets`, `useDigitalAssetSubscription`                                                                                                                                                                                         |
| NFTs                  | `useNft`, `useNfts`, `useInfiniteNfts`, `useNftSubscription`                                                                                                                                                                                                                             |
| Owned Assets          | `useOwnedAsset`, `useOwnedAssets`, `useInfiniteOwnedAssets`, `useOwnedAssetSubscription`                                                                                                                                                                                                 |
| Owned Tokens          | `useOwnedToken`, `useOwnedTokens`, `useInfiniteOwnedTokens`, `useOwnedTokenSubscription`                                                                                                                                                                                                 |
| Creators              | `useCreators`, `useInfiniteCreators`, `useCreatorSubscription`                                                                                                                                                                                                                           |
| Issued Assets         | `useIssuedAssets`, `useInfiniteIssuedAssets`, `useIssuedAssetSubscription`                                                                                                                                                                                                               |
| Follows               | `useFollows`, `useInfiniteFollows`, `useFollowCount`, `useIsFollowing`, `useIsFollowingBatch`, `useFollowerSubscription`, `useMutualFollows`, `useInfiniteMutualFollows`, `useMutualFollowers`, `useInfiniteMutualFollowers`, `useFollowedByMyFollows`, `useInfiniteFollowedByMyFollows` |
| Encrypted Assets      | `useEncryptedAssets`, `useInfiniteEncryptedAssets`, `useEncryptedAssetsBatch`, `useEncryptedAssetSubscription`                                                                                                                                                                           |
| Data Changed          | `useDataChangedEvents`, `useInfiniteDataChangedEvents`, `useLatestDataChangedEvent`, `useDataChangedEventSubscription`                                                                                                                                                                   |
| Token ID Data Changed | `useTokenIdDataChangedEvents`, `useInfiniteTokenIdDataChangedEvents`, `useLatestTokenIdDataChangedEvent`, `useTokenIdDataChangedEventSubscription`                                                                                                                                       |
| Universal Receiver    | `useUniversalReceiverEvents`, `useInfiniteUniversalReceiverEvents`, `useUniversalReceiverEventSubscription`                                                                                                                                                                              |
| Collection Attributes | `useCollectionAttributes`                                                                                                                                                                                                                                                                |

---

## Batch Follow Checking

`useIsFollowingBatch` checks multiple follower→followed address pairs in a single Hasura query. Returns a `Map<string, boolean>` keyed by `"followerAddress:followedAddress"`.

### Parameters

| Parameter | Type                                                          | Required | Description                              |
| --------- | ------------------------------------------------------------- | -------- | ---------------------------------------- |
| `pairs`   | `Array<{ followerAddress: string; followedAddress: string }>` | Yes      | Address pairs to check follow status for |

### Usage

```tsx
import { useIsFollowingBatch } from '@lsp-indexer/react';

const pairs = [
  { followerAddress: '0xFollower1', followedAddress: '0xFollowed1' },
  { followerAddress: '0xFollower2', followedAddress: '0xFollowed2' },
];

const { results, isLoading, error } = useIsFollowingBatch({ pairs });
// Keys are lowercased — any address casing is accepted as input:
// results.get('0xfollower1:0xfollowed1') → true | false
// results.get('0xfollower2:0xfollowed2') → true | false
```

The hook is disabled when `pairs` is empty — no query is fired and `results` defaults to an empty `Map`. All pairs default to `false`; a missing row means "not following", not an error.

---

## Batch Encrypted Asset Fetch

`useEncryptedAssetsBatch` fetches multiple encrypted assets by `(address, contentId, revision)` tuples in a single Hasura query.

### Parameters

| Parameter | Type                         | Required | Description                                                                  |
| --------- | ---------------------------- | -------- | ---------------------------------------------------------------------------- |
| `tuples`  | `EncryptedAssetBatchTuple[]` | Yes      | Array of `{ address: string, contentId: string, revision: number }` to fetch |
| `include` | `EncryptedAssetInclude`      | No       | Narrow which related fields are returned — full TypeScript inference         |

### Usage

```tsx
import { useEncryptedAssetsBatch } from '@lsp-indexer/react';

const tuples = [
  { address: '0xAssetAddress1', contentId: 'content-1', revision: 1 },
  { address: '0xAssetAddress2', contentId: 'content-2', revision: 0 },
];

const { encryptedAssets, isLoading, error } = useEncryptedAssetsBatch({
  tuples,
  include: { encryption: true },
});
// encryptedAssets → EncryptedAsset[] (one per matched tuple)
```

The hook is disabled when `tuples` is empty — no query is fired and `encryptedAssets` defaults to `[]`.
If no tuples match, `encryptedAssets` returns `[]` — no error is thrown.
Address matching is case-insensitive. Duplicate tuples are not deduplicated — pass unique tuples.
`EncryptedAssetInclude` narrows the return type. The return shape has no `totalCount`.

---

## Mutual Follow Queries

Three hook families query intersection relationships across the follow graph. Each comes in a
standard paginated version and an infinite-scroll version. All hooks accept a single params object
and return `{ profiles, totalCount, isLoading, error, isFetching }`. Queries stay idle until both
addresses are provided.

| Hook                             | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `useMutualFollows`               | Profiles that both `addressA` and `addressB` follow                    |
| `useInfiniteMutualFollows`       | Infinite-scroll variant of `useMutualFollows`                          |
| `useMutualFollowers`             | Profiles that follow both `addressA` and `addressB`                    |
| `useInfiniteMutualFollowers`     | Infinite-scroll variant of `useMutualFollowers`                        |
| `useFollowedByMyFollows`         | Profiles that `myAddress` follows and that also follow `targetAddress` |
| `useInfiniteFollowedByMyFollows` | Infinite-scroll variant of `useFollowedByMyFollows`                    |

### Parameters

**`useMutualFollows` / `useMutualFollowers`:**

| Param      | Type             | Required | Description                    |
| ---------- | ---------------- | -------- | ------------------------------ |
| `addressA` | `string`         | Yes      | First address                  |
| `addressB` | `string`         | Yes      | Second address                 |
| `sort`     | `ProfileSort`    | No       | Sort field, direction, nulls   |
| `limit`    | `number`         | No       | Max results (default: server)  |
| `offset`   | `number`         | No       | Pagination offset              |
| `include`  | `ProfileInclude` | No       | Include narrowing for profiles |

**`useFollowedByMyFollows`:**

| Param           | Type             | Required | Description                    |
| --------------- | ---------------- | -------- | ------------------------------ |
| `myAddress`     | `string`         | Yes      | Your address                   |
| `targetAddress` | `string`         | Yes      | Target profile address         |
| `sort`          | `ProfileSort`    | No       | Sort field, direction, nulls   |
| `limit`         | `number`         | No       | Max results (default: server)  |
| `offset`        | `number`         | No       | Pagination offset              |
| `include`       | `ProfileInclude` | No       | Include narrowing for profiles |

Infinite variants (`useInfiniteMutualFollows`, etc.) replace `limit`/`offset` with `pageSize?: number`.

### Usage

```tsx
import { useMutualFollows } from '@lsp-indexer/react';
import type { ProfileInclude } from '@lsp-indexer/types';

const include: ProfileInclude = { ownedAssets: true, tags: true };

function MutualFollows({ addressA, addressB }: { addressA: string; addressB: string }) {
  const { profiles, totalCount, isLoading, error } = useMutualFollows({
    addressA,
    addressB,
    sort: { field: 'name', direction: 'asc' },
    limit: 10,
    include,
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>{totalCount} mutual follows</p>
      {profiles?.map((p) => (
        <div key={p.address}>
          {p.name}
          {/* p.ownedAssets is typed — include narrowing works */}
        </div>
      ))}
    </div>
  );
}
```

`useFollowedByMyFollows` uses `myAddress` and `targetAddress` instead of `addressA`/`addressB`:

```tsx
import { useFollowedByMyFollows } from '@lsp-indexer/react';

const { profiles } = useFollowedByMyFollows({ myAddress, targetAddress, limit: 20 });
```

---

## Collection Attributes

`useCollectionAttributes` fetches the distinct `{key, value}` attribute pairs across all NFTs in a collection, along with the total NFT count. Useful for building trait filters, rarity explorers, and collection overviews.

### Parameters

| Parameter           | Type     | Required | Description                            |
| ------------------- | -------- | -------- | -------------------------------------- |
| `collectionAddress` | `string` | Yes      | Contract address of the NFT collection |

### Return Shape

| Field        | Type                    | Description                                       |
| ------------ | ----------------------- | ------------------------------------------------- |
| `attributes` | `CollectionAttribute[]` | Distinct `{ key, value, type }` attribute entries |
| `totalCount` | `number`                | Total number of NFTs in the collection            |
| `isLoading`  | `boolean`               | `true` while the initial fetch is in progress     |
| `error`      | `Error \| null`         | Error object if the query failed                  |

### Usage

```tsx
import { useCollectionAttributes } from '@lsp-indexer/react';

function TraitFilter({ collectionAddress }: { collectionAddress: string }) {
  const { attributes, totalCount, isLoading, error } = useCollectionAttributes({
    collectionAddress,
  });

  if (isLoading) return <p>Loading traits…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <p>{totalCount} NFTs in collection</p>
      <ul>
        {attributes?.map((attr) => (
          <li key={`${attr.key}:${attr.value}`}>
            {attr.key}: {attr.value} {attr.type && <span>({attr.type})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Include Fields

Control which related data is fetched to reduce payload size:

```tsx
import { useProfile } from '@lsp-indexer/react';
import type { ProfileInclude } from '@lsp-indexer/types';

const include: ProfileInclude = {
  ownedAssets: true,
  tags: true,
  links: true,
  images: true,
};

const { profile } = useProfile({ address: '0x...', include });
// profile.ownedAssets → OwnedAsset[] (included)
// profile.issuedAssets → undefined (not included)
```

The TypeScript return type narrows automatically based on your include selection.

### NFT Include Fields

NFTs support granular include control for chillwhales-specific fields. These are excluded by
default to reduce payload size — opt in only when needed:

```tsx
import { useNfts } from '@lsp-indexer/react';
import type { NftInclude } from '@lsp-indexer/types';

const include: NftInclude = {
  score: true,
  rank: true,
  chillClaimed: true,
  orbsClaimed: true,
  level: true,
  cooldownExpiry: true,
  faction: true,
  collection: { name: true },
  holder: { name: true },
};

const { nfts } = useNfts({
  filter: { collectionAddress: '0x...' },
  include,
});
// nfts[0].score → number | null (included)
// nfts[0].description → undefined (not included)
```

All NFT include fields: `formattedTokenId`, `name`, `description`, `category`, `icons`, `images`,
`links`, `attributes`, `timestamp`, `blockNumber`, `transactionIndex`, `logIndex`, `score`, `rank`,
`chillClaimed`, `orbsClaimed`, `level`, `cooldownExpiry`, `faction`. Relations: `collection`
(accepts `boolean | DigitalAssetInclude`), `holder` (accepts `boolean | ProfileInclude`).

---

## Filters and Sorting

All list hooks accept `filter` and `sort` parameters:

```tsx
import type { DigitalAssetFilter, DigitalAssetSort } from '@lsp-indexer/types';

const filter: DigitalAssetFilter = {
  name: 'CHILL',
  tokenType: 'TOKEN',
};

const sort: DigitalAssetSort = {
  field: 'holderCount',
  direction: 'desc',
  nulls: 'last',
};

const { digitalAssets } = useDigitalAssets({ filter, sort, limit: 10 });
```

Filters support partial string matching, exact matches, and address lookups depending on the
domain. Sort supports `asc`/`desc` direction and `first`/`last` null positioning.

### NFT Filters and Sorting

NFTs support chillwhales-specific filter fields and score-based sorting:

```tsx
import type { NftFilter, NftSort } from '@lsp-indexer/types';

const filter: NftFilter = {
  collectionAddress: '0x...',
  chillClaimed: false, // Only unclaimed
  orbsClaimed: false,
  maxLevel: 5, // Level 5 or below
  cooldownExpiryBefore: Math.floor(Date.now() / 1000), // Cooldown expired
};

const sort: NftSort = {
  field: 'score', // Sort by chillwhales score
  direction: 'desc',
  nulls: 'last',
};

const { nfts } = useNfts({ filter, sort, limit: 20 });
```

**NFT filter fields:** `collectionAddress`, `tokenId`, `formattedTokenId`, `name`, `holderAddress`,
`isBurned`, `isMinted`, `chillClaimed`, `orbsClaimed`, `maxLevel`, `cooldownExpiryBefore`.

**NFT sort fields:** `newest`, `oldest`, `tokenId`, `formattedTokenId`, `score`.
`newest`/`oldest` use deterministic block-order; `direction`/`nulls` are ignored for those values.

---

## Subscriptions

Subscriptions use a shared WebSocket connection managed by `IndexerSubscriptionProvider`.

Key behaviors:

- **Auto-reconnect** on connection loss
- **Shared connection** — all subscription hooks share one WebSocket
- **Cache invalidation** — set `invalidate: true` to auto-invalidate React Query cache on updates
- **Connection status** — `isConnected` and `isSubscribed` flags for UI indicators

```tsx
const { data, isConnected, isSubscribed, error } = useDigitalAssetSubscription({
  filter: { tokenType: 'NFT' },
  limit: 50,
  invalidate: true, // invalidate useDigitalAssets() cache on updates
});
```

> **Using with `@lsp-indexer/next`?** If you use `@lsp-indexer/next` for server actions but still
> want real-time subscriptions, use `@lsp-indexer/react` subscription hooks and set
> `NEXT_PUBLIC_INDEXER_WS_URL` to your WS proxy URL (from `@lsp-indexer/next/server`).
> This keeps the Hasura URL hidden from the browser while enabling real-time updates.
> See the [@lsp-indexer/next docs](/docs/next#why-subscriptions-use-lsp-indexerreact) for details.

---

## Data Flow

```mermaid
graph TD
  A[Browser] -->|GraphQL| B[Hasura]
  B --> C[React Query Cache]
  C --> D[Your Component]
```

Pros: Simple, no server needed, real-time subscriptions via WebSocket.

Cons: Hasura URL is exposed to the browser, no server-side caching or access control.

For server-side data fetching, see [@lsp-indexer/next](/docs/next).

---

## Next Steps

- [@lsp-indexer/next](/docs/next) — Server actions and hooks for Next.js
- [@lsp-indexer/node](/docs/node) — Low-level fetch functions, parsers, query keys
- [Quickstart](/docs/quickstart) — End-to-end setup guide
- [Domain Playgrounds](/profiles) — Try every hook live
