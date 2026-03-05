import { fetchEncryptedAssets, getClientUrl } from '@lsp-indexer/node';
import { createUseEncryptedAssets } from '../factories';

/**
 * Fetch a paginated list of LSP29 encrypted asset records with filtering and sorting.
 *
 * Wraps `fetchEncryptedAssets` in a TanStack `useQuery` hook. Supports comprehensive
 * filtering (by address, universalProfileName, contentId, revision, encryptionMethod,
 * fileType, fileSize, timestamp) and sorting (by timestamp, address, contentId,
 * revision, arrayIndex).
 *
 * @param params - Optional filter, sort, pagination, and include config
 * @returns `{ encryptedAssets, totalCount, isLoading, error, ...rest }` — full TanStack Query
 *   result with `data` flattened to `encryptedAssets` and `totalCount`
 *
 * @example
 * ```tsx
 * import { useEncryptedAssets } from '@lsp-indexer/react';
 *
 * function EncryptedAssetList({ address }: { address: string }) {
 *   const { encryptedAssets, totalCount, isLoading } = useEncryptedAssets({
 *     filter: { address },
 *     sort: { field: 'timestamp', direction: 'desc' },
 *     limit: 20,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{totalCount} encrypted assets</p>
 *       {encryptedAssets.map((ea) => (
 *         <div key={`${ea.address}-${ea.contentId}-${ea.revision}`}>
 *           {ea.address}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useEncryptedAssets = createUseEncryptedAssets((params) =>
  fetchEncryptedAssets(getClientUrl(), params),
);
