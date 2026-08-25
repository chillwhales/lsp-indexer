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
  queryFn: (params: UseCollectionAttributesParams) => Promise<CollectionAttributesResult>,
) {
  function useCollectionAttributes(
    params: UseCollectionAttributesParams,
  ): UseCollectionAttributesReturn {
    const { collectionAddress, network } = params;

    const { data, ...rest } = useQuery({
      queryKey: collectionAttributeKeys.list(network, collectionAddress),
      queryFn: () => queryFn(params),
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
