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
 * - `$includeCollection*` — Boolean flags for collection sub-includes (DigitalAsset fields)
 *
 * Uses `@include(if:)` directives so omitted nested data is never sent over the wire.
 * When `include` is omitted by the caller, all variables default to `true` → everything fetched.
 *
 * Both `lsp4Metadata` (direct) and `lsp4MetadataBaseUri` (fallback) are always fetched;
 * the parser applies the fallback logic (direct first, baseUri second, null if both absent).
 */
export const GetNftDocument = graphql(`
  query GetNft(
    $where: nft_bool_exp!
    $includeFormattedTokenId: Boolean! = true
    $includeName: Boolean! = true
    $includeCollection: Boolean! = true
    $includeHolder: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
    $includeCollectionName: Boolean! = true
    $includeCollectionSymbol: Boolean! = true
    $includeCollectionTokenType: Boolean! = true
    $includeCollectionDecimals: Boolean! = true
    $includeCollectionTotalSupply: Boolean! = true
    $includeCollectionDescription: Boolean! = true
    $includeCollectionCategory: Boolean! = true
    $includeCollectionIcons: Boolean! = true
    $includeCollectionImages: Boolean! = true
    $includeCollectionLinks: Boolean! = true
    $includeCollectionAttributes: Boolean! = true
    $includeCollectionOwner: Boolean! = true
    $includeCollectionHolderCount: Boolean! = true
    $includeCollectionCreatorCount: Boolean! = true
    $includeCollectionReferenceContract: Boolean! = true
    $includeCollectionTokenIdFormat: Boolean! = true
    $includeCollectionBaseUri: Boolean! = true
    $includeHolderName: Boolean! = true
    $includeHolderDescription: Boolean! = true
    $includeHolderTags: Boolean! = true
    $includeHolderLinks: Boolean! = true
    $includeHolderAvatar: Boolean! = true
    $includeHolderImage: Boolean! = true
    $includeHolderBackgroundImage: Boolean! = true
    $includeHolderFollowerCount: Boolean! = true
    $includeHolderFollowingCount: Boolean! = true
  ) {
    nft(where: $where, limit: 1) {
      id
      address
      token_id
      is_burned
      is_minted
      formatted_token_id @include(if: $includeFormattedTokenId)
      digitalAsset @include(if: $includeCollection) {
        id
        address
        lsp4TokenName @include(if: $includeCollectionName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeCollectionSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeCollectionTokenType) {
          value
        }
        decimals @include(if: $includeCollectionDecimals) {
          value
        }
        totalSupply @include(if: $includeCollectionTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeCollectionDescription) {
            value
          }
          category @include(if: $includeCollectionCategory) {
            value
          }
          icon @include(if: $includeCollectionIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeCollectionImages) {
            url
            width
            height
            verification_method
            verification_data
          }
          links @include(if: $includeCollectionLinks) {
            title
            url
          }
          attributes @include(if: $includeCollectionAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeCollectionOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeCollectionHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeCollectionCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeCollectionReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeCollectionTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeCollectionBaseUri) {
          value
        }
      }
      ownedToken @include(if: $includeHolder) {
        owner
        timestamp
        universalProfile {
          address
          lsp3Profile {
            name @include(if: $includeHolderName) {
              value
            }
            description @include(if: $includeHolderDescription) {
              value
            }
            tags @include(if: $includeHolderTags) {
              value
            }
            links @include(if: $includeHolderLinks) {
              title
              url
            }
            avatar @include(if: $includeHolderAvatar) {
              url
              file_type
              verification_method
              verification_data
            }
            profileImage @include(if: $includeHolderImage) {
              url
              width
              height
              verification_method
              verification_data
            }
            backgroundImage @include(if: $includeHolderBackgroundImage) {
              url
              width
              height
              verification_method
              verification_data
            }
          }
          followedBy_aggregate @include(if: $includeHolderFollowerCount) {
            aggregate {
              count
            }
          }
          followed_aggregate @include(if: $includeHolderFollowingCount) {
            aggregate {
              count
            }
          }
        }
      }
      lsp4Metadata {
        name @include(if: $includeName) {
          value
        }
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
      lsp4MetadataBaseUri {
        name @include(if: $includeName) {
          value
        }
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
 * - `$includeCollection*` — Boolean flags for collection sub-includes (DigitalAsset fields)
 *
 * Includes `nft_aggregate` for total count (used for "X of Y results" UI).
 *
 * Both `lsp4Metadata` (direct) and `lsp4MetadataBaseUri` (fallback) are always fetched;
 * the parser applies the fallback logic (direct first, baseUri second, null if both absent).
 */
export const GetNftsDocument = graphql(`
  query GetNfts(
    $where: nft_bool_exp
    $order_by: [nft_order_by!]
    $limit: Int
    $offset: Int
    $includeFormattedTokenId: Boolean! = true
    $includeName: Boolean! = true
    $includeCollection: Boolean! = true
    $includeHolder: Boolean! = true
    $includeDescription: Boolean! = true
    $includeCategory: Boolean! = true
    $includeIcons: Boolean! = true
    $includeImages: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAttributes: Boolean! = true
    $includeCollectionName: Boolean! = true
    $includeCollectionSymbol: Boolean! = true
    $includeCollectionTokenType: Boolean! = true
    $includeCollectionDecimals: Boolean! = true
    $includeCollectionTotalSupply: Boolean! = true
    $includeCollectionDescription: Boolean! = true
    $includeCollectionCategory: Boolean! = true
    $includeCollectionIcons: Boolean! = true
    $includeCollectionImages: Boolean! = true
    $includeCollectionLinks: Boolean! = true
    $includeCollectionAttributes: Boolean! = true
    $includeCollectionOwner: Boolean! = true
    $includeCollectionHolderCount: Boolean! = true
    $includeCollectionCreatorCount: Boolean! = true
    $includeCollectionReferenceContract: Boolean! = true
    $includeCollectionTokenIdFormat: Boolean! = true
    $includeCollectionBaseUri: Boolean! = true
    $includeHolderName: Boolean! = true
    $includeHolderDescription: Boolean! = true
    $includeHolderTags: Boolean! = true
    $includeHolderLinks: Boolean! = true
    $includeHolderAvatar: Boolean! = true
    $includeHolderImage: Boolean! = true
    $includeHolderBackgroundImage: Boolean! = true
    $includeHolderFollowerCount: Boolean! = true
    $includeHolderFollowingCount: Boolean! = true
  ) {
    nft(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      token_id
      is_burned
      is_minted
      formatted_token_id @include(if: $includeFormattedTokenId)
      digitalAsset @include(if: $includeCollection) {
        id
        address
        lsp4TokenName @include(if: $includeCollectionName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeCollectionSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeCollectionTokenType) {
          value
        }
        decimals @include(if: $includeCollectionDecimals) {
          value
        }
        totalSupply @include(if: $includeCollectionTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeCollectionDescription) {
            value
          }
          category @include(if: $includeCollectionCategory) {
            value
          }
          icon @include(if: $includeCollectionIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeCollectionImages) {
            url
            width
            height
            verification_method
            verification_data
          }
          links @include(if: $includeCollectionLinks) {
            title
            url
          }
          attributes @include(if: $includeCollectionAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeCollectionOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeCollectionHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeCollectionCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeCollectionReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeCollectionTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeCollectionBaseUri) {
          value
        }
      }
      ownedToken @include(if: $includeHolder) {
        owner
        timestamp
        universalProfile {
          address
          lsp3Profile {
            name @include(if: $includeHolderName) {
              value
            }
            description @include(if: $includeHolderDescription) {
              value
            }
            tags @include(if: $includeHolderTags) {
              value
            }
            links @include(if: $includeHolderLinks) {
              title
              url
            }
            avatar @include(if: $includeHolderAvatar) {
              url
              file_type
              verification_method
              verification_data
            }
            profileImage @include(if: $includeHolderImage) {
              url
              width
              height
              verification_method
              verification_data
            }
            backgroundImage @include(if: $includeHolderBackgroundImage) {
              url
              width
              height
              verification_method
              verification_data
            }
          }
          followedBy_aggregate @include(if: $includeHolderFollowerCount) {
            aggregate {
              count
            }
          }
          followed_aggregate @include(if: $includeHolderFollowingCount) {
            aggregate {
              count
            }
          }
        }
      }
      lsp4Metadata {
        name @include(if: $includeName) {
          value
        }
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
      lsp4MetadataBaseUri {
        name @include(if: $includeName) {
          value
        }
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
