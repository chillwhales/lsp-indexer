import { collectionAttributeKeys } from '@lsp-indexer/node';
import type {
  CollectionAttribute,
  CollectionAttributesResult,
  UseCollectionAttributesParams,
} from '@lsp-indexer/types';
import { useQuery } from '@tanstack/react-query';
import type { UseCollectionAttributesReturn } from '../../types';

const EMPTY: CollectionAttribute[] = [];

export function createUseCollectionAttributes(
  queryFn: (collectionAddress: string) => Promise<CollectionAttributesResult>,
) {
  function useCollectionAttributes(
    params: UseCollectionAttributesParams,
  ): UseCollectionAttributesReturn {
    const { collectionAddress } = params;

    const { data, ...rest } = useQuery({
      queryKey: collectionAttributeKeys.list(collectionAddress),
      queryFn: () => queryFn(collectionAddress),
      enabled: Boolean(collectionAddress),
    });

    return {
      attributes: data?.attributes ?? EMPTY,
      totalCount: data?.totalCount ?? 0,
      ...rest,
    };
  }

  return useCollectionAttributes;
}
