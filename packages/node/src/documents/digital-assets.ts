import { graphql } from '../graphql';

/** Single Digital Asset query. */
export const GetDigitalAssetDocument = graphql(`
  query GetDigitalAsset(
    $where: digital_asset_bool_exp!
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
  ) {
    digital_asset(where: $where, limit: 1) {
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
  }
`);

/** Paginated list of Digital Assets with total count. */
export const GetDigitalAssetsDocument = graphql(`
  query GetDigitalAssets(
    $where: digital_asset_bool_exp
    $order_by: [digital_asset_order_by!]
    $limit: Int
    $offset: Int
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
  ) {
    digital_asset(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
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
    digital_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetDigitalAssetsDocument. */
export const DigitalAssetSubscriptionDocument = graphql(`
  subscription DigitalAssetSubscription(
    $where: digital_asset_bool_exp
    $order_by: [digital_asset_order_by!]
    $limit: Int
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
  ) {
    digital_asset(where: $where, order_by: $order_by, limit: $limit) {
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
  }
`);
