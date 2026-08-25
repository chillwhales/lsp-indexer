import { graphql } from '../graphql';

export const V3BlocksDocument = graphql(`
  query V3Blocks($where: block_bool_exp, $orderBy: [block_order_by!], $limit: Int, $offset: Int) {
    items: block(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3BlockFields
    }
    total: block_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3BlocksSubscriptionDocument = graphql(`
  subscription V3BlocksSubscription(
    $where: block_bool_exp
    $orderBy: [block_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: block(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3BlockFields
    }
  }
`);

export const V3EventsDocument = graphql(`
  query V3Events(
    $where: event_fact_bool_exp
    $orderBy: [event_fact_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: event_fact(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3EventFields
    }
    total: event_fact_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3EventsSubscriptionDocument = graphql(`
  subscription V3EventsSubscription(
    $where: event_fact_bool_exp
    $orderBy: [event_fact_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: event_fact(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3EventFields
    }
  }
`);

export const V3UniversalProfilesDocument = graphql(`
  query V3UniversalProfiles(
    $where: universal_profile_bool_exp
    $orderBy: [universal_profile_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: universal_profile(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ProfileFields
    }
    total: universal_profile_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3UniversalProfilesSubscriptionDocument = graphql(`
  subscription V3UniversalProfilesSubscription(
    $where: universal_profile_bool_exp
    $orderBy: [universal_profile_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: universal_profile(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ProfileFields
    }
  }
`);

export const V3DigitalAssetsDocument = graphql(`
  query V3DigitalAssets(
    $where: digital_asset_bool_exp
    $orderBy: [digital_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: digital_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3DigitalAssetFields
    }
    total: digital_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3DigitalAssetsSubscriptionDocument = graphql(`
  subscription V3DigitalAssetsSubscription(
    $where: digital_asset_bool_exp
    $orderBy: [digital_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: digital_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3DigitalAssetFields
    }
  }
`);

export const V3NftsDocument = graphql(`
  query V3Nfts($where: nft_bool_exp, $orderBy: [nft_order_by!], $limit: Int, $offset: Int) {
    items: nft(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3NftFields
    }
    total: nft_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3NftsSubscriptionDocument = graphql(`
  subscription V3NftsSubscription(
    $where: nft_bool_exp
    $orderBy: [nft_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: nft(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3NftFields
    }
  }
`);

export const V3OwnedAssetsDocument = graphql(`
  query V3OwnedAssets(
    $where: owned_asset_bool_exp
    $orderBy: [owned_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: owned_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3OwnedAssetFields
    }
    total: owned_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3OwnedAssetsSubscriptionDocument = graphql(`
  subscription V3OwnedAssetsSubscription(
    $where: owned_asset_bool_exp
    $orderBy: [owned_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: owned_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3OwnedAssetFields
    }
  }
`);

export const V3OwnedTokensDocument = graphql(`
  query V3OwnedTokens(
    $where: owned_token_bool_exp
    $orderBy: [owned_token_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: owned_token(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3OwnedTokenFields
    }
    total: owned_token_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3OwnedTokensSubscriptionDocument = graphql(`
  subscription V3OwnedTokensSubscription(
    $where: owned_token_bool_exp
    $orderBy: [owned_token_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: owned_token(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3OwnedTokenFields
    }
  }
`);

export const V3FollowersDocument = graphql(`
  query V3Followers(
    $where: follower_bool_exp
    $orderBy: [follower_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: follower(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3FollowerFields
    }
    total: follower_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3FollowersSubscriptionDocument = graphql(`
  subscription V3FollowersSubscription(
    $where: follower_bool_exp
    $orderBy: [follower_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: follower(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3FollowerFields
    }
  }
`);

export const V3CreatorsDocument = graphql(`
  query V3Creators(
    $where: lsp4_creator_bool_exp
    $orderBy: [lsp4_creator_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp4_creator(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3CreatorFields
    }
    total: lsp4_creator_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3CreatorsSubscriptionDocument = graphql(`
  subscription V3CreatorsSubscription(
    $where: lsp4_creator_bool_exp
    $orderBy: [lsp4_creator_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp4_creator(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3CreatorFields
    }
  }
`);

export const V3IssuedAssetsDocument = graphql(`
  query V3IssuedAssets(
    $where: lsp12_issued_asset_bool_exp
    $orderBy: [lsp12_issued_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp12_issued_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3IssuedAssetFields
    }
    total: lsp12_issued_asset_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3IssuedAssetsSubscriptionDocument = graphql(`
  subscription V3IssuedAssetsSubscription(
    $where: lsp12_issued_asset_bool_exp
    $orderBy: [lsp12_issued_asset_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp12_issued_asset(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3IssuedAssetFields
    }
  }
`);

export const V3ControllersDocument = graphql(`
  query V3Controllers(
    $where: lsp6_controller_bool_exp
    $orderBy: [lsp6_controller_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp6_controller(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ControllerFields
    }
    total: lsp6_controller_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3ControllersSubscriptionDocument = graphql(`
  subscription V3ControllersSubscription(
    $where: lsp6_controller_bool_exp
    $orderBy: [lsp6_controller_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: lsp6_controller(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ControllerFields
    }
  }
`);

export const V3ChillwhalesNftsDocument = graphql(`
  query V3ChillwhalesNfts(
    $where: chillwhales_nft_bool_exp
    $orderBy: [chillwhales_nft_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: chillwhales_nft(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ChillwhalesNftFields
    }
    total: chillwhales_nft_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3ChillwhalesNftsSubscriptionDocument = graphql(`
  subscription V3ChillwhalesNftsSubscription(
    $where: chillwhales_nft_bool_exp
    $orderBy: [chillwhales_nft_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: chillwhales_nft(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3ChillwhalesNftFields
    }
  }
`);

export const V3DataValuesDocument = graphql(`
  query V3DataValues(
    $where: data_value_bool_exp
    $orderBy: [data_value_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: data_value(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3DataValueFields
    }
    total: data_value_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3DataValuesSubscriptionDocument = graphql(`
  subscription V3DataValuesSubscription(
    $where: data_value_bool_exp
    $orderBy: [data_value_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: data_value(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3DataValueFields
    }
  }
`);

export const V3MetadataRevisionsDocument = graphql(`
  query V3MetadataRevisions(
    $where: metadata_revision_bool_exp
    $orderBy: [metadata_revision_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: metadata_revision(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3MetadataRevisionFields
    }
    total: metadata_revision_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3MetadataRevisionsSubscriptionDocument = graphql(`
  subscription V3MetadataRevisionsSubscription(
    $where: metadata_revision_bool_exp
    $orderBy: [metadata_revision_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: metadata_revision(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3MetadataRevisionFields
    }
  }
`);

export const V3IndexedHeadsDocument = graphql(`
  query V3IndexedHeads(
    $where: indexed_head_bool_exp
    $orderBy: [indexed_head_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: indexed_head(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3IndexedHeadFields
    }
    total: indexed_head_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

export const V3IndexedHeadsSubscriptionDocument = graphql(`
  subscription V3IndexedHeadsSubscription(
    $where: indexed_head_bool_exp
    $orderBy: [indexed_head_order_by!]
    $limit: Int
    $offset: Int
  ) {
    items: indexed_head(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
      ...V3IndexedHeadFields
    }
  }
`);
