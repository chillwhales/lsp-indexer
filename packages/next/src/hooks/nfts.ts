import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { nftKeys } from '@lsp-indexer/node';
import type { UseInfiniteNftsParams, UseNftParams, UseNftsParams } from '@lsp-indexer/types';

import { getNft, getNfts } from '../actions/nfts';

/** Default number of NFTs per page for infinite scroll queries */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch a single NFT by collection address and token ID via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNft`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 * This keeps the GraphQL endpoint hidden from the client.
 *
 * @param params - Collection address and token ID
 * @returns `{ nft, isLoading, error, ...rest }` — full TanStack Query result
 *   with `data` renamed to `nft`
 */
export function useNft(params: UseNftParams) {
  const { address, tokenId } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.detail(address, tokenId),
    queryFn: () => getNft(address, tokenId),
    enabled: Boolean(address && tokenId),
  });

  return { nft: data ?? null, ...rest };
}

/**
 * Fetch a paginated list of NFTs via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useNfts`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pagination config
 * @returns `{ nfts, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `nfts` and `totalCount`
 */
export function useNfts(params: UseNftsParams = {}) {
  const { filter, sort, limit, offset } = params;

  const { data, ...rest } = useQuery({
    queryKey: nftKeys.list(filter, sort, limit, offset),
    queryFn: () => getNfts({ filter, sort, limit, offset }),
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
 * Identical API to `@lsp-indexer/react`'s `useNftsByCollection`, but routes the
 * request through a server action.
 *
 * @param collectionAddress - The collection contract address to filter by
 * @param params - Optional additional filter, sort, and pagination config
 * @returns Same shape as `useNfts`
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
 * Fetch NFTs with infinite scroll pagination via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useInfiniteNfts`, but routes the
 * request through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Optional filter, sort, and pageSize config
 * @returns `{ nfts, hasNextPage, fetchNextPage, isFetchingNextPage, ...rest }` —
 *   flattened NFTs array with infinite scroll controls
 */
export function useInfiniteNfts(params: UseInfiniteNftsParams = {}) {
  const { filter, sort, pageSize = DEFAULT_PAGE_SIZE } = params;

  const result = useInfiniteQuery({
    queryKey: nftKeys.infinite(filter, sort),
    queryFn: ({ pageParam }) =>
      getNfts({
        filter,
        sort,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.nfts.length < pageSize) {
        return undefined;
      }
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
