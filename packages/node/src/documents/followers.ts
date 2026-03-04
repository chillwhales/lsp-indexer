import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a paginated list of followers with total count.
 *
 * Used by `useFollowers`, `useInfiniteFollowers`, `useFollowing`, `useInfiniteFollowing`,
 * and `useIsFollowing` (with `limit: 1`) — the difference is how the service layer
 * builds the `$where` filter and how the hook manages pagination.
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp
 * - `$order_by` — Sort order (built by service layer from FollowerSort)
 * - `$limit` / `$offset` — Pagination
 * - `$includeTimestamp` / `$includeAddress` / `$includeBlockNumber` / `$includeTransactionIndex` / `$includeLogIndex` — Scalar include toggles
 * - `$includeFollowerProfile*` — Boolean flags for follower's Universal Profile sub-includes
 * - `$includeFollowedProfile*` — Boolean flags for followed's Universal Profile sub-includes
 *
 * All include variables default to `true` (inverted default — omit `include` = fetch everything).
 *
 * Profile sub-fields match what `parseProfile` expects: name, description, tags, links,
 * avatar (with file_type), profileImage, backgroundImage, followedBy_aggregate, followed_aggregate.
 */
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

/**
 * GraphQL document for fetching follow counts (follower + following) for an address.
 *
 * Uses two aliased `follower_aggregate` queries:
 * - `followerCount`: count where `followed_address = address` (how many follow this address)
 * - `followingCount`: count where `follower_address = address` (how many this address follows)
 *
 * The service layer passes:
 * - `$followerWhere: { followed_address: { _ilike: address } }`
 * - `$followingWhere: { follower_address: { _ilike: address } }`
 */
/**
 * GraphQL subscription document for live Follower data.
 *
 * Same field selection as GetFollowersDocument but as a subscription:
 * - No $offset (subscriptions are live streams, not paginated)
 * - No follower_aggregate (no total count in subscriptions)
 *
 * 26 variables: 3 pagination (where, order_by, limit) + 23 include toggles
 * (5 scalar + 9 follower profile + 9 followed profile).
 */
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
