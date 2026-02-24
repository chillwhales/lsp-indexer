import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of LSP12 issued assets with total count.
 *
 * Used by both `useIssuedAssets` (offset-based pagination) and `useInfiniteIssuedAssets`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * No singular `useIssuedAsset` hook exists because issued asset records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat IssuedAssetFilter)
 * - `$order_by` — Sort order (built by service layer from IssuedAssetSort)
 * - `$limit` / `$offset` — Pagination
 * - `$includeArrayIndex`, `$includeInterfaceId`, `$includeTimestamp` — Scalar include toggles
 * - `$includeIssuerProfile*` — Boolean flags for issuer's Universal Profile sub-includes
 * - `$includeDigitalAsset*` — Boolean flags for digital asset sub-includes
 *
 * All include variables default to `true` (inverted default — omit `include` = fetch everything).
 *
 * **CRITICAL Hasura field names:**
 * - `universalProfile` (Hasura) → `issuerProfile` (our domain type) — parser does the mapping
 * - `issuedAsset` (Hasura) → `digitalAsset` (our domain type) — parser does the mapping
 * - `address` (Hasura) → `issuerAddress` (our domain type)
 * - `asset_address` (Hasura) → `assetAddress` (our domain type)
 *
 * Issuer profile sub-fields match what `parseProfile` expects.
 * Digital asset sub-fields match what `parseDigitalAsset` expects.
 */
export const GetIssuedAssetsDocument = graphql(`
  query GetIssuedAssets(
    $where: lsp12_issued_asset_bool_exp
    $order_by: [lsp12_issued_asset_order_by!]
    $limit: Int
    $offset: Int
    $includeArrayIndex: Boolean! = true
    $includeInterfaceId: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeIssuerProfile: Boolean! = true
    $includeIssuerProfileName: Boolean! = true
    $includeIssuerProfileDescription: Boolean! = true
    $includeIssuerProfileTags: Boolean! = true
    $includeIssuerProfileLinks: Boolean! = true
    $includeIssuerProfileAvatar: Boolean! = true
    $includeIssuerProfileImage: Boolean! = true
    $includeIssuerProfileBackgroundImage: Boolean! = true
    $includeIssuerProfileFollowerCount: Boolean! = true
    $includeIssuerProfileFollowingCount: Boolean! = true
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
    lsp12_issued_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      asset_address
      array_index @include(if: $includeArrayIndex)
      interface_id @include(if: $includeInterfaceId)
      timestamp @include(if: $includeTimestamp)
      universalProfile @include(if: $includeIssuerProfile) {
        address
        lsp3Profile {
          name @include(if: $includeIssuerProfileName) {
            value
          }
          description @include(if: $includeIssuerProfileDescription) {
            value
          }
          tags @include(if: $includeIssuerProfileTags) {
            value
          }
          links @include(if: $includeIssuerProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeIssuerProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeIssuerProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeIssuerProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeIssuerProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeIssuerProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      issuedAsset @include(if: $includeDigitalAsset) {
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
    lsp12_issued_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);
