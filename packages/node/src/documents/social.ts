import { graphql } from '../graphql';

/**
 * GraphQL document for fetching followers of an address (who follows this address).
 *
 * Queries the `follower` table filtered by `followed_address` — each row represents
 * an active follow relationship where the target is the specified address.
 *
 * Includes `follower_aggregate` for total count (pagination UI).
 */
export const GetFollowersDocument = graphql(`
  query GetFollowers(
    $where: follower_bool_exp
    $order_by: [follower_order_by!]
    $limit: Int
    $offset: Int
  ) {
    follower(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      follower_address
      followed_address
    }
    follower_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`);

/**
 * GraphQL document for fetching follow counts (both follower and following) for an address.
 *
 * Uses GraphQL aliases to query `follower_aggregate` twice:
 * - `followerCount`: rows where the address is `followed_address` (people following this address)
 * - `followingCount`: rows where the address is `follower_address` (people this address follows)
 */
export const GetFollowCountDocument = graphql(`
  query GetFollowCount($followerWhere: follower_bool_exp, $followingWhere: follower_bool_exp) {
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
