import { TypedDocumentString } from '../graphql/graphql';

/**
 * Query result type for GetNft — a single NFT by address + tokenId.
 *
 * We define the result type manually (not from codegen) because the NFT
 * domain documents are hand-written, not generated from the codegen pipeline.
 */
export interface GetNftQueryResult {
  nft: Array<{
    address: string;
    token_id: string;
    formatted_token_id: string | null;
    is_burned: boolean;
    is_minted: boolean;
    digitalAsset: {
      lsp4TokenName: { value: string | null } | null;
      lsp4TokenSymbol: { value: string | null } | null;
      lsp8TokenMetadataBaseUri: { value: string | null } | null;
    } | null;
    ownedToken: {
      owner: string;
    } | null;
  }>;
}

/**
 * Query variables for GetNft.
 */
export interface GetNftQueryVariables {
  where: Record<string, unknown>;
}

/**
 * GraphQL document for fetching a single NFT by collection address and token ID.
 *
 * Uses `_ilike` for case-insensitive address/tokenId matching (EIP-55 safety).
 * Joins through `digitalAsset` for collection-level metadata (name, symbol, baseUri)
 * and through `ownedToken` for the current owner address.
 */
export const GetNftDocument = new TypedDocumentString(`
  query GetNft($where: nft_bool_exp!) {
    nft(where: $where, limit: 1) {
      address
      token_id
      formatted_token_id
      is_burned
      is_minted
      digitalAsset {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
        lsp8TokenMetadataBaseUri {
          value
        }
      }
      ownedToken {
        owner
      }
    }
  }
`) as unknown as TypedDocumentString<GetNftQueryResult, GetNftQueryVariables>;

/**
 * Query result type for GetNfts — a paginated list of NFTs with total count.
 */
export interface GetNftsQueryResult {
  nft: Array<{
    address: string;
    token_id: string;
    formatted_token_id: string | null;
    is_burned: boolean;
    is_minted: boolean;
    digitalAsset: {
      lsp4TokenName: { value: string | null } | null;
      lsp4TokenSymbol: { value: string | null } | null;
      lsp8TokenMetadataBaseUri: { value: string | null } | null;
    } | null;
    ownedToken: {
      owner: string;
    } | null;
  }>;
  nft_aggregate: {
    aggregate: {
      count: number;
    } | null;
  };
}

/**
 * Query variables for GetNfts.
 */
export interface GetNftsQueryVariables {
  where?: Record<string, unknown> | null;
  order_by?: Record<string, unknown>[] | null;
  limit?: number | null;
  offset?: number | null;
}

/**
 * GraphQL document for fetching a paginated list of NFTs with total count.
 *
 * Used by both `useNfts` (offset-based pagination) and `useInfiniteNfts`
 * (infinite scroll) — the difference is how the hook manages pagination.
 *
 * Includes `nft_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetNftsDocument = new TypedDocumentString(`
  query GetNfts(
    $where: nft_bool_exp
    $order_by: [nft_order_by!]
    $limit: Int
    $offset: Int
  ) {
    nft(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      token_id
      formatted_token_id
      is_burned
      is_minted
      digitalAsset {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
        lsp8TokenMetadataBaseUri {
          value
        }
      }
      ownedToken {
        owner
      }
    }
    nft_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`) as unknown as TypedDocumentString<GetNftsQueryResult, GetNftsQueryVariables>;
