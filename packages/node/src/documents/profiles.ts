import { graphql } from '../graphql';

/** Single Universal Profile query. */
export const GetProfileDocument = graphql(`
  query GetProfile(
    $where: universal_profile_bool_exp!
    $includeName: Boolean! = true
    $includeDescription: Boolean! = true
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
    $includeFollowerCount: Boolean! = true
    $includeFollowingCount: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
  ) {
    universal_profile(where: $where, limit: 1) {
      id
      address
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      lsp3Profile {
        name @include(if: $includeName) {
          value
        }
        description @include(if: $includeDescription) {
          value
        }
        tags @include(if: $includeTags) {
          value
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        avatar @include(if: $includeAvatar) {
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
        backgroundImage @include(if: $includeBackgroundImage) {
          url
          width
          height
          verification_method
          verification_data
        }
      }
      followedBy_aggregate @include(if: $includeFollowerCount) {
        aggregate {
          count
        }
      }
      followed_aggregate @include(if: $includeFollowingCount) {
        aggregate {
          count
        }
      }
    }
  }
`);

/** Paginated list of Universal Profiles with total count. */
export const GetProfilesDocument = graphql(`
  query GetProfiles(
    $where: universal_profile_bool_exp
    $order_by: [universal_profile_order_by!]
    $limit: Int
    $offset: Int
    $includeName: Boolean! = true
    $includeDescription: Boolean! = true
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
    $includeFollowerCount: Boolean! = true
    $includeFollowingCount: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
  ) {
    universal_profile(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      lsp3Profile {
        name @include(if: $includeName) {
          value
        }
        description @include(if: $includeDescription) {
          value
        }
        tags @include(if: $includeTags) {
          value
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        avatar @include(if: $includeAvatar) {
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
        backgroundImage @include(if: $includeBackgroundImage) {
          url
          width
          height
          verification_method
          verification_data
        }
      }
      followedBy_aggregate @include(if: $includeFollowerCount) {
        aggregate {
          count
        }
      }
      followed_aggregate @include(if: $includeFollowingCount) {
        aggregate {
          count
        }
      }
    }
    universal_profile_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Subscription variant of GetProfilesDocument. */
export const ProfileSubscriptionDocument = graphql(`
  subscription ProfileSubscription(
    $where: universal_profile_bool_exp
    $order_by: [universal_profile_order_by!]
    $limit: Int
    $includeName: Boolean! = true
    $includeDescription: Boolean! = true
    $includeTags: Boolean! = true
    $includeLinks: Boolean! = true
    $includeAvatar: Boolean! = true
    $includeProfileImage: Boolean! = true
    $includeBackgroundImage: Boolean! = true
    $includeFollowerCount: Boolean! = true
    $includeFollowingCount: Boolean! = true
    $includeTimestamp: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
  ) {
    universal_profile(where: $where, order_by: $order_by, limit: $limit) {
      id
      address
      timestamp @include(if: $includeTimestamp)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      lsp3Profile {
        name @include(if: $includeName) {
          value
        }
        description @include(if: $includeDescription) {
          value
        }
        tags @include(if: $includeTags) {
          value
        }
        links @include(if: $includeLinks) {
          title
          url
        }
        avatar @include(if: $includeAvatar) {
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
        backgroundImage @include(if: $includeBackgroundImage) {
          url
          width
          height
          verification_method
          verification_data
        }
      }
      followedBy_aggregate @include(if: $includeFollowerCount) {
        aggregate {
          count
        }
      }
      followed_aggregate @include(if: $includeFollowingCount) {
        aggregate {
          count
        }
      }
    }
  }
`);
