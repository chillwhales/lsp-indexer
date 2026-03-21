import type {
  EncryptedAssetBatchTuple,
  EncryptedAssetFilter,
  EncryptedAssetInclude,
  EncryptedAssetSort,
} from '@lsp-indexer/types';

/**
 * **Hierarchy:**
 * ```
 * encryptedAssetKeys.all                          → ['encryptedAssets']
 * encryptedAssetKeys.lists()                      → ['encryptedAssets', 'list']
 * encryptedAssetKeys.list(...)                    → ['encryptedAssets', 'list', ...]
 * encryptedAssetKeys.infinites()                  → ['encryptedAssets', 'infinite']
 * encryptedAssetKeys.infinite(...)                → ['encryptedAssets', 'infinite', ...]
 * encryptedAssetKeys.batches()                    → ['encryptedAssets', 'batch']
 * encryptedAssetKeys.batch(...)                   → ['encryptedAssets', 'batch', ...]
 * ```
 */
export const encryptedAssetKeys = {
  all: ['encryptedAssets'] as const,

  lists: () => [...encryptedAssetKeys.all, 'list'] as const,

  list: (
    filter?: EncryptedAssetFilter,
    sort?: EncryptedAssetSort,
    limit?: number,
    offset?: number,
    include?: EncryptedAssetInclude,
  ) => [...encryptedAssetKeys.lists(), filter, sort, limit, offset, include] as const,

  infinites: () => [...encryptedAssetKeys.all, 'infinite'] as const,

  infinite: (
    filter?: EncryptedAssetFilter,
    sort?: EncryptedAssetSort,
    include?: EncryptedAssetInclude,
  ) => [...encryptedAssetKeys.infinites(), filter, sort, include] as const,

  batches: () => [...encryptedAssetKeys.all, 'batch'] as const,

  batch: (tuples: EncryptedAssetBatchTuple[], include?: EncryptedAssetInclude) =>
    [...encryptedAssetKeys.batches(), tuples, include] as const,
} as const;
