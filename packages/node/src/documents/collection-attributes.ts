import { graphql } from '../graphql';

/** Distinct collection attributes + NFT count for a collection address. */
export const GetCollectionAttributesDocument = graphql(`
  query GetCollectionAttributes(
    $collectionAddress: String!
    $distinctOn: [lsp4_metadata_attribute_select_column!]
  ) {
    lsp4_metadata_attribute(
      distinct_on: $distinctOn
      order_by: [{ key: asc }, { value: asc }]
      where: { lsp4Metadata: { address: { _ilike: $collectionAddress } } }
    ) {
      key
      value
      type
    }
    nft_aggregate(where: { address: { _ilike: $collectionAddress } }) {
      aggregate {
        count
      }
    }
  }
`);
