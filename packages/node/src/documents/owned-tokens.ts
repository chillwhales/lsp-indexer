import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single Owned Token (LSP8 individual NFT ownership).
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp (e.g., `{ id: { _eq: "..." } }`)
 * - `$includeDigitalAsset` — Include related digital asset details (with 17 DA sub-variables)
 * - `$include[Name|Symbol|...]` — 17 digital asset sub-include toggles
 * - `$includeNft` — Include related NFT details (core fields + metadata)
 * - `$includeOwnedAsset` — Include related owned asset (parent fungible ownership record)
 * - `$includeUniversalProfile` — Include related universal profile details
 *
 * Uses `@include(if:)` directives so omitted nested data is never sent over the wire.
 * When `include` is omitted by the caller, all variables default to `true` → everything fetched.
 */
export const GetOwnedTokenDocument = graphql(`
  query GetOwnedToken(
    $where: owned_token_bool_exp!
    $includeDigitalAsset: Boolean! = true
    $includeName: Boolean! = true
    $includeSymbol: Boolean! = true
    $includeTokenType: Boolean! = true
    $includeDecimals: Boolean! = true
    $includeTotalSupply: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
    $includeOwner: Boolean! = true
    $includeHolderCount: Boolean! = true
    $includeCreatorCount: Boolean! = true
    $includeReferenceContract: Boolean! = true
    $includeTokenIdFormat: Boolean! = true
    $includeBaseUri: Boolean! = true
    $includeNft: Boolean! = true
    $includeOwnedAsset: Boolean! = true
    $includeUniversalProfile: Boolean! = true
  ) {
    owned_token(where: $where, limit: 1) {
      id
      address
      owner
      token_id
      block
      timestamp
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        lsp4TokenName @include(if: $includeName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeTokenType) {
          value
        }
        decimals @include(if: $includeDecimals) {
          value
        }
        totalSupply @include(if: $includeTotalSupply) {
          value
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
        owner @include(if: $includeOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeBaseUri) {
          value
        }
      }
      nft @include(if: $includeNft) {
        address
        token_id
        formatted_token_id
        is_burned
        is_minted
        lsp4Metadata {
          name {
            value
          }
          description {
            value
          }
          category {
            value
          }
          icon {
            url
            width
            height
            verification_method
            verification_data
          }
          images {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links {
            title
            url
          }
          attributes {
            key
            value
            type
          }
        }
        lsp4MetadataBaseUri {
          name {
            value
          }
          description {
            value
          }
          category {
            value
          }
          icon {
            url
            width
            height
            verification_method
            verification_data
          }
          images {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links {
            title
            url
          }
          attributes {
            key
            value
            type
          }
        }
      }
      ownedAsset @include(if: $includeOwnedAsset) {
        id
        address
        owner
        balance
        block
        timestamp
      }
      universalProfile @include(if: $includeUniversalProfile) {
        address
        lsp3Profile {
          name {
            value
          }
          description {
            value
          }
          tags {
            value
          }
          links {
            title
            url
          }
          avatar {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage {
            url
            width
            height
            verification_method
            verification_data
          }
        }
      }
    }
  }
`);

/**
 * GraphQL document for fetching a paginated list of Owned Tokens with total count.
 *
 * Used by both `useOwnedTokens` (offset-based pagination) and `useInfiniteOwnedTokens`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat OwnedTokenFilter)
 * - `$order_by` — Sort order (built by service layer from OwnedTokenSort)
 * - `$limit` / `$offset` — Pagination
 * - `$includeDigitalAsset` + 17 DA sub-variables — Digital asset nested include toggles
 * - `$includeNft` — NFT nested include toggle
 * - `$includeOwnedAsset` — Owned asset (parent) nested include toggle
 * - `$includeUniversalProfile` — Universal profile nested include toggle
 *
 * Includes `owned_token_aggregate` for total count (used for "X of Y results" UI).
 */
export const GetOwnedTokensDocument = graphql(`
  query GetOwnedTokens(
    $where: owned_token_bool_exp
    $order_by: [owned_token_order_by!]
    $limit: Int
    $offset: Int
    $includeDigitalAsset: Boolean! = true
    $includeName: Boolean! = true
    $includeSymbol: Boolean! = true
    $includeTokenType: Boolean! = true
    $includeDecimals: Boolean! = true
    $includeTotalSupply: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
    $includeOwner: Boolean! = true
    $includeHolderCount: Boolean! = true
    $includeCreatorCount: Boolean! = true
    $includeReferenceContract: Boolean! = true
    $includeTokenIdFormat: Boolean! = true
    $includeBaseUri: Boolean! = true
    $includeNft: Boolean! = true
    $includeOwnedAsset: Boolean! = true
    $includeUniversalProfile: Boolean! = true
  ) {
    owned_token(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      owner
      token_id
      block
      timestamp
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        lsp4TokenName @include(if: $includeName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeTokenType) {
          value
        }
        decimals @include(if: $includeDecimals) {
          value
        }
        totalSupply @include(if: $includeTotalSupply) {
          value
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
        owner @include(if: $includeOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeBaseUri) {
          value
        }
      }
      nft @include(if: $includeNft) {
        address
        token_id
        formatted_token_id
        is_burned
        is_minted
        lsp4Metadata {
          name {
            value
          }
          description {
            value
          }
          category {
            value
          }
          icon {
            url
            width
            height
            verification_method
            verification_data
          }
          images {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links {
            title
            url
          }
          attributes {
            key
            value
            type
          }
        }
        lsp4MetadataBaseUri {
          name {
            value
          }
          description {
            value
          }
          category {
            value
          }
          icon {
            url
            width
            height
            verification_method
            verification_data
          }
          images {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links {
            title
            url
          }
          attributes {
            key
            value
            type
          }
        }
      }
      ownedAsset @include(if: $includeOwnedAsset) {
        id
        address
        owner
        balance
        block
        timestamp
      }
      universalProfile @include(if: $includeUniversalProfile) {
        address
        lsp3Profile {
          name {
            value
          }
          description {
            value
          }
          tags {
            value
          }
          links {
            title
            url
          }
          avatar {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage {
            url
            width
            height
            verification_method
            verification_data
          }
        }
      }
    }
    owned_token_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
