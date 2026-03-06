import { graphql } from '../graphql';

/** Paginated list of universal receiver events with total count. */
export const GetUniversalReceiverEventsDocument = graphql(`
  query GetUniversalReceiverEvents(
    $where: universal_receiver_bool_exp
    $order_by: [universal_receiver_order_by!]
    $limit: Int
    $offset: Int
    $includeValue: Boolean! = true
    $includeReceivedData: Boolean! = true
    $includeReturnedValue: Boolean! = true
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
    $includeFromProfile: Boolean! = true
    $includeFromProfileName: Boolean! = true
    $includeFromProfileDescription: Boolean! = true
    $includeFromProfileTags: Boolean! = true
    $includeFromProfileLinks: Boolean! = true
    $includeFromProfileAvatar: Boolean! = true
    $includeFromProfileImage: Boolean! = true
    $includeFromProfileBackgroundImage: Boolean! = true
    $includeFromProfileFollowerCount: Boolean! = true
    $includeFromProfileFollowingCount: Boolean! = true
    $includeFromAsset: Boolean! = true
    $includeFromAssetName: Boolean! = true
    $includeFromAssetSymbol: Boolean! = true
    $includeFromAssetTokenType: Boolean! = true
    $includeFromAssetDecimals: Boolean! = true
    $includeFromAssetTotalSupply: Boolean! = true
    $includeFromAssetDescription: Boolean! = true
    $includeFromAssetCategory: Boolean! = true
    $includeFromAssetIcons: Boolean! = true
    $includeFromAssetImages: Boolean! = true
    $includeFromAssetLinks: Boolean! = true
    $includeFromAssetAttributes: Boolean! = true
    $includeFromAssetOwner: Boolean! = true
    $includeFromAssetHolderCount: Boolean! = true
    $includeFromAssetCreatorCount: Boolean! = true
    $includeFromAssetReferenceContract: Boolean! = true
    $includeFromAssetTokenIdFormat: Boolean! = true
    $includeFromAssetBaseUri: Boolean! = true
  ) {
    universal_receiver(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      from
      type_id
      received_data @include(if: $includeReceivedData)
      returned_value @include(if: $includeReturnedValue)
      value @include(if: $includeValue)
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
      fromProfile @include(if: $includeFromProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFromProfileName) {
            value
          }
          description @include(if: $includeFromProfileDescription) {
            value
          }
          tags @include(if: $includeFromProfileTags) {
            value
          }
          links @include(if: $includeFromProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFromProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFromProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFromProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFromProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFromProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      fromAsset @include(if: $includeFromAsset) {
        id
        address
        lsp4TokenName @include(if: $includeFromAssetName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeFromAssetSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeFromAssetTokenType) {
          value
        }
        decimals @include(if: $includeFromAssetDecimals) {
          value
        }
        totalSupply @include(if: $includeFromAssetTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeFromAssetDescription) {
            value
          }
          category @include(if: $includeFromAssetCategory) {
            value
          }
          icon @include(if: $includeFromAssetIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeFromAssetImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeFromAssetLinks) {
            title
            url
          }
          attributes @include(if: $includeFromAssetAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeFromAssetOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeFromAssetHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeFromAssetCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeFromAssetReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeFromAssetTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeFromAssetBaseUri) {
          value
        }
      }
    }
    universal_receiver_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetUniversalReceiverEventsDocument. */
export const UniversalReceiverEventSubscriptionDocument = graphql(`
  subscription UniversalReceiverEventSubscription(
    $where: universal_receiver_bool_exp
    $order_by: [universal_receiver_order_by!]
    $limit: Int
    $includeValue: Boolean! = true
    $includeReceivedData: Boolean! = true
    $includeReturnedValue: Boolean! = true
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
    $includeFromProfile: Boolean! = true
    $includeFromProfileName: Boolean! = true
    $includeFromProfileDescription: Boolean! = true
    $includeFromProfileTags: Boolean! = true
    $includeFromProfileLinks: Boolean! = true
    $includeFromProfileAvatar: Boolean! = true
    $includeFromProfileImage: Boolean! = true
    $includeFromProfileBackgroundImage: Boolean! = true
    $includeFromProfileFollowerCount: Boolean! = true
    $includeFromProfileFollowingCount: Boolean! = true
    $includeFromAsset: Boolean! = true
    $includeFromAssetName: Boolean! = true
    $includeFromAssetSymbol: Boolean! = true
    $includeFromAssetTokenType: Boolean! = true
    $includeFromAssetDecimals: Boolean! = true
    $includeFromAssetTotalSupply: Boolean! = true
    $includeFromAssetDescription: Boolean! = true
    $includeFromAssetCategory: Boolean! = true
    $includeFromAssetIcons: Boolean! = true
    $includeFromAssetImages: Boolean! = true
    $includeFromAssetLinks: Boolean! = true
    $includeFromAssetAttributes: Boolean! = true
    $includeFromAssetOwner: Boolean! = true
    $includeFromAssetHolderCount: Boolean! = true
    $includeFromAssetCreatorCount: Boolean! = true
    $includeFromAssetReferenceContract: Boolean! = true
    $includeFromAssetTokenIdFormat: Boolean! = true
    $includeFromAssetBaseUri: Boolean! = true
  ) {
    universal_receiver(where: $where, order_by: $order_by, limit: $limit) {
      address
      from
      type_id
      received_data @include(if: $includeReceivedData)
      returned_value @include(if: $includeReturnedValue)
      value @include(if: $includeValue)
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
      fromProfile @include(if: $includeFromProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFromProfileName) {
            value
          }
          description @include(if: $includeFromProfileDescription) {
            value
          }
          tags @include(if: $includeFromProfileTags) {
            value
          }
          links @include(if: $includeFromProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFromProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFromProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFromProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFromProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFromProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      fromAsset @include(if: $includeFromAsset) {
        id
        address
        lsp4TokenName @include(if: $includeFromAssetName) {
          value
        }
        lsp4TokenSymbol @include(if: $includeFromAssetSymbol) {
          value
        }
        lsp4TokenType @include(if: $includeFromAssetTokenType) {
          value
        }
        decimals @include(if: $includeFromAssetDecimals) {
          value
        }
        totalSupply @include(if: $includeFromAssetTotalSupply) {
          value
        }
        lsp4Metadata {
          description @include(if: $includeFromAssetDescription) {
            value
          }
          category @include(if: $includeFromAssetCategory) {
            value
          }
          icon @include(if: $includeFromAssetIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeFromAssetImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeFromAssetLinks) {
            title
            url
          }
          attributes @include(if: $includeFromAssetAttributes) {
            key
            value
            type
          }
        }
        owner @include(if: $includeFromAssetOwner) {
          address
          timestamp
        }
        ownedAssets_aggregate @include(if: $includeFromAssetHolderCount) {
          aggregate {
            count
          }
        }
        lsp4CreatorsLength @include(if: $includeFromAssetCreatorCount) {
          value
        }
        lsp8ReferenceContract @include(if: $includeFromAssetReferenceContract) {
          value
        }
        lsp8TokenIdFormat @include(if: $includeFromAssetTokenIdFormat) {
          value
        }
        lsp8TokenMetadataBaseUri @include(if: $includeFromAssetBaseUri) {
          value
        }
      }
    }
  }
`);
