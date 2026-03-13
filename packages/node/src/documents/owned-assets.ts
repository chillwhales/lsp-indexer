import { graphql } from '../graphql';

/** Single item query. */
export const GetOwnedAssetDocument = graphql(`
  query GetOwnedAsset(
    $where: owned_asset_bool_exp!
    $includeBalance: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeDigitalAssetTimestamp: Boolean! = true
    $includeDigitalAssetBlockNumber: Boolean! = true
    $includeDigitalAssetTransactionIndex: Boolean! = true
    $includeDigitalAssetLogIndex: Boolean! = true
    $includeProfile: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
    $includeProfileTimestamp: Boolean! = true
    $includeProfileBlockNumber: Boolean! = true
    $includeProfileTransactionIndex: Boolean! = true
    $includeProfileLogIndex: Boolean! = true
    $includeTokenIdCount: Boolean! = true
  ) {
    owned_asset(where: $where, limit: 1) {
      id
      address
      owner
      balance @include(if: $includeBalance)
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        timestamp @include(if: $includeDigitalAssetTimestamp)
        block_number @include(if: $includeDigitalAssetBlockNumber)
        transaction_index @include(if: $includeDigitalAssetTransactionIndex)
        log_index @include(if: $includeDigitalAssetLogIndex)
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
      universalProfile @include(if: $includeProfile) {
        address
        timestamp @include(if: $includeProfileTimestamp)
        block_number @include(if: $includeProfileBlockNumber)
        transaction_index @include(if: $includeProfileTransactionIndex)
        log_index @include(if: $includeProfileLogIndex)
        lsp3Profile {
          name @include(if: $includeProfileName) {
            value
          }
          description @include(if: $includeProfileDescription) {
            value
          }
          tags @include(if: $includeProfileTags) {
            value
          }
          links @include(if: $includeProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      tokenIds_aggregate @include(if: $includeTokenIdCount) {
        aggregate {
          count
        }
      }
    }
  }
`);

/** Paginated list of Owned Assets with total count. */
export const GetOwnedAssetsDocument = graphql(`
  query GetOwnedAssets(
    $where: owned_asset_bool_exp
    $order_by: [owned_asset_order_by!]
    $limit: Int
    $offset: Int
    $includeBalance: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeDigitalAssetTimestamp: Boolean! = true
    $includeDigitalAssetBlockNumber: Boolean! = true
    $includeDigitalAssetTransactionIndex: Boolean! = true
    $includeDigitalAssetLogIndex: Boolean! = true
    $includeProfile: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
    $includeProfileTimestamp: Boolean! = true
    $includeProfileBlockNumber: Boolean! = true
    $includeProfileTransactionIndex: Boolean! = true
    $includeProfileLogIndex: Boolean! = true
    $includeTokenIdCount: Boolean! = true
  ) {
    owned_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      owner
      balance @include(if: $includeBalance)
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        timestamp @include(if: $includeDigitalAssetTimestamp)
        block_number @include(if: $includeDigitalAssetBlockNumber)
        transaction_index @include(if: $includeDigitalAssetTransactionIndex)
        log_index @include(if: $includeDigitalAssetLogIndex)
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
      universalProfile @include(if: $includeProfile) {
        address
        timestamp @include(if: $includeProfileTimestamp)
        block_number @include(if: $includeProfileBlockNumber)
        transaction_index @include(if: $includeProfileTransactionIndex)
        log_index @include(if: $includeProfileLogIndex)
        lsp3Profile {
          name @include(if: $includeProfileName) {
            value
          }
          description @include(if: $includeProfileDescription) {
            value
          }
          tags @include(if: $includeProfileTags) {
            value
          }
          links @include(if: $includeProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      tokenIds_aggregate @include(if: $includeTokenIdCount) {
        aggregate {
          count
        }
      }
    }
    owned_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetOwnedAssetsDocument. */
export const OwnedAssetSubscriptionDocument = graphql(`
  subscription OwnedAssetSubscription(
    $where: owned_asset_bool_exp
    $order_by: [owned_asset_order_by!]
    $limit: Int
    $includeBalance: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeDigitalAssetTimestamp: Boolean! = true
    $includeDigitalAssetBlockNumber: Boolean! = true
    $includeDigitalAssetTransactionIndex: Boolean! = true
    $includeDigitalAssetLogIndex: Boolean! = true
    $includeProfile: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
    $includeProfileTimestamp: Boolean! = true
    $includeProfileBlockNumber: Boolean! = true
    $includeProfileTransactionIndex: Boolean! = true
    $includeProfileLogIndex: Boolean! = true
    $includeTokenIdCount: Boolean! = true
  ) {
    owned_asset(where: $where, order_by: $order_by, limit: $limit) {
      id
      address
      owner
      balance @include(if: $includeBalance)
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      digitalAsset @include(if: $includeDigitalAsset) {
        id
        address
        timestamp @include(if: $includeDigitalAssetTimestamp)
        block_number @include(if: $includeDigitalAssetBlockNumber)
        transaction_index @include(if: $includeDigitalAssetTransactionIndex)
        log_index @include(if: $includeDigitalAssetLogIndex)
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
      universalProfile @include(if: $includeProfile) {
        address
        timestamp @include(if: $includeProfileTimestamp)
        block_number @include(if: $includeProfileBlockNumber)
        transaction_index @include(if: $includeProfileTransactionIndex)
        log_index @include(if: $includeProfileLogIndex)
        lsp3Profile {
          name @include(if: $includeProfileName) {
            value
          }
          description @include(if: $includeProfileDescription) {
            value
          }
          tags @include(if: $includeProfileTags) {
            value
          }
          links @include(if: $includeProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      tokenIds_aggregate @include(if: $includeTokenIdCount) {
        aggregate {
          count
        }
      }
    }
  }
`);
