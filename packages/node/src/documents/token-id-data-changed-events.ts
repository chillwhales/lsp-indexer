import { graphql } from '../graphql';

/** Paginated list query with total count. */
export const GetTokenIdDataChangedEventsDocument = graphql(`
  query GetTokenIdDataChangedEvents(
    $where: token_id_data_changed_bool_exp
    $order_by: [token_id_data_changed_order_by!]
    $limit: Int
    $offset: Int
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTransactionIndex: Boolean! = true
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
    $includeNft: Boolean! = true
    $includeNftFormattedTokenId: Boolean! = true
    $includeNftName: Boolean! = true
    $includeNftDescription: Boolean! = true
    $includeNftCategory: Boolean! = true
    $includeNftIcons: Boolean! = true
    $includeNftImages: Boolean! = true
    $includeNftLinks: Boolean! = true
    $includeNftAttributes: Boolean! = true
  ) {
    token_id_data_changed(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      address
      data_key
      data_value
      token_id
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      log_index @include(if: $includeLogIndex)
      transaction_index @include(if: $includeTransactionIndex)
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
      nft @include(if: $includeNft) {
        address
        token_id
        formatted_token_id @include(if: $includeNftFormattedTokenId)
        is_burned
        is_minted
        lsp4Metadata {
          name @include(if: $includeNftName) {
            value
          }
          description @include(if: $includeNftDescription) {
            value
          }
          category @include(if: $includeNftCategory) {
            value
          }
          icon @include(if: $includeNftIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeNftImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeNftLinks) {
            title
            url
          }
          attributes @include(if: $includeNftAttributes) {
            key
            value
            type
          }
        }
        lsp4MetadataBaseUri {
          name @include(if: $includeNftName) {
            value
          }
          description @include(if: $includeNftDescription) {
            value
          }
          category @include(if: $includeNftCategory) {
            value
          }
          icon @include(if: $includeNftIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeNftImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeNftLinks) {
            title
            url
          }
          attributes @include(if: $includeNftAttributes) {
            key
            value
            type
          }
        }
      }
    }
    token_id_data_changed_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetTokenIdDataChangedEventsDocument. */
export const TokenIdDataChangedEventSubscriptionDocument = graphql(`
  subscription TokenIdDataChangedEventSubscription(
    $where: token_id_data_changed_bool_exp
    $order_by: [token_id_data_changed_order_by!]
    $limit: Int
    $includeBlockNumber: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeTransactionIndex: Boolean! = true
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
    $includeNft: Boolean! = true
    $includeNftFormattedTokenId: Boolean! = true
    $includeNftName: Boolean! = true
    $includeNftDescription: Boolean! = true
    $includeNftCategory: Boolean! = true
    $includeNftIcons: Boolean! = true
    $includeNftImages: Boolean! = true
    $includeNftLinks: Boolean! = true
    $includeNftAttributes: Boolean! = true
  ) {
    token_id_data_changed(where: $where, order_by: $order_by, limit: $limit) {
      address
      data_key
      data_value
      token_id
      block_number @include(if: $includeBlockNumber)
      timestamp @include(if: $includeTimestamp)
      log_index @include(if: $includeLogIndex)
      transaction_index @include(if: $includeTransactionIndex)
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
      nft @include(if: $includeNft) {
        address
        token_id
        formatted_token_id @include(if: $includeNftFormattedTokenId)
        is_burned
        is_minted
        lsp4Metadata {
          name @include(if: $includeNftName) {
            value
          }
          description @include(if: $includeNftDescription) {
            value
          }
          category @include(if: $includeNftCategory) {
            value
          }
          icon @include(if: $includeNftIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeNftImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeNftLinks) {
            title
            url
          }
          attributes @include(if: $includeNftAttributes) {
            key
            value
            type
          }
        }
        lsp4MetadataBaseUri {
          name @include(if: $includeNftName) {
            value
          }
          description @include(if: $includeNftDescription) {
            value
          }
          category @include(if: $includeNftCategory) {
            value
          }
          icon @include(if: $includeNftIcons) {
            url
            width
            height
            verification_method
            verification_data
          }
          images @include(if: $includeNftImages) {
            url
            width
            height
            image_index
            verification_method
            verification_data
          }
          links @include(if: $includeNftLinks) {
            title
            url
          }
          attributes @include(if: $includeNftAttributes) {
            key
            value
            type
          }
        }
      }
    }
  }
`);
