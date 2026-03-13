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
    $includeEncryptionMethod: Boolean! = true
    $includeEncryptionCiphertext: Boolean! = true
    $includeEncryptionDataToEncryptHash: Boolean! = true
    $includeEncryptionDecryptionCode: Boolean! = true
    $includeEncryptionDecryptionParams: Boolean! = true
    $includeEncryptionAccessControlConditions: Boolean! = true
    $includeFile: Boolean! = true
    $includeFileType: Boolean! = true
    $includeFileSize: Boolean! = true
    $includeFileLastModified: Boolean! = true
    $includeFileHash: Boolean! = true
    $includeChunks: Boolean! = true
    $includeChunksCids: Boolean! = true
    $includeChunksIv: Boolean! = true
    $includeChunksTotalSize: Boolean! = true
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
        ciphertext @include(if: $includeEncryptionCiphertext)
        data_to_encrypt_hash @include(if: $includeEncryptionDataToEncryptHash)
        decryption_code @include(if: $includeEncryptionDecryptionCode)
        decryption_params @include(if: $includeEncryptionDecryptionParams)
        method @include(if: $includeEncryptionMethod)
        accessControlConditions @include(if: $includeEncryptionAccessControlConditions) {
          chain
          comparator
          condition_index
          contract_address
          follower_address
          method
          raw_condition
          standard_contract_type
          token_id
          value
        }
      }

      file @include(if: $includeFile) {
        hash @include(if: $includeFileHash)
        last_modified @include(if: $includeFileLastModified)
        name
        size @include(if: $includeFileSize)
        type @include(if: $includeFileType)
      }

      chunks @include(if: $includeChunks) {
        cids @include(if: $includeChunksCids)
        iv @include(if: $includeChunksIv)
        total_size @include(if: $includeChunksTotalSize)
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
    $includeEncryptionMethod: Boolean! = true
    $includeEncryptionCiphertext: Boolean! = true
    $includeEncryptionDataToEncryptHash: Boolean! = true
    $includeEncryptionDecryptionCode: Boolean! = true
    $includeEncryptionDecryptionParams: Boolean! = true
    $includeEncryptionAccessControlConditions: Boolean! = true
    $includeFile: Boolean! = true
    $includeFileType: Boolean! = true
    $includeFileSize: Boolean! = true
    $includeFileLastModified: Boolean! = true
    $includeFileHash: Boolean! = true
    $includeChunks: Boolean! = true
    $includeChunksCids: Boolean! = true
    $includeChunksIv: Boolean! = true
    $includeChunksTotalSize: Boolean! = true
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
        ciphertext @include(if: $includeEncryptionCiphertext)
        data_to_encrypt_hash @include(if: $includeEncryptionDataToEncryptHash)
        decryption_code @include(if: $includeEncryptionDecryptionCode)
        decryption_params @include(if: $includeEncryptionDecryptionParams)
        method @include(if: $includeEncryptionMethod)
        accessControlConditions @include(if: $includeEncryptionAccessControlConditions) {
          chain
          comparator
          condition_index
          contract_address
          follower_address
          method
          raw_condition
          standard_contract_type
          token_id
          value
        }
      }

      file @include(if: $includeFile) {
        hash @include(if: $includeFileHash)
        last_modified @include(if: $includeFileLastModified)
        name
        size @include(if: $includeFileSize)
        type @include(if: $includeFileType)
      }

      chunks @include(if: $includeChunks) {
        cids @include(if: $includeChunksCids)
        iv @include(if: $includeChunksIv)
        total_size @include(if: $includeChunksTotalSize)
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
