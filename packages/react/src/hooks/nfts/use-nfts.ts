import { fetchNfts, getClientUrl } from '@lsp-indexer/node';
import { createUseNfts } from '../factories';

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
 */
export const useNfts = createUseNfts((params) =>
  params.include ? fetchNfts(getClientUrl(), params) : fetchNfts(getClientUrl(), params),
);
