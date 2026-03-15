import { graphql } from '../graphql';

/** Paginated list of LSP29 encrypted assets with total count. */
export const GetEncryptedAssetsDocument = graphql(`
  query GetEncryptedAssets(
    $where: lsp29_encrypted_asset_bool_exp
    $order_by: [lsp29_encrypted_asset_order_by!]
    $limit: Int
    $offset: Int
    $includeArrayIndex: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTitle: Boolean! = true
    $includeDescription: Boolean! = true
    $includeEncryption: Boolean! = true
    $includeEncryptionProvider: Boolean! = true
    $includeEncryptionMethod: Boolean! = true
    $includeEncryptionCondition: Boolean! = true
    $includeEncryptionEncryptedKey: Boolean! = true
    $includeEncryptionTokenAddress: Boolean! = true
    $includeEncryptionRequiredBalance: Boolean! = true
    $includeEncryptionRequiredTokenId: Boolean! = true
    $includeEncryptionFollowedAddresses: Boolean! = true
    $includeEncryptionUnlockTimestamp: Boolean! = true
    $includeFile: Boolean! = true
    $includeFileType: Boolean! = true
    $includeFileSize: Boolean! = true
    $includeFileLastModified: Boolean! = true
    $includeFileHash: Boolean! = true
    $includeChunks: Boolean! = true
    $includeChunksIv: Boolean! = true
    $includeChunksTotalSize: Boolean! = true
    $includeChunksIpfsCids: Boolean! = true
    $includeChunksLumeraActionIds: Boolean! = true
    $includeChunksArweaveTransactionIds: Boolean! = true
    $includeChunksS3Keys: Boolean! = true
    $includeChunksS3Bucket: Boolean! = true
    $includeChunksS3Region: Boolean! = true
    $includeImages: Boolean! = true
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
    $includeUniversalProfileTimestamp: Boolean! = true
    $includeUniversalProfileBlockNumber: Boolean! = true
    $includeUniversalProfileTransactionIndex: Boolean! = true
    $includeUniversalProfileLogIndex: Boolean! = true
  ) {
    lsp29_encrypted_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      content_id
      revision

      array_index @include(if: $includeArrayIndex)
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)

      title @include(if: $includeTitle) {
        value
      }

      description @include(if: $includeDescription) {
        value
      }

      encryption @include(if: $includeEncryption) {
        provider @include(if: $includeEncryptionProvider)
        method @include(if: $includeEncryptionMethod)
        condition @include(if: $includeEncryptionCondition)
        encrypted_key @include(if: $includeEncryptionEncryptedKey)
        token_address @include(if: $includeEncryptionTokenAddress)
        required_balance @include(if: $includeEncryptionRequiredBalance)
        required_token_id @include(if: $includeEncryptionRequiredTokenId)
        followed_addresses @include(if: $includeEncryptionFollowedAddresses)
        unlock_timestamp @include(if: $includeEncryptionUnlockTimestamp)
      }

      file @include(if: $includeFile) {
        hash @include(if: $includeFileHash)
        last_modified @include(if: $includeFileLastModified)
        name
        size @include(if: $includeFileSize)
        type @include(if: $includeFileType)
      }

      chunks @include(if: $includeChunks) {
        iv @include(if: $includeChunksIv)
        total_size @include(if: $includeChunksTotalSize)
        ipfs_cids @include(if: $includeChunksIpfsCids)
        lumera_action_ids @include(if: $includeChunksLumeraActionIds)
        arweave_transaction_ids @include(if: $includeChunksArweaveTransactionIds)
        s3_keys @include(if: $includeChunksS3Keys)
        s3_bucket @include(if: $includeChunksS3Bucket)
        s3_region @include(if: $includeChunksS3Region)
      }

      images @include(if: $includeImages) {
        image_index
        url
        width
        height
        verification_method
        verification_data
      }

      universalProfile @include(if: $includeUniversalProfile) {
        address
        timestamp @include(if: $includeUniversalProfileTimestamp)
        block_number @include(if: $includeUniversalProfileBlockNumber)
        transaction_index @include(if: $includeUniversalProfileTransactionIndex)
        log_index @include(if: $includeUniversalProfileLogIndex)
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
    }
    lsp29_encrypted_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetEncryptedAssetsDocument. */
export const EncryptedAssetSubscriptionDocument = graphql(`
  subscription EncryptedAssetSubscription(
    $where: lsp29_encrypted_asset_bool_exp
    $order_by: [lsp29_encrypted_asset_order_by!]
    $limit: Int
    $includeArrayIndex: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTitle: Boolean! = true
    $includeDescription: Boolean! = true
    $includeEncryption: Boolean! = true
    $includeEncryptionProvider: Boolean! = true
    $includeEncryptionMethod: Boolean! = true
    $includeEncryptionCondition: Boolean! = true
    $includeEncryptionEncryptedKey: Boolean! = true
    $includeEncryptionTokenAddress: Boolean! = true
    $includeEncryptionRequiredBalance: Boolean! = true
    $includeEncryptionRequiredTokenId: Boolean! = true
    $includeEncryptionFollowedAddresses: Boolean! = true
    $includeEncryptionUnlockTimestamp: Boolean! = true
    $includeFile: Boolean! = true
    $includeFileType: Boolean! = true
    $includeFileSize: Boolean! = true
    $includeFileLastModified: Boolean! = true
    $includeFileHash: Boolean! = true
    $includeChunks: Boolean! = true
    $includeChunksIv: Boolean! = true
    $includeChunksTotalSize: Boolean! = true
    $includeChunksIpfsCids: Boolean! = true
    $includeChunksLumeraActionIds: Boolean! = true
    $includeChunksArweaveTransactionIds: Boolean! = true
    $includeChunksS3Keys: Boolean! = true
    $includeChunksS3Bucket: Boolean! = true
    $includeChunksS3Region: Boolean! = true
    $includeImages: Boolean! = true
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
    $includeUniversalProfileTimestamp: Boolean! = true
    $includeUniversalProfileBlockNumber: Boolean! = true
    $includeUniversalProfileTransactionIndex: Boolean! = true
    $includeUniversalProfileLogIndex: Boolean! = true
  ) {
    lsp29_encrypted_asset(where: $where, order_by: $order_by, limit: $limit) {
      address
      content_id
      revision

      array_index @include(if: $includeArrayIndex)
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)

      title @include(if: $includeTitle) {
        value
      }

      description @include(if: $includeDescription) {
        value
      }

      encryption @include(if: $includeEncryption) {
        provider @include(if: $includeEncryptionProvider)
        method @include(if: $includeEncryptionMethod)
        condition @include(if: $includeEncryptionCondition)
        encrypted_key @include(if: $includeEncryptionEncryptedKey)
        token_address @include(if: $includeEncryptionTokenAddress)
        required_balance @include(if: $includeEncryptionRequiredBalance)
        required_token_id @include(if: $includeEncryptionRequiredTokenId)
        followed_addresses @include(if: $includeEncryptionFollowedAddresses)
        unlock_timestamp @include(if: $includeEncryptionUnlockTimestamp)
      }

      file @include(if: $includeFile) {
        hash @include(if: $includeFileHash)
        last_modified @include(if: $includeFileLastModified)
        name
        size @include(if: $includeFileSize)
        type @include(if: $includeFileType)
      }

      chunks @include(if: $includeChunks) {
        iv @include(if: $includeChunksIv)
        total_size @include(if: $includeChunksTotalSize)
        ipfs_cids @include(if: $includeChunksIpfsCids)
        lumera_action_ids @include(if: $includeChunksLumeraActionIds)
        arweave_transaction_ids @include(if: $includeChunksArweaveTransactionIds)
        s3_keys @include(if: $includeChunksS3Keys)
        s3_bucket @include(if: $includeChunksS3Bucket)
        s3_region @include(if: $includeChunksS3Region)
      }

      images @include(if: $includeImages) {
        image_index
        url
        width
        height
        verification_method
        verification_data
      }

      universalProfile @include(if: $includeUniversalProfile) {
        address
        timestamp @include(if: $includeUniversalProfileTimestamp)
        block_number @include(if: $includeUniversalProfileBlockNumber)
        transaction_index @include(if: $includeUniversalProfileTransactionIndex)
        log_index @include(if: $includeUniversalProfileLogIndex)
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
    }
  }
`);
