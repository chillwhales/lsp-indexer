import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single NFT.
 *
 * NFTs are identified by (address, tokenId) pair — the service layer builds
 * the `$where` filter (e.g., `{ address: { _ilike: "0x..." }, token_id: { _eq: "..." } }`).
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp
 * - `$include*` — Boolean flags controlling nested data, all default to `true` (inverted default)
 *
 * Uses `@include(if:)` directives so omitted nested data is never sent over the wire.
 * When `include` is omitted by the caller, all variables default to `true` → everything fetched.
 */
export const GetNftDocument = graphql(`
  query GetNft(
    $where: nft_bool_exp!
    $includeFormattedTokenId: Boolean! = true
    $includeCollection: Boolean! = true
    $includeOwner: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
  ) {
    nft(where: $where, limit: 1) {
      id
      address
      token_id
      is_burned
      is_minted
      formatted_token_id @include(if: $includeFormattedTokenId)
      digitalAsset @include(if: $includeCollection) {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
      }
      ownedToken @include(if: $includeOwner) {
        owner
        timestamp
      }
      lsp4Metadata {
        description @include(if: $includeDescription) {
          value
        }
        category @include(if: $includeCategory) {
          value
        }
        icon @include(if: $includeIcons) {
          url
          width
          height
          verification_method
          verification_data
        }
        images @include(if: $includeImages) {
          url
          width
          height
          image_index
          verification_method
          verification_data
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        attributes @include(if: $includeAttributes) {
          key
          value
          type
        }
      }
    }
  }
`);

/**
 * GraphQL document for fetching a paginated list of NFTs with total count.
 *
 * Used by both `useNfts` (offset-based pagination) and `useInfiniteNfts`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat NftFilter)
 * - `$order_by` — Sort order (built by service layer from NftSort)
 * - `$limit` / `$offset` — Pagination
 * - `$include*` — Boolean flags controlling nested data, all default to `true` (inverted default)
 *
 * Includes `nft_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetNftsDocument = graphql(`
  query GetNfts(
    $where: nft_bool_exp
    $order_by: [nft_order_by!]
    $limit: Int
    $offset: Int
    $includeFormattedTokenId: Boolean! = true
    $includeCollection: Boolean! = true
    $includeOwner: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
  ) {
    nft(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      token_id
      is_burned
      is_minted
      formatted_token_id @include(if: $includeFormattedTokenId)
      digitalAsset @include(if: $includeCollection) {
        lsp4TokenName {
          value
        }
        lsp4TokenSymbol {
          value
        }
      }
      ownedToken @include(if: $includeOwner) {
        owner
        timestamp
      }
      lsp4Metadata {
        description @include(if: $includeDescription) {
          value
        }
        category @include(if: $includeCategory) {
          value
        }
        icon @include(if: $includeIcons) {
          url
          width
          height
          verification_method
          verification_data
        }
        images @include(if: $includeImages) {
          url
          width
          height
          image_index
          verification_method
          verification_data
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        attributes @include(if: $includeAttributes) {
          key
          value
          type
        }
      }
    }
    nft_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
