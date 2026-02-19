import { graphql } from '../graphql';

/**
 * GraphQL document for fetching a single Universal Profile.
 *
 * Variables:
 * - `$where` — The service layer builds the Hasura bool_exp (e.g., `{ address: { _ilike: "0x..." } }` for case-insensitive matching)
 * - `$include*` — Boolean flags controlling nested data, all default to `true`
 *
 * Uses `@include(if:)` directives so omitted nested data is never sent over the wire.
 */
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
  ) {
    universal_profile(where: $where, limit: 1) {
      id
      address
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

/**
 * GraphQL document for fetching a paginated list of Universal Profiles with total count.
 *
 * Used by both `useProfiles` (offset-based pagination) and `useInfiniteProfiles`
 * (infinite scroll) — the difference is how the hook manages pagination, not the document.
 *
 * Variables:
 * - `$where` — Filter conditions (built by service layer from flat ProfileFilter)
 * - `$order_by` — Sort order (built by service layer from ProfileSort)
 * - `$limit` / `$offset` — Pagination
 * - `$include*` — Boolean flags controlling nested data, all default to `true`
 *
 * Includes `universal_profile_aggregate` for total count (used for "X of Y results" UI).
 */
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
  ) {
    universal_profile(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      address
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
