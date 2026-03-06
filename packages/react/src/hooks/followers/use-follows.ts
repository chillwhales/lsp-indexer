import { fetchFollows, getClientUrl } from '@lsp-indexer/node';
import { createUseFollows } from '../factories';

/**
 * Fetch a paginated list of follow relationships.
 *
 * Wraps `fetchFollows` in a TanStack `useQuery` hook. Consumers scope results
 * via filter fields:
 * - "who follows X?" → `filter: { followedAddress: X }`
 * - "who does X follow?" → `filter: { followerAddress: X }`
 *
 * Supports filtering, sorting, pagination, and optional include for field
 * narrowing.
 *
 * @param params - Optional filter/sort/pagination/include
 * @returns `{ follows, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `follows` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useFollows } from '@lsp-indexer/react';
 *
 * function FollowerList({ address }: { address: string }) {
 *   const { follows, totalCount, isLoading } = useFollows({
 *     filter: { followedAddress: address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} followers</p>
 *       {follows.map((f) => (
 *         <div key={f.followerAddress}>{f.followerAddress}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useFollows = createUseFollows((params) => fetchFollows(getClientUrl(), params));
