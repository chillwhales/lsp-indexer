import { fetchOwnedTokens, getClientUrl } from '@lsp-indexer/node';
import { createUseOwnedTokens } from '../factories';

/**
 * Fetch a paginated list of owned tokens with filtering and sorting.
 *
 * Wraps `fetchOwnedTokens` in a TanStack `useQuery` hook. Supports filtering
 * (by holderAddress, digitalAssetAddress, tokenId, holderName, assetName, tokenName)
 * and sorting (by digitalAssetAddress, block, holderAddress, timestamp, tokenId).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ ownedTokens, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `ownedTokens` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useOwnedTokens } from '@lsp-indexer/react';
 *
 * function OwnedTokenList({ holderAddress }: { holderAddress: string }) {
 *   const { ownedTokens, totalCount, isLoading } = useOwnedTokens({
 *     filter: { holderAddress },
 *     sort: { field: 'tokenId', direction: 'asc' },
 *     limit: 20,
 *     offset: 0,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} owned tokens found</p>
 *       {ownedTokens.map((t) => (
 *         <div key={t.id}>{t.digitalAssetAddress} — {t.tokenId}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useOwnedTokens = createUseOwnedTokens((params) =>
  fetchOwnedTokens(getClientUrl(), params),
);
