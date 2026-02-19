import { TypedDocumentString } from '../graphql/graphql';

// ---------------------------------------------------------------------------
// Query result types (manual — query not yet in codegen)
// ---------------------------------------------------------------------------

export interface GetEncryptedAssetFeedQueryEntry {
  id: string;
  address: string;
  content_id_hash: string;
  array_index?: number | null;
  timestamp: string;
  universal_profile_id?: string | null;
}

export interface GetEncryptedAssetFeedQuery {
  lsp29_encrypted_asset_entry: GetEncryptedAssetFeedQueryEntry[];
  lsp29_encrypted_asset_entry_aggregate: {
    aggregate?: {
      count: number;
    } | null;
  };
}

export interface GetEncryptedAssetFeedQueryVariables {
  where?: Record<string, unknown> | null;
  order_by?: Record<string, unknown>[] | null;
  limit?: number | null;
  offset?: number | null;
}

// ---------------------------------------------------------------------------
// GraphQL document
// ---------------------------------------------------------------------------

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
export const GetEncryptedAssetFeedDocument = new TypedDocumentString<
  GetEncryptedAssetFeedQuery,
  GetEncryptedAssetFeedQueryVariables
>(`
  query GetEncryptedAssetFeed(
    $where: lsp29_encrypted_asset_entry_bool_exp
    $order_by: [lsp29_encrypted_asset_entry_order_by!]
    $limit: Int
    $offset: Int
  ) {
    lsp29_encrypted_asset_entry(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
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
