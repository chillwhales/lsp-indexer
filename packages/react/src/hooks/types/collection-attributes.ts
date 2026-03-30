import type { CollectionAttributesResult } from '@lsp-indexer/types';
import type { UseQueryResult } from '@tanstack/react-query';

/** Flat return shape for useCollectionAttributes — attributes array + totalCount + query state */
export type UseCollectionAttributesReturn = {
  attributes: CollectionAttributesResult['attributes'];
  totalCount: number;
} & Omit<UseQueryResult<CollectionAttributesResult, Error>, 'data'>;
