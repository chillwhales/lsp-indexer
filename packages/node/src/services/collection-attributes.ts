import type { CollectionAttributesResult } from '@lsp-indexer/types';
import { execute } from '../client/execute';
import { GetCollectionAttributesDocument } from '../documents/collection-attributes';
import { escapeLike } from './utils';

/**
 * Fetch distinct {key, value} attribute pairs and total NFT count for a collection.
 *
 * Uses `distinct_on: [key, value]` to deduplicate across all NFTs in the collection,
 * and `nft_aggregate` to get the total NFT count.
 */
export async function fetchCollectionAttributes(
  url: string,
  params: { collectionAddress: string },
): Promise<CollectionAttributesResult> {
  const data = await execute(url, GetCollectionAttributesDocument, {
    collectionAddress: `%${escapeLike(params.collectionAddress)}%`,
    distinctOn: ['key', 'value'],
  });

  return {
    attributes: data.lsp4_metadata_attribute.map((attr) => ({
      key: attr.key ?? '',
      value: attr.value ?? '',
      type: attr.type ?? null,
    })),
    totalCount: data.nft_aggregate.aggregate?.count ?? 0,
  };
}
