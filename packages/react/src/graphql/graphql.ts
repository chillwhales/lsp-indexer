/* eslint-disable */
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  numeric: { input: string; output: string; }
};

export type Query = {
  __typename?: 'Query';
  /** Fetch universal profiles */
  universal_profile: Array<Universal_Profile>;
  /** Aggregate universal profiles */
  universal_profile_aggregate: Universal_Profile_Aggregate;
};


export type QueryUniversal_ProfileArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Universal_Profile_Order_By>>;
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
};


export type QueryUniversal_Profile_AggregateArgs = {
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** String comparison operators */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  _nlike?: InputMaybe<Scalars['String']['input']>;
};

export type Follow_Aggregate = {
  __typename?: 'follow_aggregate';
  aggregate?: Maybe<Follow_Aggregate_Fields>;
};

export type Follow_Aggregate_Fields = {
  __typename?: 'follow_aggregate_fields';
  count: Scalars['Int']['output'];
};

/** Aggregate ordering for follow relations */
export type Follow_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
};

/** Boolean expression to filter follows */
export type Follow_Bool_Exp = {
  _and?: InputMaybe<Array<Follow_Bool_Exp>>;
  _not?: InputMaybe<Follow_Bool_Exp>;
  _or?: InputMaybe<Array<Follow_Bool_Exp>>;
  followed_address?: InputMaybe<String_Comparison_Exp>;
  follower_address?: InputMaybe<String_Comparison_Exp>;
};

export type Lsp3_Profile = {
  __typename?: 'lsp3_profile';
  avatar: Array<Lsp3_Profile_Asset>;
  backgroundImage: Array<Lsp3_Profile_Background_Image>;
  description?: Maybe<Lsp3_Profile_Description>;
  id: Scalars['String']['output'];
  links: Array<Lsp3_Profile_Link>;
  name?: Maybe<Lsp3_Profile_Name>;
  profileImage: Array<Lsp3_Profile_Image>;
  tags: Array<Lsp3_Profile_Tag>;
};

export type Lsp3_Profile_Asset = {
  __typename?: 'lsp3_profile_asset';
  file_type?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  verification_data?: Maybe<Scalars['String']['output']>;
  verification_method?: Maybe<Scalars['String']['output']>;
  verification_source?: Maybe<Scalars['String']['output']>;
};

export type Lsp3_Profile_Background_Image = {
  __typename?: 'lsp3_profile_background_image';
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  verification_data?: Maybe<Scalars['String']['output']>;
  verification_method?: Maybe<Scalars['String']['output']>;
  verification_source?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

/** Boolean expression to filter LSP3 profiles */
export type Lsp3_Profile_Bool_Exp = {
  _and?: InputMaybe<Array<Lsp3_Profile_Bool_Exp>>;
  _not?: InputMaybe<Lsp3_Profile_Bool_Exp>;
  _or?: InputMaybe<Array<Lsp3_Profile_Bool_Exp>>;
  name?: InputMaybe<Lsp3_Profile_Name_Bool_Exp>;
};

export type Lsp3_Profile_Description = {
  __typename?: 'lsp3_profile_description';
  id: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

export type Lsp3_Profile_Image = {
  __typename?: 'lsp3_profile_image';
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
  verification_data?: Maybe<Scalars['String']['output']>;
  verification_method?: Maybe<Scalars['String']['output']>;
  verification_source?: Maybe<Scalars['String']['output']>;
  width?: Maybe<Scalars['Int']['output']>;
};

export type Lsp3_Profile_Link = {
  __typename?: 'lsp3_profile_link';
  id: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type Lsp3_Profile_Name = {
  __typename?: 'lsp3_profile_name';
  id: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

/** Boolean expression to filter LSP3 profile names */
export type Lsp3_Profile_Name_Bool_Exp = {
  _and?: InputMaybe<Array<Lsp3_Profile_Name_Bool_Exp>>;
  _not?: InputMaybe<Lsp3_Profile_Name_Bool_Exp>;
  _or?: InputMaybe<Array<Lsp3_Profile_Name_Bool_Exp>>;
  value?: InputMaybe<String_Comparison_Exp>;
};

/** Ordering for LSP3 profile names */
export type Lsp3_Profile_Name_Order_By = {
  value?: InputMaybe<Order_By>;
};

/** Ordering for LSP3 profiles */
export type Lsp3_Profile_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Lsp3_Profile_Name_Order_By>;
};

export type Lsp3_Profile_Tag = {
  __typename?: 'lsp3_profile_tag';
  id: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

/** Hasura column ordering options */
export type Order_By =
  | 'asc'
  | 'asc_nulls_first'
  | 'asc_nulls_last'
  | 'desc'
  | 'desc_nulls_first'
  | 'desc_nulls_last';

/** Boolean expression to filter owned assets */
export type Owned_Asset_Bool_Exp = {
  _and?: InputMaybe<Array<Owned_Asset_Bool_Exp>>;
  _not?: InputMaybe<Owned_Asset_Bool_Exp>;
  _or?: InputMaybe<Array<Owned_Asset_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  balance?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to filter owned tokens */
export type Owned_Token_Bool_Exp = {
  _and?: InputMaybe<Array<Owned_Token_Bool_Exp>>;
  _not?: InputMaybe<Owned_Token_Bool_Exp>;
  _or?: InputMaybe<Array<Owned_Token_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

export type Universal_Profile = {
  __typename?: 'universal_profile';
  address: Scalars['String']['output'];
  followedBy_aggregate: Follow_Aggregate;
  followed_aggregate: Follow_Aggregate;
  id: Scalars['String']['output'];
  lsp3Profile?: Maybe<Lsp3_Profile>;
};

export type Universal_Profile_Aggregate = {
  __typename?: 'universal_profile_aggregate';
  aggregate?: Maybe<Universal_Profile_Aggregate_Fields>;
};

export type Universal_Profile_Aggregate_Fields = {
  __typename?: 'universal_profile_aggregate_fields';
  count: Scalars['Int']['output'];
};

/** Boolean expression to filter universal profiles */
export type Universal_Profile_Bool_Exp = {
  _and?: InputMaybe<Array<Universal_Profile_Bool_Exp>>;
  _not?: InputMaybe<Universal_Profile_Bool_Exp>;
  _or?: InputMaybe<Array<Universal_Profile_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  followed?: InputMaybe<Follow_Bool_Exp>;
  followedBy?: InputMaybe<Follow_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  lsp3Profile?: InputMaybe<Lsp3_Profile_Bool_Exp>;
  ownedAssets?: InputMaybe<Owned_Asset_Bool_Exp>;
  ownedTokens?: InputMaybe<Owned_Token_Bool_Exp>;
};

/** Ordering for universal profiles */
export type Universal_Profile_Order_By = {
  address?: InputMaybe<Order_By>;
  followedBy_aggregate?: InputMaybe<Follow_Aggregate_Order_By>;
  followed_aggregate?: InputMaybe<Follow_Aggregate_Order_By>;
  id?: InputMaybe<Order_By>;
  lsp3Profile?: InputMaybe<Lsp3_Profile_Order_By>;
};

export type GetProfileQueryVariables = Exact<{
  where: Universal_Profile_Bool_Exp;
  includeName?: Scalars['Boolean']['input'];
  includeDescription?: Scalars['Boolean']['input'];
  includeTags?: Scalars['Boolean']['input'];
  includeLinks?: Scalars['Boolean']['input'];
  includeAvatar?: Scalars['Boolean']['input'];
  includeProfileImage?: Scalars['Boolean']['input'];
  includeBackgroundImage?: Scalars['Boolean']['input'];
  includeFollowerCount?: Scalars['Boolean']['input'];
  includeFollowingCount?: Scalars['Boolean']['input'];
}>;


export type GetProfileQuery = { __typename?: 'Query', universal_profile: Array<{ __typename?: 'universal_profile', id: string, address: string, lsp3Profile?: { __typename?: 'lsp3_profile', name?: { __typename?: 'lsp3_profile_name', value?: string | null } | null, description?: { __typename?: 'lsp3_profile_description', value?: string | null } | null, tags?: Array<{ __typename?: 'lsp3_profile_tag', value?: string | null }>, links?: Array<{ __typename?: 'lsp3_profile_link', title?: string | null, url?: string | null }>, avatar?: Array<{ __typename?: 'lsp3_profile_asset', url?: string | null, file_type?: string | null, verification_method?: string | null, verification_data?: string | null }>, profileImage?: Array<{ __typename?: 'lsp3_profile_image', url?: string | null, width?: number | null, height?: number | null, verification_method?: string | null, verification_data?: string | null }>, backgroundImage?: Array<{ __typename?: 'lsp3_profile_background_image', url?: string | null, width?: number | null, height?: number | null, verification_method?: string | null, verification_data?: string | null }> } | null, followedBy_aggregate?: { __typename?: 'follow_aggregate', aggregate?: { __typename?: 'follow_aggregate_fields', count: number } | null }, followed_aggregate?: { __typename?: 'follow_aggregate', aggregate?: { __typename?: 'follow_aggregate_fields', count: number } | null } }> };

export type GetProfilesQueryVariables = Exact<{
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
  order_by?: InputMaybe<Array<Universal_Profile_Order_By> | Universal_Profile_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeName?: Scalars['Boolean']['input'];
  includeDescription?: Scalars['Boolean']['input'];
  includeTags?: Scalars['Boolean']['input'];
  includeLinks?: Scalars['Boolean']['input'];
  includeAvatar?: Scalars['Boolean']['input'];
  includeProfileImage?: Scalars['Boolean']['input'];
  includeBackgroundImage?: Scalars['Boolean']['input'];
  includeFollowerCount?: Scalars['Boolean']['input'];
  includeFollowingCount?: Scalars['Boolean']['input'];
}>;


export type GetProfilesQuery = { __typename?: 'Query', universal_profile: Array<{ __typename?: 'universal_profile', id: string, address: string, lsp3Profile?: { __typename?: 'lsp3_profile', name?: { __typename?: 'lsp3_profile_name', value?: string | null } | null, description?: { __typename?: 'lsp3_profile_description', value?: string | null } | null, tags?: Array<{ __typename?: 'lsp3_profile_tag', value?: string | null }>, links?: Array<{ __typename?: 'lsp3_profile_link', title?: string | null, url?: string | null }>, avatar?: Array<{ __typename?: 'lsp3_profile_asset', url?: string | null, file_type?: string | null, verification_method?: string | null, verification_data?: string | null }>, profileImage?: Array<{ __typename?: 'lsp3_profile_image', url?: string | null, width?: number | null, height?: number | null, verification_method?: string | null, verification_data?: string | null }>, backgroundImage?: Array<{ __typename?: 'lsp3_profile_background_image', url?: string | null, width?: number | null, height?: number | null, verification_method?: string | null, verification_data?: string | null }> } | null, followedBy_aggregate?: { __typename?: 'follow_aggregate', aggregate?: { __typename?: 'follow_aggregate_fields', count: number } | null }, followed_aggregate?: { __typename?: 'follow_aggregate', aggregate?: { __typename?: 'follow_aggregate_fields', count: number } | null } }>, universal_profile_aggregate: { __typename?: 'universal_profile_aggregate', aggregate?: { __typename?: 'universal_profile_aggregate_fields', count: number } | null } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetProfileDocument = new TypedDocumentString(`
    query GetProfile($where: universal_profile_bool_exp!, $includeName: Boolean! = true, $includeDescription: Boolean! = true, $includeTags: Boolean! = true, $includeLinks: Boolean! = true, $includeAvatar: Boolean! = true, $includeProfileImage: Boolean! = true, $includeBackgroundImage: Boolean! = true, $includeFollowerCount: Boolean! = true, $includeFollowingCount: Boolean! = true) {
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
    `) as unknown as TypedDocumentString<GetProfileQuery, GetProfileQueryVariables>;
export const GetProfilesDocument = new TypedDocumentString(`
    query GetProfiles($where: universal_profile_bool_exp, $order_by: [universal_profile_order_by!], $limit: Int, $offset: Int, $includeName: Boolean! = true, $includeDescription: Boolean! = true, $includeTags: Boolean! = true, $includeLinks: Boolean! = true, $includeAvatar: Boolean! = true, $includeProfileImage: Boolean! = true, $includeBackgroundImage: Boolean! = true, $includeFollowerCount: Boolean! = true, $includeFollowingCount: Boolean! = true) {
  universal_profile(
    where: $where
    order_by: $order_by
    limit: $limit
    offset: $offset
  ) {
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
    `) as unknown as TypedDocumentString<GetProfilesQuery, GetProfilesQueryVariables>;