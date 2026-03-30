/**
 * **Hierarchy:**
 * ```
 * collectionAttributeKeys.all                       → ['collection-attributes']
 * collectionAttributeKeys.lists()                   → ['collection-attributes', 'list']
 * collectionAttributeKeys.list(collectionAddress)   → ['collection-attributes', 'list', collectionAddress]
 * ```
 */
export const collectionAttributeKeys = {
  all: ['collection-attributes'] as const,

  lists: () => [...collectionAttributeKeys.all, 'list'] as const,

  list: (collectionAddress: string) =>
    [...collectionAttributeKeys.lists(), collectionAddress] as const,
} as const;
