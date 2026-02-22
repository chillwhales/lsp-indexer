import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { nftKeys } from '@lsp-indexer/node';
import type {
  NftInclude,
  PartialNft,
  UseInfiniteNftsParams,
  UseNftParams,
  UseNftsParams,
} from '@lsp-indexer/types';

import { getNft, getNfts } from '../actions/nfts';

/** Default number of NFTs per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single NFT by collection address and token ID (or formatted token ID)
 * via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNft`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - NFT collection address, tokenId/formattedTokenId, and optional include config
 * @returns `{ nft, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `nft`
 *
 * @example
 * ```tsx
 * import { useNft } from '@lsp-indexer/next';
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
export function useNft(params: UseNftParams & { include?: NftInclude }) {
  const { address, tokenId, formattedTokenId, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.detail(address, tokenId, formattedTokenId, include),
    queryFn: () =>
      include
        ? getNft(address, tokenId, formattedTokenId, include)
        : getNft(address, tokenId, formattedTokenId),
    enabled: Boolean(address && (tokenId || formattedTokenId)),
  });

  const nft: PartialNft | null = data ?? null;
  return { nft, ...rest };
}

/**
 * Fetch a paginated list of NFTs via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNfts`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ nfts, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `nfts` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useNfts } from '@lsp-indexer/next';
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
export function useNfts(params: UseNftsParams & { include?: NftInclude } = {}) {
  const { filter, sort, limit, offset, include } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.list(filter, sort, limit, offset, include),
    queryFn: () =>
      include
        ? getNfts({ filter, sort, limit, offset, include })
        : getNfts({ filter, sort, limit, offset }),
  });

  const nfts: PartialNft[] = data?.nfts ?? [];
  return { nfts, totalCount: data?.totalCount ?? 0, ...rest };
}

/**
 * Fetch NFTs with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteNfts`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, pageSize, and include config
 * @returns `{ nfts, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened NFTs array with infinite scroll controls
 *
 * @example
 * ```tsx
 * import { useInfiniteNfts } from '@lsp-indexer/next';
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
export function useInfiniteNfts(params: UseInfiniteNftsParams & { include?: NftInclude } = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE, include } = params;

  const result = useInfiniteQuery({
    queryKey: nftKeys.infinite(filter, sort, include),
    queryFn: ({ pageParam }) =>
      include
        ? getNfts({ filter, sort, limit: pageSize, offset: pageParam, include })
        : getNfts({ filter, sort, limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.nfts.length < pageSize) {
        return undefined;
      }
      return lastPageParam + pageSize;
    },
  });

  // Flatten all pages into a single nfts array (memoized to avoid re-flattening on every render)
  // Destructure infinite query properties before rest spread to avoid TS2783 duplicate property errors
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest } = result;
  const nfts: PartialNft[] = useMemo(
    () => data?.pages.flatMap((page) => page.nfts) ?? [],
    [data?.pages],
  );

  return {
    nfts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    ...rest,
  };
}
