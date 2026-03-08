import { graphql } from '../graphql';

/** Paginated list of followers with total count. */
export const GetFollowersDocument = graphql(`
  query GetFollowers(
    $where: follower_bool_exp
    $order_by: [follower_order_by!]
    $limit: Int
    $offset: Int
    $includeTimestamp: Boolean! = true
    $includeAddress: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeFollowerProfile: Boolean! = true
    $includeFollowerProfileName: Boolean! = true
    $includeFollowerProfileDescription: Boolean! = true
    $includeFollowerProfileTags: Boolean! = true
    $includeFollowerProfileLinks: Boolean! = true
    $includeFollowerProfileAvatar: Boolean! = true
    $includeFollowerProfileImage: Boolean! = true
    $includeFollowerProfileBackgroundImage: Boolean! = true
    $includeFollowerProfileFollowerCount: Boolean! = true
    $includeFollowerProfileFollowingCount: Boolean! = true
    $includeFollowedProfile: Boolean! = true
    $includeFollowedProfileName: Boolean! = true
    $includeFollowedProfileDescription: Boolean! = true
    $includeFollowedProfileTags: Boolean! = true
    $includeFollowedProfileLinks: Boolean! = true
    $includeFollowedProfileAvatar: Boolean! = true
    $includeFollowedProfileImage: Boolean! = true
    $includeFollowedProfileBackgroundImage: Boolean! = true
    $includeFollowedProfileFollowerCount: Boolean! = true
    $includeFollowedProfileFollowingCount: Boolean! = true
  ) {
    follower(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      follower_address
      followed_address
      timestamp @include(if: $includeTimestamp)
      address @include(if: $includeAddress)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      followerUniversalProfile @include(if: $includeFollowerProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFollowerProfileName) {
            value
          }
          description @include(if: $includeFollowerProfileDescription) {
            value
          }
          tags @include(if: $includeFollowerProfileTags) {
            value
          }
          links @include(if: $includeFollowerProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFollowerProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFollowerProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFollowerProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFollowerProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFollowerProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      followedUniversalProfile @include(if: $includeFollowedProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFollowedProfileName) {
            value
          }
          description @include(if: $includeFollowedProfileDescription) {
            value
          }
          tags @include(if: $includeFollowedProfileTags) {
            value
          }
          links @include(if: $includeFollowedProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFollowedProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFollowedProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFollowedProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFollowedProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFollowedProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
    }
    follower_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/** Real-time subscription variant. */
export const FollowerSubscriptionDocument = graphql(`
  subscription FollowerSubscription(
    $where: follower_bool_exp
    $order_by: [follower_order_by!]
    $limit: Int
    $includeTimestamp: Boolean! = true
    $includeAddress: Boolean! = true
    $includeBlockNumber: Boolean! = true
    $includeTransactionIndex: Boolean! = true
    $includeLogIndex: Boolean! = true
    $includeFollowerProfile: Boolean! = true
    $includeFollowerProfileName: Boolean! = true
    $includeFollowerProfileDescription: Boolean! = true
    $includeFollowerProfileTags: Boolean! = true
    $includeFollowerProfileLinks: Boolean! = true
    $includeFollowerProfileAvatar: Boolean! = true
    $includeFollowerProfileImage: Boolean! = true
    $includeFollowerProfileBackgroundImage: Boolean! = true
    $includeFollowerProfileFollowerCount: Boolean! = true
    $includeFollowerProfileFollowingCount: Boolean! = true
    $includeFollowedProfile: Boolean! = true
    $includeFollowedProfileName: Boolean! = true
    $includeFollowedProfileDescription: Boolean! = true
    $includeFollowedProfileTags: Boolean! = true
    $includeFollowedProfileLinks: Boolean! = true
    $includeFollowedProfileAvatar: Boolean! = true
    $includeFollowedProfileImage: Boolean! = true
    $includeFollowedProfileBackgroundImage: Boolean! = true
    $includeFollowedProfileFollowerCount: Boolean! = true
    $includeFollowedProfileFollowingCount: Boolean! = true
  ) {
    follower(where: $where, order_by: $order_by, limit: $limit) {
      id
      follower_address
      followed_address
      timestamp @include(if: $includeTimestamp)
      address @include(if: $includeAddress)
      block_number @include(if: $includeBlockNumber)
      transaction_index @include(if: $includeTransactionIndex)
      log_index @include(if: $includeLogIndex)
      followerUniversalProfile @include(if: $includeFollowerProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFollowerProfileName) {
            value
          }
          description @include(if: $includeFollowerProfileDescription) {
            value
          }
          tags @include(if: $includeFollowerProfileTags) {
            value
          }
          links @include(if: $includeFollowerProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFollowerProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFollowerProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFollowerProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFollowerProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFollowerProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
      followedUniversalProfile @include(if: $includeFollowedProfile) {
        address
        lsp3Profile {
          name @include(if: $includeFollowedProfileName) {
            value
          }
          description @include(if: $includeFollowedProfileDescription) {
            value
          }
          tags @include(if: $includeFollowedProfileTags) {
            value
          }
          links @include(if: $includeFollowedProfileLinks) {
            title
            url
          }
          avatar @include(if: $includeFollowedProfileAvatar) {
            url
            file_type
            verification_method
            verification_data
          }
          profileImage @include(if: $includeFollowedProfileImage) {
            url
            width
            height
            verification_method
            verification_data
          }
          backgroundImage @include(if: $includeFollowedProfileBackgroundImage) {
            url
            width
            height
            verification_method
            verification_data
          }
        }
        followedBy_aggregate @include(if: $includeFollowedProfileFollowerCount) {
          aggregate {
            count
          }
        }
        followed_aggregate @include(if: $includeFollowedProfileFollowingCount) {
          aggregate {
            count
          }
        }
      }
    }
  }
`);

/** Follower + following counts for a single address. */
export const GetFollowCountDocument = graphql(`
  query GetFollowCount($followerWhere: follower_bool_exp!, $followingWhere: follower_bool_exp!) {
    followerCount: follower_aggregate(where: $followerWhere) {
      aggregate {
        count
      }
    }
    followingCount: follower_aggregate(where: $followingWhere) {
      aggregate {
        count
      }
    }
  }
`);
