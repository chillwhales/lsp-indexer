'use server';

import { fetchCollectionAttributes, getServerUrl } from '@lsp-indexer/node';
import {
  type CollectionAttributesResult,
  type UseCollectionAttributesParams,
  UseCollectionAttributesParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch distinct attribute key/value pairs and total NFT count for a collection. */
export async function getCollectionAttributes(
  params: UseCollectionAttributesParams,
): Promise<CollectionAttributesResult> {
  validateInput(UseCollectionAttributesParamsSchema, params, 'getCollectionAttributes');
  return await fetchCollectionAttributes(getServerUrl(), params);
}
