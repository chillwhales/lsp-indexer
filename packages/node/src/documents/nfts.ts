import { graphql } from '../graphql';

/** Single NFT query. */
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
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeCollectionTimestamp: Boolean! = true
    $includeCollectionBlockNumber: Boolean! = true
    $includeCollectionTransactionIndex: Boolean! = true
    $includeCollectionLogIndex: Boolean! = true
    $includeHolderName: Boolean! = true
    $includeHolderDescription: Boolean! = true
    $includeHolderTags: Boolean! = true
    $includeHolderLinks: Boolean! = true
    $includeHolderAvatar: Boolean! = true
    $includeHolderImage: Boolean! = true
    $includeHolderBackgroundImage: Boolean! = true
    $includeHolderFollowerCount: Boolean! = true
    $includeHolderFollowingCount: Boolean! = true
    $includeHolderTimestamp: Boolean! = true
    $includeHolderBlockNumber: Boolean! = true
    $includeHolderTransactionIndex: Boolean! = true
    $includeHolderLogIndex: Boolean! = true
    $includeScore: Boolean! = false
    $includeRank: Boolean! = false
    $includeChillClaimed: Boolean! = false
    $includeOrbsClaimed: Boolean! = false
    $includeLevel: Boolean! = false
    $includeCooldownExpiry: Boolean! = false
    $includeFaction: Boolean! = false
  ) {
    nft(where: $where, limit: 1) {
      id
      address
      token_id
      is_burned
      is_minted
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      formatted_token_id @include(if: $includeFormattedTokenId)
      chillClaimed @include(if: $includeChillClaimed) {
        value
      }
      orbsClaimed @include(if: $includeOrbsClaimed) {
        value
      }
      level @include(if: $includeLevel) {
        value
      }
      cooldownExpiry @include(if: $includeCooldownExpiry) {
        value
      }
      faction @include(if: $includeFaction) {
        value
      }
      digitalAsset @include(if: $includeCollection) {
        id
        address
        timestamp @include(if: $includeCollectionTimestamp)
        block_number @include(if: $includeCollectionBlockNumber)
        transaction_index @include(if: $includeCollectionTransactionIndex)
        log_index @include(if: $includeCollectionLogIndex)
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
            image_index
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
        timestamp @include(if: $includeHolderTimestamp)
        block_number @include(if: $includeHolderBlockNumber)
        transaction_index @include(if: $includeHolderTransactionIndex)
        log_index @include(if: $includeHolderLogIndex)
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
        }
      }
    }
  }
`);

/** Paginated list of NFTs with total count. */
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
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeCollectionTimestamp: Boolean! = true
    $includeCollectionBlockNumber: Boolean! = true
    $includeCollectionTransactionIndex: Boolean! = true
    $includeCollectionLogIndex: Boolean! = true
    $includeHolderName: Boolean! = true
    $includeHolderDescription: Boolean! = true
    $includeHolderTags: Boolean! = true
    $includeHolderLinks: Boolean! = true
    $includeHolderAvatar: Boolean! = true
    $includeHolderImage: Boolean! = true
    $includeHolderBackgroundImage: Boolean! = true
    $includeHolderFollowerCount: Boolean! = true
    $includeHolderFollowingCount: Boolean! = true
    $includeHolderTimestamp: Boolean! = true
    $includeHolderBlockNumber: Boolean! = true
    $includeHolderTransactionIndex: Boolean! = true
    $includeHolderLogIndex: Boolean! = true
    $includeScore: Boolean! = false
    $includeRank: Boolean! = false
    $includeChillClaimed: Boolean! = false
    $includeOrbsClaimed: Boolean! = false
    $includeLevel: Boolean! = false
    $includeCooldownExpiry: Boolean! = false
    $includeFaction: Boolean! = false
  ) {
    nft(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      token_id
      is_burned
      is_minted
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      formatted_token_id @include(if: $includeFormattedTokenId)
      chillClaimed @include(if: $includeChillClaimed) {
        value
      }
      orbsClaimed @include(if: $includeOrbsClaimed) {
        value
      }
      level @include(if: $includeLevel) {
        value
      }
      cooldownExpiry @include(if: $includeCooldownExpiry) {
        value
      }
      faction @include(if: $includeFaction) {
        value
      }
      digitalAsset @include(if: $includeCollection) {
        id
        address
        timestamp @include(if: $includeCollectionTimestamp)
        block_number @include(if: $includeCollectionBlockNumber)
        transaction_index @include(if: $includeCollectionTransactionIndex)
        log_index @include(if: $includeCollectionLogIndex)
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
            image_index
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
        timestamp @include(if: $includeHolderTimestamp)
        block_number @include(if: $includeHolderBlockNumber)
        transaction_index @include(if: $includeHolderTransactionIndex)
        log_index @include(if: $includeHolderLogIndex)
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
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

/**
 * Subscription document for NFTs. Mirrors GetNftsDocument field selections.
 * Differences: subscription keyword, no $offset, no _aggregate.
 */
export const NftSubscriptionDocument = graphql(`
  subscription NftSubscription(
    $where: nft_bool_exp
    $order_by: [nft_order_by!]
    $limit: Int
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
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
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
    $includeCollectionTimestamp: Boolean! = true
    $includeCollectionBlockNumber: Boolean! = true
    $includeCollectionTransactionIndex: Boolean! = true
    $includeCollectionLogIndex: Boolean! = true
    $includeHolderName: Boolean! = true
    $includeHolderDescription: Boolean! = true
    $includeHolderTags: Boolean! = true
    $includeHolderLinks: Boolean! = true
    $includeHolderAvatar: Boolean! = true
    $includeHolderImage: Boolean! = true
    $includeHolderBackgroundImage: Boolean! = true
    $includeHolderFollowerCount: Boolean! = true
    $includeHolderFollowingCount: Boolean! = true
    $includeHolderTimestamp: Boolean! = true
    $includeHolderBlockNumber: Boolean! = true
    $includeHolderTransactionIndex: Boolean! = true
    $includeHolderLogIndex: Boolean! = true
    $includeScore: Boolean! = false
    $includeRank: Boolean! = false
    $includeChillClaimed: Boolean! = false
    $includeOrbsClaimed: Boolean! = false
    $includeLevel: Boolean! = false
    $includeCooldownExpiry: Boolean! = false
    $includeFaction: Boolean! = false
  ) {
    nft(where: $where, order_by: $order_by, limit: $limit) {
      id
      address
      token_id
      is_burned
      is_minted
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      formatted_token_id @include(if: $includeFormattedTokenId)
      chillClaimed @include(if: $includeChillClaimed) {
        value
      }
      orbsClaimed @include(if: $includeOrbsClaimed) {
        value
      }
      level @include(if: $includeLevel) {
        value
      }
      cooldownExpiry @include(if: $includeCooldownExpiry) {
        value
      }
      faction @include(if: $includeFaction) {
        value
      }
      digitalAsset @include(if: $includeCollection) {
        id
        address
        timestamp @include(if: $includeCollectionTimestamp)
        block_number @include(if: $includeCollectionBlockNumber)
        transaction_index @include(if: $includeCollectionTransactionIndex)
        log_index @include(if: $includeCollectionLogIndex)
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
            image_index
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
        timestamp @include(if: $includeHolderTimestamp)
        block_number @include(if: $includeHolderBlockNumber)
        transaction_index @include(if: $includeHolderTransactionIndex)
        log_index @include(if: $includeHolderLogIndex)
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
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
        score @include(if: $includeScore) {
          value
        }
        rank @include(if: $includeRank) {
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
          score
          rarity
        }
      }
    }
  }
`);
