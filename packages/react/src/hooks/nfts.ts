import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchNft, fetchNfts, getClientUrl, nftKeys } from '@lsp-indexer/node';
import type { UseInfiniteNftsParams, UseNftParams, UseNftsParams } from '@lsp-indexer/types';

/** Default number of NFTs per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single NFT by collection address and token ID (or formatted token ID).
 *
 * Wraps `fetchNft` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy or neither `tokenId` nor `formattedTokenId` is provided —
 * at least one identifier is required alongside the address.
 *
 * @param params - NFT collection address, tokenId/formattedTokenId, and optional include config
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
 *       <h2>{nft.name ?? nft.tokenId}</h2>
 *       <p>{nft.collection?.name}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNft(params: UseNftParams) {
  const url = getClientUrl();
  const { address, tokenId, formattedTokenId, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.detail(address, tokenId, formattedTokenId, include),
    queryFn: () => fetchNft(url, { address, tokenId, formattedTokenId, include }),
    enabled: Boolean(address && (tokenId || formattedTokenId)),
  });

  return { nft: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of NFTs with filtering and sorting.
 *
 * Wraps `fetchNfts` in a TanStack `useQuery` hook. Supports filtering
 * (by collectionAddress, tokenId, formattedTokenId, name, holderAddress,
 * isBurned, isMinted) and sorting (by tokenId, formattedTokenId).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ nfts, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `nfts` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useNfts } from '@lsp-indexer/react';
 *
 * function NftList() {
 *   const { nfts, totalCount, isLoading } = useNfts({
 *     filter: { collectionAddress: '0x86E8...' },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} NFTs found</p>
 *       {nfts.map((n) => (
 *         <div key={`${n.address}-${n.tokenId}`}>{n.name ?? n.tokenId}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example By collection (QUERY-03 useNftsByCollection pattern):
 * ```tsx
 * const { nfts } = useNfts({
 *   filter: { collectionAddress: '0x86E8...' },
 *   sort: { field: 'tokenId', direction: 'asc' },
 * });
 * ```
 */
export function useNfts(params: UseNftsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.list(filter, sort, limit, offset, include),
    queryFn: () => fetchNfts(url, { filter, sort, limit, offset, include }),
  });

  return {
    nfts: data?.nfts ?? [],
    totalCount: data?.totalCount ?? 0,
    ...rest,
  };
}

/**
 * Fetch NFTs with infinite scroll pagination.
 *
 * Wraps `fetchNfts` in a TanStack `useInfiniteQuery` hook with offset-based
 * pagination. Pages are automatically flattened into a single `nfts` array.
 * Uses a **separate query key namespace** from `useNfts` to prevent cache
 * corruption between standard and infinite query data structures.
 *
 * @param params - Optional filter, sort, pageSize, and include config
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
 *     isLoading,
 *   } = useInfiniteNfts({
 *     filter: { collectionAddress: '0x86E8...' },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     pageSize: 20,
 *   });
 *
 *   return (
 *     <div>
 *       {nfts.map((n) => (
 *         <div key={`${n.address}-${n.tokenId}`}>{n.name ?? n.tokenId}</div>
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
 *
 * @example By collection (QUERY-03 useNftsByCollection pattern):
 * ```tsx
 * const { nfts, hasNextPage, fetchNextPage } = useInfiniteNfts({
 *   filter: { collectionAddress: '0x86E8...' },
 *   sort: { field: 'tokenId', direction: 'asc' },
 * });
 * ```
 */
export function useInfiniteNfts(params: UseInfiniteNftsParams = {}) {
  const url = getClientUrl();
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: nftKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      fetchNfts(url, {
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
        include,
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

  // Flatten all pages into a single nfts array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
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
