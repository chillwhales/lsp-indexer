import { fetchCreators, getClientUrl } from '@lsp-indexer/node';
import { createUseCreators } from '../factories';

/**
 * Fetch a paginated list of LSP4 creator records with filtering and sorting.
 *
 * Wraps `fetchCreators` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by creatorAddress, digitalAssetAddress, interfaceId, creatorName,
 * digitalAssetName, timestampFrom, timestampTo) and sorting (by timestamp,
 * creatorAddress, digitalAssetAddress, arrayIndex, creatorName, digitalAssetName).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ creators, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `creators` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useCreators } from '@lsp-indexer/react';
 *
 * function CreatorList() {
 *   const { creators, totalCount, isLoading } = useCreators({
 *     filter: { creatorAddress: '0x...' },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} creators</p>
 *       {creators.map((c) => (
 *         <div key={`${c.creatorAddress}-${c.digitalAssetAddress}`}>
 *           {c.creatorAddress}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useCreators = createUseCreators((params) => fetchCreators(getClientUrl(), params));
