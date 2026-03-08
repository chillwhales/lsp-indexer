import { graphql } from '../graphql';

/** Single item query. */
export const GetOwnedTokenDocument = graphql(`
  query GetOwnedToken(
    $where: owned_token_bool_exp!
    $includeBlock: Boolean! = true
    $includeTimestamp: Boolean! = true
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
    $includeNftFormattedTokenId: Boolean! = true
    $includeNftName: Boolean! = true
    $includeNftDescription: Boolean! = true
    $includeNftCategory: Boolean! = true
    $includeNftIcons: Boolean! = true
    $includeNftImages: Boolean! = true
    $includeNftLinks: Boolean! = true
    $includeNftAttributes: Boolean! = true
    $includeOwnedAsset: Boolean! = true
    $includeOwnedAssetBalance: Boolean! = true
    $includeOwnedAssetBlock: Boolean! = true
    $includeOwnedAssetTimestamp: Boolean! = true
    $includeHolder: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
  ) {
    owned_token(where: $where, limit: 1) {
      id
      address
      owner
      token_id
      block @include(if: $includeBlock)
      timestamp @include(if: $includeTimestamp)
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
      ownedAsset @include(if: $includeOwnedAsset) {
        id
        address
        owner
        balance @include(if: $includeOwnedAssetBalance)
        block @include(if: $includeOwnedAssetBlock)
        timestamp @include(if: $includeOwnedAssetTimestamp)
      }
      universalProfile @include(if: $includeHolder) {
        address
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
    }
  }
`);

/** Paginated list of Owned Tokens with total count. */
export const GetOwnedTokensDocument = graphql(`
  query GetOwnedTokens(
    $where: owned_token_bool_exp
    $order_by: [owned_token_order_by!]
    $limit: Int
    $offset: Int
    $includeBlock: Boolean! = true
    $includeTimestamp: Boolean! = true
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
    $includeNftFormattedTokenId: Boolean! = true
    $includeNftName: Boolean! = true
    $includeNftDescription: Boolean! = true
    $includeNftCategory: Boolean! = true
    $includeNftIcons: Boolean! = true
    $includeNftImages: Boolean! = true
    $includeNftLinks: Boolean! = true
    $includeNftAttributes: Boolean! = true
    $includeOwnedAsset: Boolean! = true
    $includeOwnedAssetBalance: Boolean! = true
    $includeOwnedAssetBlock: Boolean! = true
    $includeOwnedAssetTimestamp: Boolean! = true
    $includeHolder: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
  ) {
    owned_token(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      owner
      token_id
      block @include(if: $includeBlock)
      timestamp @include(if: $includeTimestamp)
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
      ownedAsset @include(if: $includeOwnedAsset) {
        id
        address
        owner
        balance @include(if: $includeOwnedAssetBalance)
        block @include(if: $includeOwnedAssetBlock)
        timestamp @include(if: $includeOwnedAssetTimestamp)
      }
      universalProfile @include(if: $includeHolder) {
        address
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
    }
    owned_token_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Real-time subscription variant. */
export const OwnedTokenSubscriptionDocument = graphql(`
  subscription OwnedTokenSubscription(
    $where: owned_token_bool_exp
    $order_by: [owned_token_order_by!]
    $limit: Int
    $includeBlock: Boolean! = true
    $includeTimestamp: Boolean! = true
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
    $includeNftFormattedTokenId: Boolean! = true
    $includeNftName: Boolean! = true
    $includeNftDescription: Boolean! = true
    $includeNftCategory: Boolean! = true
    $includeNftIcons: Boolean! = true
    $includeNftImages: Boolean! = true
    $includeNftLinks: Boolean! = true
    $includeNftAttributes: Boolean! = true
    $includeOwnedAsset: Boolean! = true
    $includeOwnedAssetBalance: Boolean! = true
    $includeOwnedAssetBlock: Boolean! = true
    $includeOwnedAssetTimestamp: Boolean! = true
    $includeHolder: Boolean! = true
    $includeProfileName: Boolean! = true
    $includeProfileDescription: Boolean! = true
    $includeProfileTags: Boolean! = true
    $includeProfileLinks: Boolean! = true
    $includeProfileAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeProfileBackgroundImage: Boolean! = true
    $includeProfileFollowerCount: Boolean! = true
    $includeProfileFollowingCount: Boolean! = true
  ) {
    owned_token(where: $where, order_by: $order_by, limit: $limit) {
      id
      address
      owner
      token_id
      block @include(if: $includeBlock)
      timestamp @include(if: $includeTimestamp)
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
      ownedAsset @include(if: $includeOwnedAsset) {
        id
        address
        owner
        balance @include(if: $includeOwnedAssetBalance)
        block @include(if: $includeOwnedAssetBlock)
        timestamp @include(if: $includeOwnedAssetTimestamp)
      }
      universalProfile @include(if: $includeHolder) {
        address
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
    }
  }
`);
