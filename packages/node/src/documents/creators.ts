import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of LSP4 creators with total count.
 *
 * Used by both `useCreators` (offset-based pagination) and `useInfiniteCreators`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * No singular `useCreator` hook exists because creator records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat CreatorFilter)
 * - `$order_by` — Sort order (built by service layer from CreatorSort)
 * - `$limit` / `$offset` — Pagination
 * - `$includeArrayIndex`, `$includeInterfaceId`, `$includeTimestamp` — Scalar include toggles
 * - `$includeCreatorProfile*` — Boolean flags for creator's Universal Profile sub-includes
 * - `$includeDigitalAsset*` — Boolean flags for digital asset sub-includes
 *
 * All include variables default to `true` (inverted default — omit `include` = fetch everything).
 *
 * Creator profile sub-fields match what `parseProfile` expects.
 * Digital asset sub-fields match what `parseDigitalAsset` expects.
 */
export const GetCreatorsDocument = graphql(`
  query GetCreators(
    $where: lsp4_creator_bool_exp
    $order_by: [lsp4_creator_order_by!]
    $limit: Int
    $offset: Int
    $includeArrayIndex: Boolean! = true
    $includeInterfaceId: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeCreatorProfile: Boolean! = true
    $includeCreatorProfileName: Boolean! = true
    $includeCreatorProfileDescription: Boolean! = true
    $includeCreatorProfileTags: Boolean! = true
    $includeCreatorProfileLinks: Boolean! = true
    $includeCreatorProfileAvatar: Boolean! = true
    $includeCreatorProfileImage: Boolean! = true
    $includeCreatorProfileBackgroundImage: Boolean! = true
    $includeCreatorProfileFollowerCount: Boolean! = true
    $includeCreatorProfileFollowingCount: Boolean! = true
    $includeDigitalAsset: Boolean! = true
    $includeDigitalAssetName: Boolean! = true
    $includeDigitalAssetSymbol: Boolean! = true
    $includeDigitalAssetTokenType: Boolean! = true
    $includeDigitalAssetDecimals: Boolean! = true
    $includeDigitalAssetTotalSupply: Boolean! = true
    $includeDigitalAssetDescription: Boolean! = true
    $includeDigitalAssetCategory: Boolean! = true
    $includeDigitalAssetIcons: Boolean! = true
    $includeDigitalAssetImages: Boolean! = true
    $includeDigitalAssetLinks: Boolean! = true
    $includeDigitalAssetAttributes: Boolean! = true
    $includeDigitalAssetOwner: Boolean! = true
    $includeDigitalAssetHolderCount: Boolean! = true
    $includeDigitalAssetCreatorCount: Boolean! = true
    $includeDigitalAssetReferenceContract: Boolean! = true
    $includeDigitalAssetTokenIdFormat: Boolean! = true
    $includeDigitalAssetBaseUri: Boolean! = true
  ) {
    lsp4_creator(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      creator_address
      address
      array_index @include(if: $includeArrayIndex)
      interface_id @include(if: $includeInterfaceId)
      timestamp @include(if: $includeTimestamp)
      creatorProfile @include(if: $includeCreatorProfile) {
        address
        lsp3Profile {
          name @include(if: $includeCreatorProfileName) {
            value
          }
          description @include(if: $includeCreatorProfileDescription) {
            value
          }
          tags @include(if: $includeCreatorProfileTags) {
            value
          }
          links @include(if: $includeCreatorProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeCreatorProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeCreatorProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeCreatorProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeCreatorProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeCreatorProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        lsp4TokenName @include(if: $includeDigitalAssetName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeDigitalAssetSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeDigitalAssetTokenType) {
          value
        }
        decimals @include(if: $includeDigitalAssetDecimals) {
          value
        }
        totalSupply @include(if: $includeDigitalAssetTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeDigitalAssetDescription) {
            value
          }
          category @include(if: $includeDigitalAssetCategory) {
            value
          }
          icon @include(if: $includeDigitalAssetIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeDigitalAssetImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeDigitalAssetLinks) {
            title
            url
          }
          attributes @include(if: $includeDigitalAssetAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeDigitalAssetOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeDigitalAssetHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeDigitalAssetCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeDigitalAssetReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeDigitalAssetTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeDigitalAssetBaseUri) {
          value
        }
      }
    }
    lsp4_creator_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/**
 * GraphQL subscription document for real-time creator updates.
 *
 * Mirrors `GetCreatorsDocument` field selections and `@include` directives exactly.
 * Differences from query: `subscription` keyword, no `$offset`, no `_aggregate`.
 */
export const CreatorSubscriptionDocument = `
  subscription CreatorSubscription(
    $where: lsp4_creator_bool_exp
    $order_by: [lsp4_creator_order_by!]
    $limit: Int
    $includeArrayIndex: Boolean! = true
    $includeInterfaceId: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeCreatorProfile: Boolean! = true
    $includeCreatorProfileName: Boolean! = true
    $includeCreatorProfileDescription: Boolean! = true
    $includeCreatorProfileTags: Boolean! = true
    $includeCreatorProfileLinks: Boolean! = true
    $includeCreatorProfileAvatar: Boolean! = true
    $includeCreatorProfileImage: Boolean! = true
    $includeCreatorProfileBackgroundImage: Boolean! = true
    $includeCreatorProfileFollowerCount: Boolean! = true
    $includeCreatorProfileFollowingCount: Boolean! = true
    $includeDigitalAsset: Boolean! = true
    $includeDigitalAssetName: Boolean! = true
    $includeDigitalAssetSymbol: Boolean! = true
    $includeDigitalAssetTokenType: Boolean! = true
    $includeDigitalAssetDecimals: Boolean! = true
    $includeDigitalAssetTotalSupply: Boolean! = true
    $includeDigitalAssetDescription: Boolean! = true
    $includeDigitalAssetCategory: Boolean! = true
    $includeDigitalAssetIcons: Boolean! = true
    $includeDigitalAssetImages: Boolean! = true
    $includeDigitalAssetLinks: Boolean! = true
    $includeDigitalAssetAttributes: Boolean! = true
    $includeDigitalAssetOwner: Boolean! = true
    $includeDigitalAssetHolderCount: Boolean! = true
    $includeDigitalAssetCreatorCount: Boolean! = true
    $includeDigitalAssetReferenceContract: Boolean! = true
    $includeDigitalAssetTokenIdFormat: Boolean! = true
    $includeDigitalAssetBaseUri: Boolean! = true
  ) {
    lsp4_creator(where: $where, order_by: $order_by, limit: $limit) {
      creator_address
      address
      array_index @include(if: $includeArrayIndex)
      interface_id @include(if: $includeInterfaceId)
      timestamp @include(if: $includeTimestamp)
      creatorProfile @include(if: $includeCreatorProfile) {
        address
        lsp3Profile {
          name @include(if: $includeCreatorProfileName) {
            value
          }
          description @include(if: $includeCreatorProfileDescription) {
            value
          }
          tags @include(if: $includeCreatorProfileTags) {
            value
          }
          links @include(if: $includeCreatorProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeCreatorProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeCreatorProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeCreatorProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeCreatorProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeCreatorProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        lsp4TokenName @include(if: $includeDigitalAssetName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeDigitalAssetSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeDigitalAssetTokenType) {
          value
        }
        decimals @include(if: $includeDigitalAssetDecimals) {
          value
        }
        totalSupply @include(if: $includeDigitalAssetTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeDigitalAssetDescription) {
            value
          }
          category @include(if: $includeDigitalAssetCategory) {
            value
          }
          icon @include(if: $includeDigitalAssetIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeDigitalAssetImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeDigitalAssetLinks) {
            title
            url
          }
          attributes @include(if: $includeDigitalAssetAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeDigitalAssetOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeDigitalAssetHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeDigitalAssetCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeDigitalAssetReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeDigitalAssetTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeDigitalAssetBaseUri) {
          value
        }
      }
    }
  }
`;
