import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchNft, fetchNfts, getClientUrl, nftKeys } from '@lsp-indexer/node';
import type { UseInfiniteNftsParams, UseNftParams, UseNftsParams } from '@lsp-indexer/types';

/** Default number of NFTs per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single NFT by collection address and token ID.
 *
 * Wraps `fetchNft` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` or `tokenId` is falsy.
 *
 * @param params - Collection address and token ID
 * @returns `{ nft, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `nft`
 *
 * @example
 * ```tsx
 * import { useNft } from '@lsp-indexer/react';
 *
 * function NftCard({ address, tokenId }: { address: string; tokenId: string }) {
 *   const { nft, isLoading, error } = useNft({ address, tokenId });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Alert>{error.message}</Alert>;
 *   if (!nft) return <p>NFT not found</p>;
 *
 *   return (
 *     <div>
 *       <h2>{nft.name ?? 'Unnamed'}</h2>
 *       <p>Token ID: {nft.tokenId}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNft(params: UseNftParams) {
  const url = getClientUrl();
  const { address, tokenId } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.detail(address, tokenId),
    queryFn: () => fetchNft(url, { address, tokenId }),
    enabled: Boolean(address && tokenId),
  });

  return { nft: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of NFTs with filtering and sorting.
 *
 * Wraps `fetchNfts` in a TanStack `useQuery` hook. Supports filtering
 * by collection address, owner address, and token ID. Sorting by
 * tokenId or name.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ nfts, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `nfts` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useNfts } from '@lsp-indexer/react';
 *
 * function NftList() {
 *   const { nfts, totalCount, isLoading } = useNfts({
 *     filter: { collectionAddress: '0x...' },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} NFTs found</p>
 *       {nfts.map((nft) => (
 *         <div key={`${nft.address}-${nft.tokenId}`}>{nft.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNfts(params: UseNftsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.list(filter, sort, limit, offset),
    queryFn: () => fetchNfts(url, { filter, sort, limit, offset }),
  });

  return {
    nfts: data?.nfts ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Convenience wrapper around `useNfts` that pre-fills the collection address filter.
 *
 * Fetches NFTs from a specific collection. Additional filter, sort, and pagination
 * params are merged with the collection address.
 *
 * @param collectionAddress - The collection contract address to filter by
 * @param params - Optional additional filter, sort, and pagination config
 * @returns Same shape as `useNfts`
 *
 * @example
 * ```tsx
 * import { useNftsByCollection } from '@lsp-indexer/react';
 *
 * function CollectionPage({ address }: { address: string }) {
 *   const { nfts, totalCount } = useNftsByCollection(address, {
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     limit: 20,
 *   });
 *
 *   return <div>{totalCount} NFTs in collection</div>;
 * }
 * ```
 */
export function useNftsByCollection(
  collectionAddress: string,
  params: Omit<UseNftsParams, 'filter'> & { filter?: UseNftsParams['filter'] } = {},
) {
  const { filter, ...rest } = params;
  return useNfts({
    ...rest,
    filter: { ...filter, collectionAddress },
  });
}

/**
 * Fetch NFTs with infinite scroll pagination.
 *
 * Wraps `fetchNfts` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `nfts` array.
 * Uses a **separate query key namespace** from `useNfts` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ nfts, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened NFTs array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteNfts } from '@lsp-indexer/react';
 *
 * function InfiniteNftList() {
 *   const {
 *     nfts,
 *     hasNextPage,
 *     fetchNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteNfts({
 *     filter: { collectionAddress: '0x...' },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {nfts.map((nft) => (
 *         <div key={`${nft.address}-${nft.tokenId}`}>{nft.name}</div>
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load more'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteNfts(params: UseInfiniteNftsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: nftKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      fetchNfts(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If the last page returned fewer results than requested, there are no more pages
      if (lastPage.nfts.length < pageSize) {
        return undefined;
      }
      // Next offset = current offset + page size
      return lastPageParam + pageSize;
    },
  });

  // Destructure infinite query properties before rest spread to avoid TS2783
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const nfts = useMemo(() => data?.pages.flatMap((page) => page.nfts) ?? [], [data?.pages]);

  return {
    nfts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
