'use server';

import { fetchCollectionAttributes, getServerUrl } from '@lsp-indexer/node';
import {
  type CollectionAttributesResult,
  UseCollectionAttributesParamsSchema,
} from '@lsp-indexer/types';
import { validateInput } from './validate';

/** Server action: fetch distinct attribute key/value pairs and total NFT count for a collection. */
export async function getCollectionAttributes(
  collectionAddress: string,
): Promise<CollectionAttributesResult> {
  validateInput(
    UseCollectionAttributesParamsSchema,
    { collectionAddress },
    'getCollectionAttributes',
  );
  return await fetchCollectionAttributes(getServerUrl(), { collectionAddress });
}
