import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of ERC725Y data changed events with total count.
 *
 * Used by both `useDataChangedEvents` (offset-based pagination) and `useInfiniteDataChangedEvents`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * No singular `useDataChangedEvent` hook exists because event records have no natural key
 * (opaque Hasura ID only). Developers query by filter instead.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat DataChangedEventFilter)
 * - `$order_by` — Sort order (built by service layer from DataChangedEventSort)
 * - `$limit` / `$offset` — Pagination
 * - `$includeBlockNumber`, `$includeTimestamp`, `$includeLogIndex`, `$includeTransactionIndex` — Scalar include toggles
 * - `$includeUniversalProfile*` — Boolean flags for Universal Profile sub-includes
 * - `$includeDigitalAsset*` — Boolean flags for digital asset sub-includes
 *
 * All include variables default to `true` (inverted default — omit `include` = fetch everything).
 *
 * **CRITICAL Hasura field names:**
 * - `data_key` (Hasura) → `dataKey` (our domain type) — parser does the mapping
 * - `data_value` (Hasura) → `dataValue` (our domain type)
 * - `block_number` (Hasura) → `blockNumber` (our domain type)
 * - `log_index` (Hasura) → `logIndex` (our domain type)
 * - `transaction_index` (Hasura) → `transactionIndex` (our domain type)
 *
 * Universal Profile sub-fields match what `parseProfile` expects.
 * Digital Asset sub-fields match what `parseDigitalAsset` expects.
 */
export const GetDataChangedEventsDocument = graphql(`
  query GetDataChangedEvents(
    $where: data_changed_bool_exp
    $order_by: [data_changed_order_by!]
    $limit: Int
    $offset: Int
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeUniversalProfile: Boolean! = true
    $includeUniversalProfileName: Boolean! = true
    $includeUniversalProfileDescription: Boolean! = true
    $includeUniversalProfileTags: Boolean! = true
    $includeUniversalProfileLinks: Boolean! = true
    $includeUniversalProfileAvatar: Boolean! = true
    $includeUniversalProfileImage: Boolean! = true
    $includeUniversalProfileBackgroundImage: Boolean! = true
    $includeUniversalProfileFollowerCount: Boolean! = true
    $includeUniversalProfileFollowingCount: Boolean! = true
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
    data_changed(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      data_key
      data_value
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      log_index @include(if: $includeLogIndex)
      transaction_index @include(if: $includeTransactionIndex)
      universalProfile @include(if: $includeUniversalProfile) {
        address
        lsp3Profile {
          name @include(if: $includeUniversalProfileName) {
            value
          }
          description @include(if: $includeUniversalProfileDescription) {
            value
          }
          tags @include(if: $includeUniversalProfileTags) {
            value
          }
          links @include(if: $includeUniversalProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeUniversalProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeUniversalProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeUniversalProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeUniversalProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeUniversalProfileFollowingCount) {
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
    data_changed_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/**
 * GraphQL subscription document for real-time data changed event updates.
 *
 * Mirrors `GetDataChangedEventsDocument` field selections and `@include` directives exactly.
 * Differences from query: `subscription` keyword, no `$offset`, no `_aggregate`.
 */
export const DataChangedEventSubscriptionDocument = `
  subscription DataChangedEventSubscription(
    $where: data_changed_bool_exp
    $order_by: [data_changed_order_by!]
    $limit: Int
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeUniversalProfile: Boolean! = true
    $includeUniversalProfileName: Boolean! = true
    $includeUniversalProfileDescription: Boolean! = true
    $includeUniversalProfileTags: Boolean! = true
    $includeUniversalProfileLinks: Boolean! = true
    $includeUniversalProfileAvatar: Boolean! = true
    $includeUniversalProfileImage: Boolean! = true
    $includeUniversalProfileBackgroundImage: Boolean! = true
    $includeUniversalProfileFollowerCount: Boolean! = true
    $includeUniversalProfileFollowingCount: Boolean! = true
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
    data_changed(where: $where, order_by: $order_by, limit: $limit) {
      address
      data_key
      data_value
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      log_index @include(if: $includeLogIndex)
      transaction_index @include(if: $includeTransactionIndex)
      universalProfile @include(if: $includeUniversalProfile) {
        address
        lsp3Profile {
          name @include(if: $includeUniversalProfileName) {
            value
          }
          description @include(if: $includeUniversalProfileDescription) {
            value
          }
          tags @include(if: $includeUniversalProfileTags) {
            value
          }
          links @include(if: $includeUniversalProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeUniversalProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeUniversalProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeUniversalProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeUniversalProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeUniversalProfileFollowingCount) {
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
