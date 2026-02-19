import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of LSP29 Encrypted Asset Feed Entries
 * with total count.
 *
 * Used by both `useEncryptedAssetFeed` (offset-based pagination) and
 * `useInfiniteEncryptedAssetFeed` (infinite scroll).
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from EncryptedFeedFilter)
 * - `$order_by` — Sort order (built by service layer from EncryptedFeedSort)
 * - `$limit` / `$offset` — Pagination
 *
 * Includes `lsp29_encrypted_asset_entry_aggregate` for total count.
 */
export const GetEncryptedAssetFeedDocument = graphql(`
  query GetEncryptedAssetFeed(
    $where: lsp29_encrypted_asset_entry_bool_exp
    $order_by: [lsp29_encrypted_asset_entry_order_by!]
    $limit: Int
    $offset: Int
  ) {
    lsp29_encrypted_asset_entry(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      id
      address
      content_id_hash
      array_index
      timestamp
      universal_profile_id
    }
    lsp29_encrypted_asset_entry_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
