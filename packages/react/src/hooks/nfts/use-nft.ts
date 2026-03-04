import { fetchNft, getClientUrl } from '@lsp-indexer/node';
import { createUseNft } from '../factories';

/**
 * Fetch a single NFT by collection address and token ID (or formatted token ID).
 *
 * Wraps `fetchNft` in a TanStack `useQuery` hook with automatic caching,
 * deduplication, and stale-while-revalidate. The query is disabled when
 * `address` is falsy or neither `tokenId` nor `formattedTokenId` is provided.
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
export const useNft = createUseNft((params) =>
  params.include ? fetchNft(getClientUrl(), params) : fetchNft(getClientUrl(), params),
);
