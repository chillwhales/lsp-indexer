import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single NFT by collection address and token ID.
 *
 * Uses `_ilike` for case-insensitive address/tokenId matching (EIP-55 safety).
 * Joins through `digitalAsset` for collection-level metadata (name, symbol, baseUri)
 * and through `ownedToken` for the current owner address.
 */
export const GetNftDocument = graphql(`
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
`);

/**
 * GraphQL document for fetching a paginated list of NFTs with total count.
 *
 * Used by both `useNfts` (offset-based pagination) and `useInfiniteNfts`
 * (infinite scroll) — the difference is how the hook manages pagination.
 *
 * Includes `nft_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetNftsDocument = graphql(`
  query GetNfts($where: nft_bool_exp, $order_by: [nft_order_by!], $limit: Int, $offset: Int) {
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
`);
