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
  asset_standard: { input: any; output: any; }
  bigint: { input: string; output: string; }
  jsonb: { input: unknown; output: unknown; }
  metadata_kind: { input: any; output: any; }
  numeric: { input: string; output: string; }
  timestamptz: { input: string; output: string; }
  verification_status: { input: any; output: any; }
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Array_Comparison_Exp = {
  /** is the array contained in the given array value */
  _contained_in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the array contain the given value */
  _contains?: InputMaybe<Array<Scalars['String']['input']>>;
  _eq?: InputMaybe<Array<Scalars['String']['input']>>;
  _gt?: InputMaybe<Array<Scalars['String']['input']>>;
  _gte?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Array<Scalars['String']['input']>>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Array<Scalars['String']['input']>>;
  _lte?: InputMaybe<Array<Scalars['String']['input']>>;
  _neq?: InputMaybe<Array<Scalars['String']['input']>>;
  _nin?: InputMaybe<Array<Array<Scalars['String']['input']>>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "asset_standard". All fields are combined with logical 'AND'. */
export type Asset_Standard_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['asset_standard']['input']>;
  _gt?: InputMaybe<Scalars['asset_standard']['input']>;
  _gte?: InputMaybe<Scalars['asset_standard']['input']>;
  _in?: InputMaybe<Array<Scalars['asset_standard']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['asset_standard']['input']>;
  _lte?: InputMaybe<Scalars['asset_standard']['input']>;
  _neq?: InputMaybe<Scalars['asset_standard']['input']>;
  _nin?: InputMaybe<Array<Scalars['asset_standard']['input']>>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** columns and relationships of "api.blocks" */
export type Block = {
  __typename?: 'block';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An array relationship */
  events: Array<Event_Fact>;
  /** An aggregate relationship */
  events_aggregate: Event_Fact_Aggregate;
  hash?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['bigint']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['timestamptz']['output']>;
};


/** columns and relationships of "api.blocks" */
export type BlockEventsArgs = {
  distinct_on?: InputMaybe<Array<Event_Fact_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Event_Fact_Order_By>>;
  where?: InputMaybe<Event_Fact_Bool_Exp>;
};


/** columns and relationships of "api.blocks" */
export type BlockEvents_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Event_Fact_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Event_Fact_Order_By>>;
  where?: InputMaybe<Event_Fact_Bool_Exp>;
};

/** aggregated selection of "api.blocks" */
export type Block_Aggregate = {
  __typename?: 'block_aggregate';
  aggregate?: Maybe<Block_Aggregate_Fields>;
  nodes: Array<Block>;
};

/** aggregate fields of "api.blocks" */
export type Block_Aggregate_Fields = {
  __typename?: 'block_aggregate_fields';
  avg?: Maybe<Block_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Block_Max_Fields>;
  min?: Maybe<Block_Min_Fields>;
  stddev?: Maybe<Block_Stddev_Fields>;
  stddev_pop?: Maybe<Block_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Block_Stddev_Samp_Fields>;
  sum?: Maybe<Block_Sum_Fields>;
  var_pop?: Maybe<Block_Var_Pop_Fields>;
  var_samp?: Maybe<Block_Var_Samp_Fields>;
  variance?: Maybe<Block_Variance_Fields>;
};


/** aggregate fields of "api.blocks" */
export type Block_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Block_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Block_Avg_Fields = {
  __typename?: 'block_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "api.blocks". All fields are combined with a logical 'AND'. */
export type Block_Bool_Exp = {
  _and?: InputMaybe<Array<Block_Bool_Exp>>;
  _not?: InputMaybe<Block_Bool_Exp>;
  _or?: InputMaybe<Array<Block_Bool_Exp>>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  events?: InputMaybe<Event_Fact_Bool_Exp>;
  events_aggregate?: InputMaybe<Event_Fact_Aggregate_Bool_Exp>;
  hash?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  number?: InputMaybe<Bigint_Comparison_Exp>;
  parent_hash?: InputMaybe<String_Comparison_Exp>;
  timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Block_Max_Fields = {
  __typename?: 'block_max_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  hash?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['bigint']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Block_Min_Fields = {
  __typename?: 'block_min_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  hash?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['bigint']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  timestamp?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "api.blocks". */
export type Block_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  events_aggregate?: InputMaybe<Event_Fact_Aggregate_Order_By>;
  hash?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  number?: InputMaybe<Order_By>;
  parent_hash?: InputMaybe<Order_By>;
  timestamp?: InputMaybe<Order_By>;
};

/** select columns of table "api.blocks" */
export type Block_Select_Column =
  /** column name */
  | 'chain_id'
  /** column name */
  | 'hash'
  /** column name */
  | 'id'
  /** column name */
  | 'network'
  /** column name */
  | 'number'
  /** column name */
  | 'parent_hash'
  /** column name */
  | 'timestamp';

/** aggregate stddev on columns */
export type Block_Stddev_Fields = {
  __typename?: 'block_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Block_Stddev_Pop_Fields = {
  __typename?: 'block_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Block_Stddev_Samp_Fields = {
  __typename?: 'block_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate sum on columns */
export type Block_Sum_Fields = {
  __typename?: 'block_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  number?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type Block_Var_Pop_Fields = {
  __typename?: 'block_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Block_Var_Samp_Fields = {
  __typename?: 'block_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Block_Variance_Fields = {
  __typename?: 'block_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  number?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "api.chillwhales_nfts" */
export type Chillwhales_Nft = {
  __typename?: 'chillwhales_nft';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  chill_claimed?: Maybe<Scalars['Boolean']['output']>;
  claim_check_after_block?: Maybe<Scalars['bigint']['output']>;
  cooldown_expiry?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  faction?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  nft?: Maybe<Nft>;
  orbs_claimed?: Maybe<Scalars['Boolean']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** aggregated selection of "api.chillwhales_nfts" */
export type Chillwhales_Nft_Aggregate = {
  __typename?: 'chillwhales_nft_aggregate';
  aggregate?: Maybe<Chillwhales_Nft_Aggregate_Fields>;
  nodes: Array<Chillwhales_Nft>;
};

/** aggregate fields of "api.chillwhales_nfts" */
export type Chillwhales_Nft_Aggregate_Fields = {
  __typename?: 'chillwhales_nft_aggregate_fields';
  avg?: Maybe<Chillwhales_Nft_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Chillwhales_Nft_Max_Fields>;
  min?: Maybe<Chillwhales_Nft_Min_Fields>;
  stddev?: Maybe<Chillwhales_Nft_Stddev_Fields>;
  stddev_pop?: Maybe<Chillwhales_Nft_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Chillwhales_Nft_Stddev_Samp_Fields>;
  sum?: Maybe<Chillwhales_Nft_Sum_Fields>;
  var_pop?: Maybe<Chillwhales_Nft_Var_Pop_Fields>;
  var_samp?: Maybe<Chillwhales_Nft_Var_Samp_Fields>;
  variance?: Maybe<Chillwhales_Nft_Variance_Fields>;
};


/** aggregate fields of "api.chillwhales_nfts" */
export type Chillwhales_Nft_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Chillwhales_Nft_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Chillwhales_Nft_Avg_Fields = {
  __typename?: 'chillwhales_nft_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "api.chillwhales_nfts". All fields are combined with a logical 'AND'. */
export type Chillwhales_Nft_Bool_Exp = {
  _and?: InputMaybe<Array<Chillwhales_Nft_Bool_Exp>>;
  _not?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
  _or?: InputMaybe<Array<Chillwhales_Nft_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  chill_claimed?: InputMaybe<Boolean_Comparison_Exp>;
  claim_check_after_block?: InputMaybe<Bigint_Comparison_Exp>;
  cooldown_expiry?: InputMaybe<Bigint_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  faction?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  level?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  nft?: InputMaybe<Nft_Bool_Exp>;
  orbs_claimed?: InputMaybe<Boolean_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
};

/** aggregate max on columns */
export type Chillwhales_Nft_Max_Fields = {
  __typename?: 'chillwhales_nft_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  claim_check_after_block?: Maybe<Scalars['bigint']['output']>;
  cooldown_expiry?: Maybe<Scalars['bigint']['output']>;
  faction?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** aggregate min on columns */
export type Chillwhales_Nft_Min_Fields = {
  __typename?: 'chillwhales_nft_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  claim_check_after_block?: Maybe<Scalars['bigint']['output']>;
  cooldown_expiry?: Maybe<Scalars['bigint']['output']>;
  faction?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** Ordering options when selecting data from "api.chillwhales_nfts". */
export type Chillwhales_Nft_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  chill_claimed?: InputMaybe<Order_By>;
  claim_check_after_block?: InputMaybe<Order_By>;
  cooldown_expiry?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  faction?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  level?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  nft?: InputMaybe<Nft_Order_By>;
  orbs_claimed?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** select columns of table "api.chillwhales_nfts" */
export type Chillwhales_Nft_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'chill_claimed'
  /** column name */
  | 'claim_check_after_block'
  /** column name */
  | 'cooldown_expiry'
  /** column name */
  | 'faction'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'level'
  /** column name */
  | 'network'
  /** column name */
  | 'orbs_claimed'
  /** column name */
  | 'token_id';

/** aggregate stddev on columns */
export type Chillwhales_Nft_Stddev_Fields = {
  __typename?: 'chillwhales_nft_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Chillwhales_Nft_Stddev_Pop_Fields = {
  __typename?: 'chillwhales_nft_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Chillwhales_Nft_Stddev_Samp_Fields = {
  __typename?: 'chillwhales_nft_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** aggregate sum on columns */
export type Chillwhales_Nft_Sum_Fields = {
  __typename?: 'chillwhales_nft_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  claim_check_after_block?: Maybe<Scalars['bigint']['output']>;
  cooldown_expiry?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Chillwhales_Nft_Var_Pop_Fields = {
  __typename?: 'chillwhales_nft_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Chillwhales_Nft_Var_Samp_Fields = {
  __typename?: 'chillwhales_nft_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Chillwhales_Nft_Variance_Fields = {
  __typename?: 'chillwhales_nft_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  claim_check_after_block?: Maybe<Scalars['Float']['output']>;
  cooldown_expiry?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  level?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "api.data_values" */
export type Data_Value = {
  __typename?: 'data_value';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  data_value?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  nft?: Maybe<Nft>;
  token_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};

/** aggregated selection of "api.data_values" */
export type Data_Value_Aggregate = {
  __typename?: 'data_value_aggregate';
  aggregate?: Maybe<Data_Value_Aggregate_Fields>;
  nodes: Array<Data_Value>;
};

export type Data_Value_Aggregate_Bool_Exp = {
  count?: InputMaybe<Data_Value_Aggregate_Bool_Exp_Count>;
};

export type Data_Value_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Data_Value_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Data_Value_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.data_values" */
export type Data_Value_Aggregate_Fields = {
  __typename?: 'data_value_aggregate_fields';
  avg?: Maybe<Data_Value_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Data_Value_Max_Fields>;
  min?: Maybe<Data_Value_Min_Fields>;
  stddev?: Maybe<Data_Value_Stddev_Fields>;
  stddev_pop?: Maybe<Data_Value_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Data_Value_Stddev_Samp_Fields>;
  sum?: Maybe<Data_Value_Sum_Fields>;
  var_pop?: Maybe<Data_Value_Var_Pop_Fields>;
  var_samp?: Maybe<Data_Value_Var_Samp_Fields>;
  variance?: Maybe<Data_Value_Variance_Fields>;
};


/** aggregate fields of "api.data_values" */
export type Data_Value_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Data_Value_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.data_values" */
export type Data_Value_Aggregate_Order_By = {
  avg?: InputMaybe<Data_Value_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Data_Value_Max_Order_By>;
  min?: InputMaybe<Data_Value_Min_Order_By>;
  stddev?: InputMaybe<Data_Value_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Data_Value_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Data_Value_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Data_Value_Sum_Order_By>;
  var_pop?: InputMaybe<Data_Value_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Data_Value_Var_Samp_Order_By>;
  variance?: InputMaybe<Data_Value_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Data_Value_Avg_Fields = {
  __typename?: 'data_value_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.data_values" */
export type Data_Value_Avg_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.data_values". All fields are combined with a logical 'AND'. */
export type Data_Value_Bool_Exp = {
  _and?: InputMaybe<Array<Data_Value_Bool_Exp>>;
  _not?: InputMaybe<Data_Value_Bool_Exp>;
  _or?: InputMaybe<Array<Data_Value_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  data_key?: InputMaybe<String_Comparison_Exp>;
  data_value?: InputMaybe<String_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  nft?: InputMaybe<Nft_Bool_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Data_Value_Max_Fields = {
  __typename?: 'data_value_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  data_value?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.data_values" */
export type Data_Value_Max_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  data_value?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Data_Value_Min_Fields = {
  __typename?: 'data_value_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  data_value?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.data_values" */
export type Data_Value_Min_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  data_value?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.data_values". */
export type Data_Value_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  data_value?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  nft?: InputMaybe<Nft_Order_By>;
  token_id?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.data_values" */
export type Data_Value_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'data_key'
  /** column name */
  | 'data_value'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'token_id';

/** aggregate stddev on columns */
export type Data_Value_Stddev_Fields = {
  __typename?: 'data_value_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.data_values" */
export type Data_Value_Stddev_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Data_Value_Stddev_Pop_Fields = {
  __typename?: 'data_value_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.data_values" */
export type Data_Value_Stddev_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Data_Value_Stddev_Samp_Fields = {
  __typename?: 'data_value_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.data_values" */
export type Data_Value_Stddev_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Data_Value_Sum_Fields = {
  __typename?: 'data_value_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.data_values" */
export type Data_Value_Sum_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Data_Value_Var_Pop_Fields = {
  __typename?: 'data_value_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.data_values" */
export type Data_Value_Var_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Data_Value_Var_Samp_Fields = {
  __typename?: 'data_value_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.data_values" */
export type Data_Value_Var_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Data_Value_Variance_Fields = {
  __typename?: 'data_value_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.data_values" */
export type Data_Value_Variance_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.digital_assets" */
export type Digital_Asset = {
  __typename?: 'digital_asset';
  address?: Maybe<Scalars['String']['output']>;
  base_uri?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An array relationship */
  dataValues: Array<Data_Value>;
  /** An aggregate relationship */
  dataValues_aggregate: Data_Value_Aggregate;
  decimals?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  /** An array relationship */
  lsp4Creators: Array<Lsp4_Creator>;
  /** An aggregate relationship */
  lsp4Creators_aggregate: Lsp4_Creator_Aggregate;
  /** An array relationship */
  lsp12IssuedBy: Array<Lsp12_Issued_Asset>;
  /** An aggregate relationship */
  lsp12IssuedBy_aggregate: Lsp12_Issued_Asset_Aggregate;
  /** An array relationship */
  metadataRevisions: Array<Metadata_Revision>;
  /** An aggregate relationship */
  metadataRevisions_aggregate: Metadata_Revision_Aggregate;
  name?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  nfts: Array<Nft>;
  /** An aggregate relationship */
  nfts_aggregate: Nft_Aggregate;
  /** An array relationship */
  ownedAssets: Array<Owned_Asset>;
  /** An aggregate relationship */
  ownedAssets_aggregate: Owned_Asset_Aggregate;
  /** An array relationship */
  ownedTokens: Array<Owned_Token>;
  /** An aggregate relationship */
  ownedTokens_aggregate: Owned_Token_Aggregate;
  owner_address?: Maybe<Scalars['String']['output']>;
  standard?: Maybe<Scalars['asset_standard']['output']>;
  symbol?: Maybe<Scalars['String']['output']>;
  token_id_format?: Maybe<Scalars['Int']['output']>;
  token_id_reference_contract?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['Int']['output']>;
  total_supply?: Maybe<Scalars['numeric']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetDataValuesArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetDataValues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetLsp4CreatorsArgs = {
  distinct_on?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp4_Creator_Order_By>>;
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetLsp4Creators_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp4_Creator_Order_By>>;
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetLsp12IssuedByArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetLsp12IssuedBy_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetMetadataRevisionsArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetMetadataRevisions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetNftsArgs = {
  distinct_on?: InputMaybe<Array<Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Nft_Order_By>>;
  where?: InputMaybe<Nft_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetNfts_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Nft_Order_By>>;
  where?: InputMaybe<Nft_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetOwnedAssetsArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetOwnedAssets_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetOwnedTokensArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


/** columns and relationships of "api.digital_assets" */
export type Digital_AssetOwnedTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};

/** aggregated selection of "api.digital_assets" */
export type Digital_Asset_Aggregate = {
  __typename?: 'digital_asset_aggregate';
  aggregate?: Maybe<Digital_Asset_Aggregate_Fields>;
  nodes: Array<Digital_Asset>;
};

/** aggregate fields of "api.digital_assets" */
export type Digital_Asset_Aggregate_Fields = {
  __typename?: 'digital_asset_aggregate_fields';
  avg?: Maybe<Digital_Asset_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Digital_Asset_Max_Fields>;
  min?: Maybe<Digital_Asset_Min_Fields>;
  stddev?: Maybe<Digital_Asset_Stddev_Fields>;
  stddev_pop?: Maybe<Digital_Asset_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Digital_Asset_Stddev_Samp_Fields>;
  sum?: Maybe<Digital_Asset_Sum_Fields>;
  var_pop?: Maybe<Digital_Asset_Var_Pop_Fields>;
  var_samp?: Maybe<Digital_Asset_Var_Samp_Fields>;
  variance?: Maybe<Digital_Asset_Variance_Fields>;
};


/** aggregate fields of "api.digital_assets" */
export type Digital_Asset_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Digital_Asset_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Digital_Asset_Avg_Fields = {
  __typename?: 'digital_asset_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "api.digital_assets". All fields are combined with a logical 'AND'. */
export type Digital_Asset_Bool_Exp = {
  _and?: InputMaybe<Array<Digital_Asset_Bool_Exp>>;
  _not?: InputMaybe<Digital_Asset_Bool_Exp>;
  _or?: InputMaybe<Array<Digital_Asset_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  base_uri?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  dataValues?: InputMaybe<Data_Value_Bool_Exp>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Bool_Exp>;
  decimals?: InputMaybe<Int_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  lsp4Creators?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  lsp4Creators_aggregate?: InputMaybe<Lsp4_Creator_Aggregate_Bool_Exp>;
  lsp12IssuedBy?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  lsp12IssuedBy_aggregate?: InputMaybe<Lsp12_Issued_Asset_Aggregate_Bool_Exp>;
  metadataRevisions?: InputMaybe<Metadata_Revision_Bool_Exp>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  nfts?: InputMaybe<Nft_Bool_Exp>;
  nfts_aggregate?: InputMaybe<Nft_Aggregate_Bool_Exp>;
  ownedAssets?: InputMaybe<Owned_Asset_Bool_Exp>;
  ownedAssets_aggregate?: InputMaybe<Owned_Asset_Aggregate_Bool_Exp>;
  ownedTokens?: InputMaybe<Owned_Token_Bool_Exp>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Bool_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  standard?: InputMaybe<Asset_Standard_Comparison_Exp>;
  symbol?: InputMaybe<String_Comparison_Exp>;
  token_id_format?: InputMaybe<Int_Comparison_Exp>;
  token_id_reference_contract?: InputMaybe<String_Comparison_Exp>;
  token_type?: InputMaybe<Int_Comparison_Exp>;
  total_supply?: InputMaybe<Numeric_Comparison_Exp>;
  verification?: InputMaybe<Verification_Status_Comparison_Exp>;
};

/** aggregate max on columns */
export type Digital_Asset_Max_Fields = {
  __typename?: 'digital_asset_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  base_uri?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  decimals?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  standard?: Maybe<Scalars['asset_standard']['output']>;
  symbol?: Maybe<Scalars['String']['output']>;
  token_id_format?: Maybe<Scalars['Int']['output']>;
  token_id_reference_contract?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['Int']['output']>;
  total_supply?: Maybe<Scalars['numeric']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** aggregate min on columns */
export type Digital_Asset_Min_Fields = {
  __typename?: 'digital_asset_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  base_uri?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  decimals?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  standard?: Maybe<Scalars['asset_standard']['output']>;
  symbol?: Maybe<Scalars['String']['output']>;
  token_id_format?: Maybe<Scalars['Int']['output']>;
  token_id_reference_contract?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['Int']['output']>;
  total_supply?: Maybe<Scalars['numeric']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** Ordering options when selecting data from "api.digital_assets". */
export type Digital_Asset_Order_By = {
  address?: InputMaybe<Order_By>;
  base_uri?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Order_By>;
  decimals?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  lsp4Creators_aggregate?: InputMaybe<Lsp4_Creator_Aggregate_Order_By>;
  lsp12IssuedBy_aggregate?: InputMaybe<Lsp12_Issued_Asset_Aggregate_Order_By>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Order_By>;
  name?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  nfts_aggregate?: InputMaybe<Nft_Aggregate_Order_By>;
  ownedAssets_aggregate?: InputMaybe<Owned_Asset_Aggregate_Order_By>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Order_By>;
  owner_address?: InputMaybe<Order_By>;
  standard?: InputMaybe<Order_By>;
  symbol?: InputMaybe<Order_By>;
  token_id_format?: InputMaybe<Order_By>;
  token_id_reference_contract?: InputMaybe<Order_By>;
  token_type?: InputMaybe<Order_By>;
  total_supply?: InputMaybe<Order_By>;
  verification?: InputMaybe<Order_By>;
};

/** select columns of table "api.digital_assets" */
export type Digital_Asset_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'base_uri'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'decimals'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'name'
  /** column name */
  | 'network'
  /** column name */
  | 'owner_address'
  /** column name */
  | 'standard'
  /** column name */
  | 'symbol'
  /** column name */
  | 'token_id_format'
  /** column name */
  | 'token_id_reference_contract'
  /** column name */
  | 'token_type'
  /** column name */
  | 'total_supply'
  /** column name */
  | 'verification';

/** aggregate stddev on columns */
export type Digital_Asset_Stddev_Fields = {
  __typename?: 'digital_asset_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Digital_Asset_Stddev_Pop_Fields = {
  __typename?: 'digital_asset_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Digital_Asset_Stddev_Samp_Fields = {
  __typename?: 'digital_asset_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** aggregate sum on columns */
export type Digital_Asset_Sum_Fields = {
  __typename?: 'digital_asset_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  decimals?: Maybe<Scalars['Int']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  token_id_format?: Maybe<Scalars['Int']['output']>;
  token_type?: Maybe<Scalars['Int']['output']>;
  total_supply?: Maybe<Scalars['numeric']['output']>;
};

/** aggregate var_pop on columns */
export type Digital_Asset_Var_Pop_Fields = {
  __typename?: 'digital_asset_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Digital_Asset_Var_Samp_Fields = {
  __typename?: 'digital_asset_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Digital_Asset_Variance_Fields = {
  __typename?: 'digital_asset_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  decimals?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
  token_id_format?: Maybe<Scalars['Float']['output']>;
  token_type?: Maybe<Scalars['Float']['output']>;
  total_supply?: Maybe<Scalars['Float']['output']>;
};

/** columns and relationships of "api.event_facts" */
export type Event_Fact = {
  __typename?: 'event_fact';
  address?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  block?: Maybe<Block>;
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data?: Maybe<Scalars['String']['output']>;
  decoded?: Maybe<Scalars['jsonb']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  event_domain?: Maybe<Scalars['String']['output']>;
  event_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  topic0?: Maybe<Scalars['String']['output']>;
  topics?: Maybe<Array<Scalars['String']['output']>>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['Int']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};


/** columns and relationships of "api.event_facts" */
export type Event_FactDecodedArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "api.event_facts" */
export type Event_Fact_Aggregate = {
  __typename?: 'event_fact_aggregate';
  aggregate?: Maybe<Event_Fact_Aggregate_Fields>;
  nodes: Array<Event_Fact>;
};

export type Event_Fact_Aggregate_Bool_Exp = {
  count?: InputMaybe<Event_Fact_Aggregate_Bool_Exp_Count>;
};

export type Event_Fact_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Event_Fact_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Event_Fact_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.event_facts" */
export type Event_Fact_Aggregate_Fields = {
  __typename?: 'event_fact_aggregate_fields';
  avg?: Maybe<Event_Fact_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Event_Fact_Max_Fields>;
  min?: Maybe<Event_Fact_Min_Fields>;
  stddev?: Maybe<Event_Fact_Stddev_Fields>;
  stddev_pop?: Maybe<Event_Fact_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Event_Fact_Stddev_Samp_Fields>;
  sum?: Maybe<Event_Fact_Sum_Fields>;
  var_pop?: Maybe<Event_Fact_Var_Pop_Fields>;
  var_samp?: Maybe<Event_Fact_Var_Samp_Fields>;
  variance?: Maybe<Event_Fact_Variance_Fields>;
};


/** aggregate fields of "api.event_facts" */
export type Event_Fact_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Event_Fact_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.event_facts" */
export type Event_Fact_Aggregate_Order_By = {
  avg?: InputMaybe<Event_Fact_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Event_Fact_Max_Order_By>;
  min?: InputMaybe<Event_Fact_Min_Order_By>;
  stddev?: InputMaybe<Event_Fact_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Event_Fact_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Event_Fact_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Event_Fact_Sum_Order_By>;
  var_pop?: InputMaybe<Event_Fact_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Event_Fact_Var_Samp_Order_By>;
  variance?: InputMaybe<Event_Fact_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Event_Fact_Avg_Fields = {
  __typename?: 'event_fact_avg_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.event_facts" */
export type Event_Fact_Avg_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.event_facts". All fields are combined with a logical 'AND'. */
export type Event_Fact_Bool_Exp = {
  _and?: InputMaybe<Array<Event_Fact_Bool_Exp>>;
  _not?: InputMaybe<Event_Fact_Bool_Exp>;
  _or?: InputMaybe<Array<Event_Fact_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  block?: InputMaybe<Block_Bool_Exp>;
  block_hash?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Bigint_Comparison_Exp>;
  block_timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  data?: InputMaybe<String_Comparison_Exp>;
  decoded?: InputMaybe<Jsonb_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  event_domain?: InputMaybe<String_Comparison_Exp>;
  event_name?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  log_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  parent_hash?: InputMaybe<String_Comparison_Exp>;
  topic0?: InputMaybe<String_Comparison_Exp>;
  topics?: InputMaybe<String_Array_Comparison_Exp>;
  transaction_hash?: InputMaybe<String_Comparison_Exp>;
  transaction_index?: InputMaybe<Int_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Event_Fact_Max_Fields = {
  __typename?: 'event_fact_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data?: Maybe<Scalars['String']['output']>;
  event_domain?: Maybe<Scalars['String']['output']>;
  event_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  topic0?: Maybe<Scalars['String']['output']>;
  topics?: Maybe<Array<Scalars['String']['output']>>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by max() on columns of table "api.event_facts" */
export type Event_Fact_Max_Order_By = {
  address?: InputMaybe<Order_By>;
  block_hash?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  block_timestamp?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data?: InputMaybe<Order_By>;
  event_domain?: InputMaybe<Order_By>;
  event_name?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  parent_hash?: InputMaybe<Order_By>;
  topic0?: InputMaybe<Order_By>;
  topics?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Event_Fact_Min_Fields = {
  __typename?: 'event_fact_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  data?: Maybe<Scalars['String']['output']>;
  event_domain?: Maybe<Scalars['String']['output']>;
  event_name?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  log_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  parent_hash?: Maybe<Scalars['String']['output']>;
  topic0?: Maybe<Scalars['String']['output']>;
  topics?: Maybe<Array<Scalars['String']['output']>>;
  transaction_hash?: Maybe<Scalars['String']['output']>;
  transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by min() on columns of table "api.event_facts" */
export type Event_Fact_Min_Order_By = {
  address?: InputMaybe<Order_By>;
  block_hash?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  block_timestamp?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data?: InputMaybe<Order_By>;
  event_domain?: InputMaybe<Order_By>;
  event_name?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  parent_hash?: InputMaybe<Order_By>;
  topic0?: InputMaybe<Order_By>;
  topics?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.event_facts". */
export type Event_Fact_Order_By = {
  address?: InputMaybe<Order_By>;
  block?: InputMaybe<Block_Order_By>;
  block_hash?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  block_timestamp?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  data?: InputMaybe<Order_By>;
  decoded?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  event_domain?: InputMaybe<Order_By>;
  event_name?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  parent_hash?: InputMaybe<Order_By>;
  topic0?: InputMaybe<Order_By>;
  topics?: InputMaybe<Order_By>;
  transaction_hash?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.event_facts" */
export type Event_Fact_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'block_hash'
  /** column name */
  | 'block_number'
  /** column name */
  | 'block_timestamp'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'data'
  /** column name */
  | 'decoded'
  /** column name */
  | 'event_domain'
  /** column name */
  | 'event_name'
  /** column name */
  | 'id'
  /** column name */
  | 'log_index'
  /** column name */
  | 'network'
  /** column name */
  | 'parent_hash'
  /** column name */
  | 'topic0'
  /** column name */
  | 'topics'
  /** column name */
  | 'transaction_hash'
  /** column name */
  | 'transaction_index';

/** aggregate stddev on columns */
export type Event_Fact_Stddev_Fields = {
  __typename?: 'event_fact_stddev_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.event_facts" */
export type Event_Fact_Stddev_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Event_Fact_Stddev_Pop_Fields = {
  __typename?: 'event_fact_stddev_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.event_facts" */
export type Event_Fact_Stddev_Pop_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Event_Fact_Stddev_Samp_Fields = {
  __typename?: 'event_fact_stddev_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.event_facts" */
export type Event_Fact_Stddev_Samp_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Event_Fact_Sum_Fields = {
  __typename?: 'event_fact_sum_fields';
  block_number?: Maybe<Scalars['bigint']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  log_index?: Maybe<Scalars['Int']['output']>;
  transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.event_facts" */
export type Event_Fact_Sum_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Event_Fact_Var_Pop_Fields = {
  __typename?: 'event_fact_var_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.event_facts" */
export type Event_Fact_Var_Pop_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Event_Fact_Var_Samp_Fields = {
  __typename?: 'event_fact_var_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.event_facts" */
export type Event_Fact_Var_Samp_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Event_Fact_Variance_Fields = {
  __typename?: 'event_fact_variance_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  log_index?: Maybe<Scalars['Float']['output']>;
  transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.event_facts" */
export type Event_Fact_Variance_Order_By = {
  block_number?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  log_index?: InputMaybe<Order_By>;
  transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.follower_edges" */
export type Follower = {
  __typename?: 'follower';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  followedUniversalProfile?: Maybe<Universal_Profile>;
  followed_address?: Maybe<Scalars['String']['output']>;
  followed_at?: Maybe<Scalars['timestamptz']['output']>;
  /** An object relationship */
  followerUniversalProfile?: Maybe<Universal_Profile>;
  follower_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  is_following?: Maybe<Scalars['Boolean']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  unfollowed_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregated selection of "api.follower_edges" */
export type Follower_Aggregate = {
  __typename?: 'follower_aggregate';
  aggregate?: Maybe<Follower_Aggregate_Fields>;
  nodes: Array<Follower>;
};

export type Follower_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Follower_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Follower_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Follower_Aggregate_Bool_Exp_Count>;
};

export type Follower_Aggregate_Bool_Exp_Bool_And = {
  arguments: Follower_Select_Column_Follower_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Follower_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Follower_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Follower_Select_Column_Follower_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Follower_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Follower_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Follower_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Follower_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.follower_edges" */
export type Follower_Aggregate_Fields = {
  __typename?: 'follower_aggregate_fields';
  avg?: Maybe<Follower_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Follower_Max_Fields>;
  min?: Maybe<Follower_Min_Fields>;
  stddev?: Maybe<Follower_Stddev_Fields>;
  stddev_pop?: Maybe<Follower_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Follower_Stddev_Samp_Fields>;
  sum?: Maybe<Follower_Sum_Fields>;
  var_pop?: Maybe<Follower_Var_Pop_Fields>;
  var_samp?: Maybe<Follower_Var_Samp_Fields>;
  variance?: Maybe<Follower_Variance_Fields>;
};


/** aggregate fields of "api.follower_edges" */
export type Follower_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Follower_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.follower_edges" */
export type Follower_Aggregate_Order_By = {
  avg?: InputMaybe<Follower_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Follower_Max_Order_By>;
  min?: InputMaybe<Follower_Min_Order_By>;
  stddev?: InputMaybe<Follower_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Follower_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Follower_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Follower_Sum_Order_By>;
  var_pop?: InputMaybe<Follower_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Follower_Var_Samp_Order_By>;
  variance?: InputMaybe<Follower_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Follower_Avg_Fields = {
  __typename?: 'follower_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.follower_edges" */
export type Follower_Avg_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.follower_edges". All fields are combined with a logical 'AND'. */
export type Follower_Bool_Exp = {
  _and?: InputMaybe<Array<Follower_Bool_Exp>>;
  _not?: InputMaybe<Follower_Bool_Exp>;
  _or?: InputMaybe<Array<Follower_Bool_Exp>>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  followedUniversalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
  followed_address?: InputMaybe<String_Comparison_Exp>;
  followed_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  followerUniversalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
  follower_address?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  is_following?: InputMaybe<Boolean_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  unfollowed_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Follower_Max_Fields = {
  __typename?: 'follower_max_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  followed_address?: Maybe<Scalars['String']['output']>;
  followed_at?: Maybe<Scalars['timestamptz']['output']>;
  follower_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  unfollowed_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by max() on columns of table "api.follower_edges" */
export type Follower_Max_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  followed_address?: InputMaybe<Order_By>;
  followed_at?: InputMaybe<Order_By>;
  follower_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  unfollowed_at?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Follower_Min_Fields = {
  __typename?: 'follower_min_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  followed_address?: Maybe<Scalars['String']['output']>;
  followed_at?: Maybe<Scalars['timestamptz']['output']>;
  follower_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  unfollowed_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** order by min() on columns of table "api.follower_edges" */
export type Follower_Min_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  followed_address?: InputMaybe<Order_By>;
  followed_at?: InputMaybe<Order_By>;
  follower_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  unfollowed_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.follower_edges". */
export type Follower_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  followedUniversalProfile?: InputMaybe<Universal_Profile_Order_By>;
  followed_address?: InputMaybe<Order_By>;
  followed_at?: InputMaybe<Order_By>;
  followerUniversalProfile?: InputMaybe<Universal_Profile_Order_By>;
  follower_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_following?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  unfollowed_at?: InputMaybe<Order_By>;
};

/** select columns of table "api.follower_edges" */
export type Follower_Select_Column =
  /** column name */
  | 'chain_id'
  /** column name */
  | 'followed_address'
  /** column name */
  | 'followed_at'
  /** column name */
  | 'follower_address'
  /** column name */
  | 'id'
  /** column name */
  | 'is_following'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'unfollowed_at';

/** select "follower_aggregate_bool_exp_bool_and_arguments_columns" columns of table "api.follower_edges" */
export type Follower_Select_Column_Follower_Aggregate_Bool_Exp_Bool_And_Arguments_Columns =
  /** column name */
  | 'is_following';

/** select "follower_aggregate_bool_exp_bool_or_arguments_columns" columns of table "api.follower_edges" */
export type Follower_Select_Column_Follower_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns =
  /** column name */
  | 'is_following';

/** aggregate stddev on columns */
export type Follower_Stddev_Fields = {
  __typename?: 'follower_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.follower_edges" */
export type Follower_Stddev_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Follower_Stddev_Pop_Fields = {
  __typename?: 'follower_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.follower_edges" */
export type Follower_Stddev_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Follower_Stddev_Samp_Fields = {
  __typename?: 'follower_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.follower_edges" */
export type Follower_Stddev_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Follower_Sum_Fields = {
  __typename?: 'follower_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.follower_edges" */
export type Follower_Sum_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Follower_Var_Pop_Fields = {
  __typename?: 'follower_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.follower_edges" */
export type Follower_Var_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Follower_Var_Samp_Fields = {
  __typename?: 'follower_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.follower_edges" */
export type Follower_Var_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Follower_Variance_Fields = {
  __typename?: 'follower_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.follower_edges" */
export type Follower_Variance_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.indexed_heads" */
export type Indexed_Head = {
  __typename?: 'indexed_head';
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  finalized_block_hash?: Maybe<Scalars['String']['output']>;
  finalized_block_number?: Maybe<Scalars['bigint']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregated selection of "api.indexed_heads" */
export type Indexed_Head_Aggregate = {
  __typename?: 'indexed_head_aggregate';
  aggregate?: Maybe<Indexed_Head_Aggregate_Fields>;
  nodes: Array<Indexed_Head>;
};

/** aggregate fields of "api.indexed_heads" */
export type Indexed_Head_Aggregate_Fields = {
  __typename?: 'indexed_head_aggregate_fields';
  avg?: Maybe<Indexed_Head_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Indexed_Head_Max_Fields>;
  min?: Maybe<Indexed_Head_Min_Fields>;
  stddev?: Maybe<Indexed_Head_Stddev_Fields>;
  stddev_pop?: Maybe<Indexed_Head_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Indexed_Head_Stddev_Samp_Fields>;
  sum?: Maybe<Indexed_Head_Sum_Fields>;
  var_pop?: Maybe<Indexed_Head_Var_Pop_Fields>;
  var_samp?: Maybe<Indexed_Head_Var_Samp_Fields>;
  variance?: Maybe<Indexed_Head_Variance_Fields>;
};


/** aggregate fields of "api.indexed_heads" */
export type Indexed_Head_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Indexed_Head_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Indexed_Head_Avg_Fields = {
  __typename?: 'indexed_head_avg_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "api.indexed_heads". All fields are combined with a logical 'AND'. */
export type Indexed_Head_Bool_Exp = {
  _and?: InputMaybe<Array<Indexed_Head_Bool_Exp>>;
  _not?: InputMaybe<Indexed_Head_Bool_Exp>;
  _or?: InputMaybe<Array<Indexed_Head_Bool_Exp>>;
  block_hash?: InputMaybe<String_Comparison_Exp>;
  block_number?: InputMaybe<Bigint_Comparison_Exp>;
  block_timestamp?: InputMaybe<Timestamptz_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  finalized_block_hash?: InputMaybe<String_Comparison_Exp>;
  finalized_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** aggregate max on columns */
export type Indexed_Head_Max_Fields = {
  __typename?: 'indexed_head_max_fields';
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  finalized_block_hash?: Maybe<Scalars['String']['output']>;
  finalized_block_number?: Maybe<Scalars['bigint']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** aggregate min on columns */
export type Indexed_Head_Min_Fields = {
  __typename?: 'indexed_head_min_fields';
  block_hash?: Maybe<Scalars['String']['output']>;
  block_number?: Maybe<Scalars['bigint']['output']>;
  block_timestamp?: Maybe<Scalars['timestamptz']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  finalized_block_hash?: Maybe<Scalars['String']['output']>;
  finalized_block_number?: Maybe<Scalars['bigint']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['timestamptz']['output']>;
};

/** Ordering options when selecting data from "api.indexed_heads". */
export type Indexed_Head_Order_By = {
  block_hash?: InputMaybe<Order_By>;
  block_number?: InputMaybe<Order_By>;
  block_timestamp?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  finalized_block_hash?: InputMaybe<Order_By>;
  finalized_block_number?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "api.indexed_heads" */
export type Indexed_Head_Select_Column =
  /** column name */
  | 'block_hash'
  /** column name */
  | 'block_number'
  /** column name */
  | 'block_timestamp'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'finalized_block_hash'
  /** column name */
  | 'finalized_block_number'
  /** column name */
  | 'network'
  /** column name */
  | 'updated_at';

/** aggregate stddev on columns */
export type Indexed_Head_Stddev_Fields = {
  __typename?: 'indexed_head_stddev_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Indexed_Head_Stddev_Pop_Fields = {
  __typename?: 'indexed_head_stddev_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Indexed_Head_Stddev_Samp_Fields = {
  __typename?: 'indexed_head_stddev_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate sum on columns */
export type Indexed_Head_Sum_Fields = {
  __typename?: 'indexed_head_sum_fields';
  block_number?: Maybe<Scalars['bigint']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  finalized_block_number?: Maybe<Scalars['bigint']['output']>;
};

/** aggregate var_pop on columns */
export type Indexed_Head_Var_Pop_Fields = {
  __typename?: 'indexed_head_var_pop_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Indexed_Head_Var_Samp_Fields = {
  __typename?: 'indexed_head_var_samp_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Indexed_Head_Variance_Fields = {
  __typename?: 'indexed_head_variance_fields';
  block_number?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  finalized_block_number?: Maybe<Scalars['Float']['output']>;
};

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']['input']>;
  _eq?: InputMaybe<Scalars['jsonb']['input']>;
  _gt?: InputMaybe<Scalars['jsonb']['input']>;
  _gte?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']['input']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']['input']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['jsonb']['input']>;
  _lte?: InputMaybe<Scalars['jsonb']['input']>;
  _neq?: InputMaybe<Scalars['jsonb']['input']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']['input']>>;
};

/** columns and relationships of "api.creators" */
export type Lsp4_Creator = {
  __typename?: 'lsp4_creator';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  creatorProfile?: Maybe<Universal_Profile>;
  creator_address?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

/** aggregated selection of "api.creators" */
export type Lsp4_Creator_Aggregate = {
  __typename?: 'lsp4_creator_aggregate';
  aggregate?: Maybe<Lsp4_Creator_Aggregate_Fields>;
  nodes: Array<Lsp4_Creator>;
};

export type Lsp4_Creator_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Lsp4_Creator_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Lsp4_Creator_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Lsp4_Creator_Aggregate_Bool_Exp_Count>;
};

export type Lsp4_Creator_Aggregate_Bool_Exp_Bool_And = {
  arguments: Lsp4_Creator_Select_Column_Lsp4_Creator_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Lsp4_Creator_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Lsp4_Creator_Select_Column_Lsp4_Creator_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Lsp4_Creator_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.creators" */
export type Lsp4_Creator_Aggregate_Fields = {
  __typename?: 'lsp4_creator_aggregate_fields';
  avg?: Maybe<Lsp4_Creator_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Lsp4_Creator_Max_Fields>;
  min?: Maybe<Lsp4_Creator_Min_Fields>;
  stddev?: Maybe<Lsp4_Creator_Stddev_Fields>;
  stddev_pop?: Maybe<Lsp4_Creator_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Lsp4_Creator_Stddev_Samp_Fields>;
  sum?: Maybe<Lsp4_Creator_Sum_Fields>;
  var_pop?: Maybe<Lsp4_Creator_Var_Pop_Fields>;
  var_samp?: Maybe<Lsp4_Creator_Var_Samp_Fields>;
  variance?: Maybe<Lsp4_Creator_Variance_Fields>;
};


/** aggregate fields of "api.creators" */
export type Lsp4_Creator_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.creators" */
export type Lsp4_Creator_Aggregate_Order_By = {
  avg?: InputMaybe<Lsp4_Creator_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Lsp4_Creator_Max_Order_By>;
  min?: InputMaybe<Lsp4_Creator_Min_Order_By>;
  stddev?: InputMaybe<Lsp4_Creator_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Lsp4_Creator_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Lsp4_Creator_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Lsp4_Creator_Sum_Order_By>;
  var_pop?: InputMaybe<Lsp4_Creator_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Lsp4_Creator_Var_Samp_Order_By>;
  variance?: InputMaybe<Lsp4_Creator_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Lsp4_Creator_Avg_Fields = {
  __typename?: 'lsp4_creator_avg_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.creators" */
export type Lsp4_Creator_Avg_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.creators". All fields are combined with a logical 'AND'. */
export type Lsp4_Creator_Bool_Exp = {
  _and?: InputMaybe<Array<Lsp4_Creator_Bool_Exp>>;
  _not?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  _or?: InputMaybe<Array<Lsp4_Creator_Bool_Exp>>;
  array_index?: InputMaybe<Numeric_Comparison_Exp>;
  asset_address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  creatorProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
  creator_address?: InputMaybe<String_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  interface_id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  verified?: InputMaybe<Boolean_Comparison_Exp>;
};

/** aggregate max on columns */
export type Lsp4_Creator_Max_Fields = {
  __typename?: 'lsp4_creator_max_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  creator_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.creators" */
export type Lsp4_Creator_Max_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  creator_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Lsp4_Creator_Min_Fields = {
  __typename?: 'lsp4_creator_min_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  creator_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.creators" */
export type Lsp4_Creator_Min_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  creator_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.creators". */
export type Lsp4_Creator_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  creatorProfile?: InputMaybe<Universal_Profile_Order_By>;
  creator_address?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  verified?: InputMaybe<Order_By>;
};

/** select columns of table "api.creators" */
export type Lsp4_Creator_Select_Column =
  /** column name */
  | 'array_index'
  /** column name */
  | 'asset_address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'creator_address'
  /** column name */
  | 'id'
  /** column name */
  | 'interface_id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'verified';

/** select "lsp4_creator_aggregate_bool_exp_bool_and_arguments_columns" columns of table "api.creators" */
export type Lsp4_Creator_Select_Column_Lsp4_Creator_Aggregate_Bool_Exp_Bool_And_Arguments_Columns =
  /** column name */
  | 'verified';

/** select "lsp4_creator_aggregate_bool_exp_bool_or_arguments_columns" columns of table "api.creators" */
export type Lsp4_Creator_Select_Column_Lsp4_Creator_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns =
  /** column name */
  | 'verified';

/** aggregate stddev on columns */
export type Lsp4_Creator_Stddev_Fields = {
  __typename?: 'lsp4_creator_stddev_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.creators" */
export type Lsp4_Creator_Stddev_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Lsp4_Creator_Stddev_Pop_Fields = {
  __typename?: 'lsp4_creator_stddev_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.creators" */
export type Lsp4_Creator_Stddev_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Lsp4_Creator_Stddev_Samp_Fields = {
  __typename?: 'lsp4_creator_stddev_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.creators" */
export type Lsp4_Creator_Stddev_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Lsp4_Creator_Sum_Fields = {
  __typename?: 'lsp4_creator_sum_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.creators" */
export type Lsp4_Creator_Sum_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Lsp4_Creator_Var_Pop_Fields = {
  __typename?: 'lsp4_creator_var_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.creators" */
export type Lsp4_Creator_Var_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Lsp4_Creator_Var_Samp_Fields = {
  __typename?: 'lsp4_creator_var_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.creators" */
export type Lsp4_Creator_Var_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Lsp4_Creator_Variance_Fields = {
  __typename?: 'lsp4_creator_variance_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.creators" */
export type Lsp4_Creator_Variance_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.controllers" */
export type Lsp6_Controller = {
  __typename?: 'lsp6_controller';
  allowed_calls?: Maybe<Scalars['jsonb']['output']>;
  allowed_data_keys?: Maybe<Scalars['jsonb']['output']>;
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  controllerProfile?: Maybe<Universal_Profile>;
  controller_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  profile_address?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};


/** columns and relationships of "api.controllers" */
export type Lsp6_ControllerAllowed_CallsArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};


/** columns and relationships of "api.controllers" */
export type Lsp6_ControllerAllowed_Data_KeysArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "api.controllers" */
export type Lsp6_Controller_Aggregate = {
  __typename?: 'lsp6_controller_aggregate';
  aggregate?: Maybe<Lsp6_Controller_Aggregate_Fields>;
  nodes: Array<Lsp6_Controller>;
};

export type Lsp6_Controller_Aggregate_Bool_Exp = {
  count?: InputMaybe<Lsp6_Controller_Aggregate_Bool_Exp_Count>;
};

export type Lsp6_Controller_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lsp6_Controller_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.controllers" */
export type Lsp6_Controller_Aggregate_Fields = {
  __typename?: 'lsp6_controller_aggregate_fields';
  avg?: Maybe<Lsp6_Controller_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Lsp6_Controller_Max_Fields>;
  min?: Maybe<Lsp6_Controller_Min_Fields>;
  stddev?: Maybe<Lsp6_Controller_Stddev_Fields>;
  stddev_pop?: Maybe<Lsp6_Controller_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Lsp6_Controller_Stddev_Samp_Fields>;
  sum?: Maybe<Lsp6_Controller_Sum_Fields>;
  var_pop?: Maybe<Lsp6_Controller_Var_Pop_Fields>;
  var_samp?: Maybe<Lsp6_Controller_Var_Samp_Fields>;
  variance?: Maybe<Lsp6_Controller_Variance_Fields>;
};


/** aggregate fields of "api.controllers" */
export type Lsp6_Controller_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.controllers" */
export type Lsp6_Controller_Aggregate_Order_By = {
  avg?: InputMaybe<Lsp6_Controller_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Lsp6_Controller_Max_Order_By>;
  min?: InputMaybe<Lsp6_Controller_Min_Order_By>;
  stddev?: InputMaybe<Lsp6_Controller_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Lsp6_Controller_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Lsp6_Controller_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Lsp6_Controller_Sum_Order_By>;
  var_pop?: InputMaybe<Lsp6_Controller_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Lsp6_Controller_Var_Samp_Order_By>;
  variance?: InputMaybe<Lsp6_Controller_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Lsp6_Controller_Avg_Fields = {
  __typename?: 'lsp6_controller_avg_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.controllers" */
export type Lsp6_Controller_Avg_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.controllers". All fields are combined with a logical 'AND'. */
export type Lsp6_Controller_Bool_Exp = {
  _and?: InputMaybe<Array<Lsp6_Controller_Bool_Exp>>;
  _not?: InputMaybe<Lsp6_Controller_Bool_Exp>;
  _or?: InputMaybe<Array<Lsp6_Controller_Bool_Exp>>;
  allowed_calls?: InputMaybe<Jsonb_Comparison_Exp>;
  allowed_data_keys?: InputMaybe<Jsonb_Comparison_Exp>;
  array_index?: InputMaybe<Numeric_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  controllerProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
  controller_address?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  permissions?: InputMaybe<String_Comparison_Exp>;
  profile_address?: InputMaybe<String_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Lsp6_Controller_Max_Fields = {
  __typename?: 'lsp6_controller_max_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  controller_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  profile_address?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.controllers" */
export type Lsp6_Controller_Max_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  controller_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  permissions?: InputMaybe<Order_By>;
  profile_address?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Lsp6_Controller_Min_Fields = {
  __typename?: 'lsp6_controller_min_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  controller_address?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  permissions?: Maybe<Scalars['String']['output']>;
  profile_address?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.controllers" */
export type Lsp6_Controller_Min_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  controller_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  permissions?: InputMaybe<Order_By>;
  profile_address?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.controllers". */
export type Lsp6_Controller_Order_By = {
  allowed_calls?: InputMaybe<Order_By>;
  allowed_data_keys?: InputMaybe<Order_By>;
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  controllerProfile?: InputMaybe<Universal_Profile_Order_By>;
  controller_address?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  permissions?: InputMaybe<Order_By>;
  profile_address?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.controllers" */
export type Lsp6_Controller_Select_Column =
  /** column name */
  | 'allowed_calls'
  /** column name */
  | 'allowed_data_keys'
  /** column name */
  | 'array_index'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'controller_address'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'permissions'
  /** column name */
  | 'profile_address';

/** aggregate stddev on columns */
export type Lsp6_Controller_Stddev_Fields = {
  __typename?: 'lsp6_controller_stddev_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.controllers" */
export type Lsp6_Controller_Stddev_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Lsp6_Controller_Stddev_Pop_Fields = {
  __typename?: 'lsp6_controller_stddev_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.controllers" */
export type Lsp6_Controller_Stddev_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Lsp6_Controller_Stddev_Samp_Fields = {
  __typename?: 'lsp6_controller_stddev_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.controllers" */
export type Lsp6_Controller_Stddev_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Lsp6_Controller_Sum_Fields = {
  __typename?: 'lsp6_controller_sum_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.controllers" */
export type Lsp6_Controller_Sum_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Lsp6_Controller_Var_Pop_Fields = {
  __typename?: 'lsp6_controller_var_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.controllers" */
export type Lsp6_Controller_Var_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Lsp6_Controller_Var_Samp_Fields = {
  __typename?: 'lsp6_controller_var_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.controllers" */
export type Lsp6_Controller_Var_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Lsp6_Controller_Variance_Fields = {
  __typename?: 'lsp6_controller_variance_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.controllers" */
export type Lsp6_Controller_Variance_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.issued_assets" */
export type Lsp12_Issued_Asset = {
  __typename?: 'lsp12_issued_asset';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  issuer_address?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};

/** aggregated selection of "api.issued_assets" */
export type Lsp12_Issued_Asset_Aggregate = {
  __typename?: 'lsp12_issued_asset_aggregate';
  aggregate?: Maybe<Lsp12_Issued_Asset_Aggregate_Fields>;
  nodes: Array<Lsp12_Issued_Asset>;
};

export type Lsp12_Issued_Asset_Aggregate_Bool_Exp = {
  count?: InputMaybe<Lsp12_Issued_Asset_Aggregate_Bool_Exp_Count>;
};

export type Lsp12_Issued_Asset_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.issued_assets" */
export type Lsp12_Issued_Asset_Aggregate_Fields = {
  __typename?: 'lsp12_issued_asset_aggregate_fields';
  avg?: Maybe<Lsp12_Issued_Asset_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Lsp12_Issued_Asset_Max_Fields>;
  min?: Maybe<Lsp12_Issued_Asset_Min_Fields>;
  stddev?: Maybe<Lsp12_Issued_Asset_Stddev_Fields>;
  stddev_pop?: Maybe<Lsp12_Issued_Asset_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Lsp12_Issued_Asset_Stddev_Samp_Fields>;
  sum?: Maybe<Lsp12_Issued_Asset_Sum_Fields>;
  var_pop?: Maybe<Lsp12_Issued_Asset_Var_Pop_Fields>;
  var_samp?: Maybe<Lsp12_Issued_Asset_Var_Samp_Fields>;
  variance?: Maybe<Lsp12_Issued_Asset_Variance_Fields>;
};


/** aggregate fields of "api.issued_assets" */
export type Lsp12_Issued_Asset_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Aggregate_Order_By = {
  avg?: InputMaybe<Lsp12_Issued_Asset_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Lsp12_Issued_Asset_Max_Order_By>;
  min?: InputMaybe<Lsp12_Issued_Asset_Min_Order_By>;
  stddev?: InputMaybe<Lsp12_Issued_Asset_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Lsp12_Issued_Asset_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Lsp12_Issued_Asset_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Lsp12_Issued_Asset_Sum_Order_By>;
  var_pop?: InputMaybe<Lsp12_Issued_Asset_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Lsp12_Issued_Asset_Var_Samp_Order_By>;
  variance?: InputMaybe<Lsp12_Issued_Asset_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Lsp12_Issued_Asset_Avg_Fields = {
  __typename?: 'lsp12_issued_asset_avg_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Avg_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.issued_assets". All fields are combined with a logical 'AND'. */
export type Lsp12_Issued_Asset_Bool_Exp = {
  _and?: InputMaybe<Array<Lsp12_Issued_Asset_Bool_Exp>>;
  _not?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  _or?: InputMaybe<Array<Lsp12_Issued_Asset_Bool_Exp>>;
  array_index?: InputMaybe<Numeric_Comparison_Exp>;
  asset_address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  interface_id?: InputMaybe<String_Comparison_Exp>;
  issuer_address?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Lsp12_Issued_Asset_Max_Fields = {
  __typename?: 'lsp12_issued_asset_max_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  issuer_address?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Max_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  issuer_address?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Lsp12_Issued_Asset_Min_Fields = {
  __typename?: 'lsp12_issued_asset_min_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  asset_address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  interface_id?: Maybe<Scalars['String']['output']>;
  issuer_address?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Min_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  issuer_address?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.issued_assets". */
export type Lsp12_Issued_Asset_Order_By = {
  array_index?: InputMaybe<Order_By>;
  asset_address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  id?: InputMaybe<Order_By>;
  interface_id?: InputMaybe<Order_By>;
  issuer_address?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Select_Column =
  /** column name */
  | 'array_index'
  /** column name */
  | 'asset_address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'id'
  /** column name */
  | 'interface_id'
  /** column name */
  | 'issuer_address'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network';

/** aggregate stddev on columns */
export type Lsp12_Issued_Asset_Stddev_Fields = {
  __typename?: 'lsp12_issued_asset_stddev_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Stddev_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Lsp12_Issued_Asset_Stddev_Pop_Fields = {
  __typename?: 'lsp12_issued_asset_stddev_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Stddev_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Lsp12_Issued_Asset_Stddev_Samp_Fields = {
  __typename?: 'lsp12_issued_asset_stddev_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Stddev_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Lsp12_Issued_Asset_Sum_Fields = {
  __typename?: 'lsp12_issued_asset_sum_fields';
  array_index?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Sum_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Lsp12_Issued_Asset_Var_Pop_Fields = {
  __typename?: 'lsp12_issued_asset_var_pop_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Var_Pop_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Lsp12_Issued_Asset_Var_Samp_Fields = {
  __typename?: 'lsp12_issued_asset_var_samp_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Var_Samp_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Lsp12_Issued_Asset_Variance_Fields = {
  __typename?: 'lsp12_issued_asset_variance_fields';
  array_index?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.issued_assets" */
export type Lsp12_Issued_Asset_Variance_Order_By = {
  array_index?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "metadata_kind". All fields are combined with logical 'AND'. */
export type Metadata_Kind_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['metadata_kind']['input']>;
  _gt?: InputMaybe<Scalars['metadata_kind']['input']>;
  _gte?: InputMaybe<Scalars['metadata_kind']['input']>;
  _in?: InputMaybe<Array<Scalars['metadata_kind']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['metadata_kind']['input']>;
  _lte?: InputMaybe<Scalars['metadata_kind']['input']>;
  _neq?: InputMaybe<Scalars['metadata_kind']['input']>;
  _nin?: InputMaybe<Array<Scalars['metadata_kind']['input']>>;
};

/** columns and relationships of "api.metadata_revisions" */
export type Metadata_Revision = {
  __typename?: 'metadata_revision';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  content?: Maybe<Scalars['jsonb']['output']>;
  content_hash?: Maybe<Scalars['String']['output']>;
  content_length?: Maybe<Scalars['Int']['output']>;
  content_type?: Maybe<Scalars['String']['output']>;
  content_uri?: Maybe<Scalars['String']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  fetched_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  is_current?: Maybe<Scalars['Boolean']['output']>;
  kind?: Maybe<Scalars['metadata_kind']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  nft?: Maybe<Nft>;
  source_revision?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};


/** columns and relationships of "api.metadata_revisions" */
export type Metadata_RevisionContentArgs = {
  path?: InputMaybe<Scalars['String']['input']>;
};

/** aggregated selection of "api.metadata_revisions" */
export type Metadata_Revision_Aggregate = {
  __typename?: 'metadata_revision_aggregate';
  aggregate?: Maybe<Metadata_Revision_Aggregate_Fields>;
  nodes: Array<Metadata_Revision>;
};

export type Metadata_Revision_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp_Count>;
};

export type Metadata_Revision_Aggregate_Bool_Exp_Bool_And = {
  arguments: Metadata_Revision_Select_Column_Metadata_Revision_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Metadata_Revision_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Metadata_Revision_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Metadata_Revision_Select_Column_Metadata_Revision_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Metadata_Revision_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Metadata_Revision_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Metadata_Revision_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.metadata_revisions" */
export type Metadata_Revision_Aggregate_Fields = {
  __typename?: 'metadata_revision_aggregate_fields';
  avg?: Maybe<Metadata_Revision_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Metadata_Revision_Max_Fields>;
  min?: Maybe<Metadata_Revision_Min_Fields>;
  stddev?: Maybe<Metadata_Revision_Stddev_Fields>;
  stddev_pop?: Maybe<Metadata_Revision_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Metadata_Revision_Stddev_Samp_Fields>;
  sum?: Maybe<Metadata_Revision_Sum_Fields>;
  var_pop?: Maybe<Metadata_Revision_Var_Pop_Fields>;
  var_samp?: Maybe<Metadata_Revision_Var_Samp_Fields>;
  variance?: Maybe<Metadata_Revision_Variance_Fields>;
};


/** aggregate fields of "api.metadata_revisions" */
export type Metadata_Revision_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.metadata_revisions" */
export type Metadata_Revision_Aggregate_Order_By = {
  avg?: InputMaybe<Metadata_Revision_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Metadata_Revision_Max_Order_By>;
  min?: InputMaybe<Metadata_Revision_Min_Order_By>;
  stddev?: InputMaybe<Metadata_Revision_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Metadata_Revision_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Metadata_Revision_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Metadata_Revision_Sum_Order_By>;
  var_pop?: InputMaybe<Metadata_Revision_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Metadata_Revision_Var_Samp_Order_By>;
  variance?: InputMaybe<Metadata_Revision_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Metadata_Revision_Avg_Fields = {
  __typename?: 'metadata_revision_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Avg_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.metadata_revisions". All fields are combined with a logical 'AND'. */
export type Metadata_Revision_Bool_Exp = {
  _and?: InputMaybe<Array<Metadata_Revision_Bool_Exp>>;
  _not?: InputMaybe<Metadata_Revision_Bool_Exp>;
  _or?: InputMaybe<Array<Metadata_Revision_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  content?: InputMaybe<Jsonb_Comparison_Exp>;
  content_hash?: InputMaybe<String_Comparison_Exp>;
  content_length?: InputMaybe<Int_Comparison_Exp>;
  content_type?: InputMaybe<String_Comparison_Exp>;
  content_uri?: InputMaybe<String_Comparison_Exp>;
  data_key?: InputMaybe<String_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  fetched_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  is_current?: InputMaybe<Boolean_Comparison_Exp>;
  kind?: InputMaybe<Metadata_Kind_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  nft?: InputMaybe<Nft_Bool_Exp>;
  source_revision?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Metadata_Revision_Max_Fields = {
  __typename?: 'metadata_revision_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  content_hash?: Maybe<Scalars['String']['output']>;
  content_length?: Maybe<Scalars['Int']['output']>;
  content_type?: Maybe<Scalars['String']['output']>;
  content_uri?: Maybe<Scalars['String']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  fetched_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Scalars['metadata_kind']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  source_revision?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Max_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  content_hash?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  content_type?: InputMaybe<Order_By>;
  content_uri?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  fetched_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  kind?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  source_revision?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Metadata_Revision_Min_Fields = {
  __typename?: 'metadata_revision_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  content_hash?: Maybe<Scalars['String']['output']>;
  content_length?: Maybe<Scalars['Int']['output']>;
  content_type?: Maybe<Scalars['String']['output']>;
  content_uri?: Maybe<Scalars['String']['output']>;
  data_key?: Maybe<Scalars['String']['output']>;
  fetched_at?: Maybe<Scalars['timestamptz']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  kind?: Maybe<Scalars['metadata_kind']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  source_revision?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Min_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  content_hash?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  content_type?: InputMaybe<Order_By>;
  content_uri?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  fetched_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  kind?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  source_revision?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.metadata_revisions". */
export type Metadata_Revision_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  content?: InputMaybe<Order_By>;
  content_hash?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  content_type?: InputMaybe<Order_By>;
  content_uri?: InputMaybe<Order_By>;
  data_key?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  fetched_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_current?: InputMaybe<Order_By>;
  kind?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  nft?: InputMaybe<Nft_Order_By>;
  source_revision?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.metadata_revisions" */
export type Metadata_Revision_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'content'
  /** column name */
  | 'content_hash'
  /** column name */
  | 'content_length'
  /** column name */
  | 'content_type'
  /** column name */
  | 'content_uri'
  /** column name */
  | 'data_key'
  /** column name */
  | 'fetched_at'
  /** column name */
  | 'id'
  /** column name */
  | 'is_current'
  /** column name */
  | 'kind'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'source_revision'
  /** column name */
  | 'token_id';

/** select "metadata_revision_aggregate_bool_exp_bool_and_arguments_columns" columns of table "api.metadata_revisions" */
export type Metadata_Revision_Select_Column_Metadata_Revision_Aggregate_Bool_Exp_Bool_And_Arguments_Columns =
  /** column name */
  | 'is_current';

/** select "metadata_revision_aggregate_bool_exp_bool_or_arguments_columns" columns of table "api.metadata_revisions" */
export type Metadata_Revision_Select_Column_Metadata_Revision_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns =
  /** column name */
  | 'is_current';

/** aggregate stddev on columns */
export type Metadata_Revision_Stddev_Fields = {
  __typename?: 'metadata_revision_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Stddev_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Metadata_Revision_Stddev_Pop_Fields = {
  __typename?: 'metadata_revision_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Stddev_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Metadata_Revision_Stddev_Samp_Fields = {
  __typename?: 'metadata_revision_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Stddev_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Metadata_Revision_Sum_Fields = {
  __typename?: 'metadata_revision_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  content_length?: Maybe<Scalars['Int']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Sum_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Metadata_Revision_Var_Pop_Fields = {
  __typename?: 'metadata_revision_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Var_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Metadata_Revision_Var_Samp_Fields = {
  __typename?: 'metadata_revision_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Var_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Metadata_Revision_Variance_Fields = {
  __typename?: 'metadata_revision_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  content_length?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.metadata_revisions" */
export type Metadata_Revision_Variance_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  content_length?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.nfts" */
export type Nft = {
  __typename?: 'nft';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  chillwhales?: Maybe<Chillwhales_Nft>;
  /** An array relationship */
  dataValues: Array<Data_Value>;
  /** An aggregate relationship */
  dataValues_aggregate: Data_Value_Aggregate;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  formatted_token_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  is_burned?: Maybe<Scalars['Boolean']['output']>;
  is_minted?: Maybe<Scalars['Boolean']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  /** An array relationship */
  metadataRevisions: Array<Metadata_Revision>;
  /** An aggregate relationship */
  metadataRevisions_aggregate: Metadata_Revision_Aggregate;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  ownedToken?: Maybe<Owned_Token>;
  /** An array relationship */
  ownedTokens: Array<Owned_Token>;
  /** An aggregate relationship */
  ownedTokens_aggregate: Owned_Token_Aggregate;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
  token_uri?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};


/** columns and relationships of "api.nfts" */
export type NftDataValuesArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.nfts" */
export type NftDataValues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.nfts" */
export type NftMetadataRevisionsArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.nfts" */
export type NftMetadataRevisions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.nfts" */
export type NftOwnedTokensArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


/** columns and relationships of "api.nfts" */
export type NftOwnedTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};

/** aggregated selection of "api.nfts" */
export type Nft_Aggregate = {
  __typename?: 'nft_aggregate';
  aggregate?: Maybe<Nft_Aggregate_Fields>;
  nodes: Array<Nft>;
};

export type Nft_Aggregate_Bool_Exp = {
  bool_and?: InputMaybe<Nft_Aggregate_Bool_Exp_Bool_And>;
  bool_or?: InputMaybe<Nft_Aggregate_Bool_Exp_Bool_Or>;
  count?: InputMaybe<Nft_Aggregate_Bool_Exp_Count>;
};

export type Nft_Aggregate_Bool_Exp_Bool_And = {
  arguments: Nft_Select_Column_Nft_Aggregate_Bool_Exp_Bool_And_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Nft_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Nft_Aggregate_Bool_Exp_Bool_Or = {
  arguments: Nft_Select_Column_Nft_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Nft_Bool_Exp>;
  predicate: Boolean_Comparison_Exp;
};

export type Nft_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Nft_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Nft_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.nfts" */
export type Nft_Aggregate_Fields = {
  __typename?: 'nft_aggregate_fields';
  avg?: Maybe<Nft_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Nft_Max_Fields>;
  min?: Maybe<Nft_Min_Fields>;
  stddev?: Maybe<Nft_Stddev_Fields>;
  stddev_pop?: Maybe<Nft_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Nft_Stddev_Samp_Fields>;
  sum?: Maybe<Nft_Sum_Fields>;
  var_pop?: Maybe<Nft_Var_Pop_Fields>;
  var_samp?: Maybe<Nft_Var_Samp_Fields>;
  variance?: Maybe<Nft_Variance_Fields>;
};


/** aggregate fields of "api.nfts" */
export type Nft_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Nft_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.nfts" */
export type Nft_Aggregate_Order_By = {
  avg?: InputMaybe<Nft_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Nft_Max_Order_By>;
  min?: InputMaybe<Nft_Min_Order_By>;
  stddev?: InputMaybe<Nft_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Nft_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Nft_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Nft_Sum_Order_By>;
  var_pop?: InputMaybe<Nft_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Nft_Var_Samp_Order_By>;
  variance?: InputMaybe<Nft_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Nft_Avg_Fields = {
  __typename?: 'nft_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.nfts" */
export type Nft_Avg_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.nfts". All fields are combined with a logical 'AND'. */
export type Nft_Bool_Exp = {
  _and?: InputMaybe<Array<Nft_Bool_Exp>>;
  _not?: InputMaybe<Nft_Bool_Exp>;
  _or?: InputMaybe<Array<Nft_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  chillwhales?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
  dataValues?: InputMaybe<Data_Value_Bool_Exp>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Bool_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  formatted_token_id?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  is_burned?: InputMaybe<Boolean_Comparison_Exp>;
  is_minted?: InputMaybe<Boolean_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  metadataRevisions?: InputMaybe<Metadata_Revision_Bool_Exp>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  ownedToken?: InputMaybe<Owned_Token_Bool_Exp>;
  ownedTokens?: InputMaybe<Owned_Token_Bool_Exp>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Bool_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  token_uri?: InputMaybe<String_Comparison_Exp>;
  verification?: InputMaybe<Verification_Status_Comparison_Exp>;
};

/** aggregate max on columns */
export type Nft_Max_Fields = {
  __typename?: 'nft_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  formatted_token_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
  token_uri?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** order by max() on columns of table "api.nfts" */
export type Nft_Max_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  formatted_token_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_uri?: InputMaybe<Order_By>;
  verification?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Nft_Min_Fields = {
  __typename?: 'nft_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  formatted_token_id?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
  token_uri?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** order by min() on columns of table "api.nfts" */
export type Nft_Min_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  formatted_token_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_uri?: InputMaybe<Order_By>;
  verification?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.nfts". */
export type Nft_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  chillwhales?: InputMaybe<Chillwhales_Nft_Order_By>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  formatted_token_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  is_burned?: InputMaybe<Order_By>;
  is_minted?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Order_By>;
  network?: InputMaybe<Order_By>;
  ownedToken?: InputMaybe<Owned_Token_Order_By>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  token_uri?: InputMaybe<Order_By>;
  verification?: InputMaybe<Order_By>;
};

/** select columns of table "api.nfts" */
export type Nft_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'formatted_token_id'
  /** column name */
  | 'id'
  /** column name */
  | 'is_burned'
  /** column name */
  | 'is_minted'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'owner_address'
  /** column name */
  | 'token_id'
  /** column name */
  | 'token_uri'
  /** column name */
  | 'verification';

/** select "nft_aggregate_bool_exp_bool_and_arguments_columns" columns of table "api.nfts" */
export type Nft_Select_Column_Nft_Aggregate_Bool_Exp_Bool_And_Arguments_Columns =
  /** column name */
  | 'is_burned'
  /** column name */
  | 'is_minted';

/** select "nft_aggregate_bool_exp_bool_or_arguments_columns" columns of table "api.nfts" */
export type Nft_Select_Column_Nft_Aggregate_Bool_Exp_Bool_Or_Arguments_Columns =
  /** column name */
  | 'is_burned'
  /** column name */
  | 'is_minted';

/** aggregate stddev on columns */
export type Nft_Stddev_Fields = {
  __typename?: 'nft_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.nfts" */
export type Nft_Stddev_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Nft_Stddev_Pop_Fields = {
  __typename?: 'nft_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.nfts" */
export type Nft_Stddev_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Nft_Stddev_Samp_Fields = {
  __typename?: 'nft_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.nfts" */
export type Nft_Stddev_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Nft_Sum_Fields = {
  __typename?: 'nft_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.nfts" */
export type Nft_Sum_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Nft_Var_Pop_Fields = {
  __typename?: 'nft_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.nfts" */
export type Nft_Var_Pop_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Nft_Var_Samp_Fields = {
  __typename?: 'nft_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.nfts" */
export type Nft_Var_Samp_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Nft_Variance_Fields = {
  __typename?: 'nft_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.nfts" */
export type Nft_Variance_Order_By = {
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to compare columns of type "numeric". All fields are combined with logical 'AND'. */
export type Numeric_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['numeric']['input']>;
  _gt?: InputMaybe<Scalars['numeric']['input']>;
  _gte?: InputMaybe<Scalars['numeric']['input']>;
  _in?: InputMaybe<Array<Scalars['numeric']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['numeric']['input']>;
  _lte?: InputMaybe<Scalars['numeric']['input']>;
  _neq?: InputMaybe<Scalars['numeric']['input']>;
  _nin?: InputMaybe<Array<Scalars['numeric']['input']>>;
};

/** column ordering options */
export type Order_By =
  /** in ascending order, nulls last */
  | 'asc'
  /** in ascending order, nulls first */
  | 'asc_nulls_first'
  /** in ascending order, nulls last */
  | 'asc_nulls_last'
  /** in descending order, nulls first */
  | 'desc'
  /** in descending order, nulls first */
  | 'desc_nulls_first'
  /** in descending order, nulls last */
  | 'desc_nulls_last';

/** columns and relationships of "api.owned_assets" */
export type Owned_Asset = {
  __typename?: 'owned_asset';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  tokenIds: Array<Owned_Token>;
  /** An aggregate relationship */
  tokenIds_aggregate: Owned_Token_Aggregate;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};


/** columns and relationships of "api.owned_assets" */
export type Owned_AssetTokenIdsArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


/** columns and relationships of "api.owned_assets" */
export type Owned_AssetTokenIds_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};

/** aggregated selection of "api.owned_assets" */
export type Owned_Asset_Aggregate = {
  __typename?: 'owned_asset_aggregate';
  aggregate?: Maybe<Owned_Asset_Aggregate_Fields>;
  nodes: Array<Owned_Asset>;
};

export type Owned_Asset_Aggregate_Bool_Exp = {
  count?: InputMaybe<Owned_Asset_Aggregate_Bool_Exp_Count>;
};

export type Owned_Asset_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Owned_Asset_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.owned_assets" */
export type Owned_Asset_Aggregate_Fields = {
  __typename?: 'owned_asset_aggregate_fields';
  avg?: Maybe<Owned_Asset_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Owned_Asset_Max_Fields>;
  min?: Maybe<Owned_Asset_Min_Fields>;
  stddev?: Maybe<Owned_Asset_Stddev_Fields>;
  stddev_pop?: Maybe<Owned_Asset_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Owned_Asset_Stddev_Samp_Fields>;
  sum?: Maybe<Owned_Asset_Sum_Fields>;
  var_pop?: Maybe<Owned_Asset_Var_Pop_Fields>;
  var_samp?: Maybe<Owned_Asset_Var_Samp_Fields>;
  variance?: Maybe<Owned_Asset_Variance_Fields>;
};


/** aggregate fields of "api.owned_assets" */
export type Owned_Asset_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.owned_assets" */
export type Owned_Asset_Aggregate_Order_By = {
  avg?: InputMaybe<Owned_Asset_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Owned_Asset_Max_Order_By>;
  min?: InputMaybe<Owned_Asset_Min_Order_By>;
  stddev?: InputMaybe<Owned_Asset_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Owned_Asset_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Owned_Asset_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Owned_Asset_Sum_Order_By>;
  var_pop?: InputMaybe<Owned_Asset_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Owned_Asset_Var_Samp_Order_By>;
  variance?: InputMaybe<Owned_Asset_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Owned_Asset_Avg_Fields = {
  __typename?: 'owned_asset_avg_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.owned_assets" */
export type Owned_Asset_Avg_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.owned_assets". All fields are combined with a logical 'AND'. */
export type Owned_Asset_Bool_Exp = {
  _and?: InputMaybe<Array<Owned_Asset_Bool_Exp>>;
  _not?: InputMaybe<Owned_Asset_Bool_Exp>;
  _or?: InputMaybe<Array<Owned_Asset_Bool_Exp>>;
  asset_address?: InputMaybe<String_Comparison_Exp>;
  balance?: InputMaybe<Numeric_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  tokenIds?: InputMaybe<Owned_Token_Bool_Exp>;
  tokenIds_aggregate?: InputMaybe<Owned_Token_Aggregate_Bool_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Owned_Asset_Max_Fields = {
  __typename?: 'owned_asset_max_fields';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.owned_assets" */
export type Owned_Asset_Max_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Owned_Asset_Min_Fields = {
  __typename?: 'owned_asset_min_fields';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.owned_assets" */
export type Owned_Asset_Min_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.owned_assets". */
export type Owned_Asset_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  tokenIds_aggregate?: InputMaybe<Owned_Token_Aggregate_Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.owned_assets" */
export type Owned_Asset_Select_Column =
  /** column name */
  | 'asset_address'
  /** column name */
  | 'balance'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'owner_address';

/** aggregate stddev on columns */
export type Owned_Asset_Stddev_Fields = {
  __typename?: 'owned_asset_stddev_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.owned_assets" */
export type Owned_Asset_Stddev_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Owned_Asset_Stddev_Pop_Fields = {
  __typename?: 'owned_asset_stddev_pop_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.owned_assets" */
export type Owned_Asset_Stddev_Pop_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Owned_Asset_Stddev_Samp_Fields = {
  __typename?: 'owned_asset_stddev_samp_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.owned_assets" */
export type Owned_Asset_Stddev_Samp_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Owned_Asset_Sum_Fields = {
  __typename?: 'owned_asset_sum_fields';
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.owned_assets" */
export type Owned_Asset_Sum_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Owned_Asset_Var_Pop_Fields = {
  __typename?: 'owned_asset_var_pop_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.owned_assets" */
export type Owned_Asset_Var_Pop_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Owned_Asset_Var_Samp_Fields = {
  __typename?: 'owned_asset_var_samp_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.owned_assets" */
export type Owned_Asset_Var_Samp_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Owned_Asset_Variance_Fields = {
  __typename?: 'owned_asset_variance_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.owned_assets" */
export type Owned_Asset_Variance_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** columns and relationships of "api.owned_tokens" */
export type Owned_Token = {
  __typename?: 'owned_token';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An object relationship */
  digitalAsset?: Maybe<Digital_Asset>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  nft?: Maybe<Nft>;
  /** An object relationship */
  ownedAsset?: Maybe<Owned_Asset>;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
  /** An object relationship */
  universalProfile?: Maybe<Universal_Profile>;
};

/** aggregated selection of "api.owned_tokens" */
export type Owned_Token_Aggregate = {
  __typename?: 'owned_token_aggregate';
  aggregate?: Maybe<Owned_Token_Aggregate_Fields>;
  nodes: Array<Owned_Token>;
};

export type Owned_Token_Aggregate_Bool_Exp = {
  count?: InputMaybe<Owned_Token_Aggregate_Bool_Exp_Count>;
};

export type Owned_Token_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Owned_Token_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Owned_Token_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "api.owned_tokens" */
export type Owned_Token_Aggregate_Fields = {
  __typename?: 'owned_token_aggregate_fields';
  avg?: Maybe<Owned_Token_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Owned_Token_Max_Fields>;
  min?: Maybe<Owned_Token_Min_Fields>;
  stddev?: Maybe<Owned_Token_Stddev_Fields>;
  stddev_pop?: Maybe<Owned_Token_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Owned_Token_Stddev_Samp_Fields>;
  sum?: Maybe<Owned_Token_Sum_Fields>;
  var_pop?: Maybe<Owned_Token_Var_Pop_Fields>;
  var_samp?: Maybe<Owned_Token_Var_Samp_Fields>;
  variance?: Maybe<Owned_Token_Variance_Fields>;
};


/** aggregate fields of "api.owned_tokens" */
export type Owned_Token_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Owned_Token_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** order by aggregate values of table "api.owned_tokens" */
export type Owned_Token_Aggregate_Order_By = {
  avg?: InputMaybe<Owned_Token_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Owned_Token_Max_Order_By>;
  min?: InputMaybe<Owned_Token_Min_Order_By>;
  stddev?: InputMaybe<Owned_Token_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Owned_Token_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Owned_Token_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Owned_Token_Sum_Order_By>;
  var_pop?: InputMaybe<Owned_Token_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Owned_Token_Var_Samp_Order_By>;
  variance?: InputMaybe<Owned_Token_Variance_Order_By>;
};

/** aggregate avg on columns */
export type Owned_Token_Avg_Fields = {
  __typename?: 'owned_token_avg_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by avg() on columns of table "api.owned_tokens" */
export type Owned_Token_Avg_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "api.owned_tokens". All fields are combined with a logical 'AND'. */
export type Owned_Token_Bool_Exp = {
  _and?: InputMaybe<Array<Owned_Token_Bool_Exp>>;
  _not?: InputMaybe<Owned_Token_Bool_Exp>;
  _or?: InputMaybe<Array<Owned_Token_Bool_Exp>>;
  asset_address?: InputMaybe<String_Comparison_Exp>;
  balance?: InputMaybe<Numeric_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  digitalAsset?: InputMaybe<Digital_Asset_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  nft?: InputMaybe<Nft_Bool_Exp>;
  ownedAsset?: InputMaybe<Owned_Asset_Bool_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  token_id?: InputMaybe<String_Comparison_Exp>;
  universalProfile?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** aggregate max on columns */
export type Owned_Token_Max_Fields = {
  __typename?: 'owned_token_max_fields';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by max() on columns of table "api.owned_tokens" */
export type Owned_Token_Max_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** aggregate min on columns */
export type Owned_Token_Min_Fields = {
  __typename?: 'owned_token_min_fields';
  asset_address?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  token_id?: Maybe<Scalars['String']['output']>;
};

/** order by min() on columns of table "api.owned_tokens" */
export type Owned_Token_Min_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "api.owned_tokens". */
export type Owned_Token_Order_By = {
  asset_address?: InputMaybe<Order_By>;
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  digitalAsset?: InputMaybe<Digital_Asset_Order_By>;
  id?: InputMaybe<Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  network?: InputMaybe<Order_By>;
  nft?: InputMaybe<Nft_Order_By>;
  ownedAsset?: InputMaybe<Owned_Asset_Order_By>;
  owner_address?: InputMaybe<Order_By>;
  token_id?: InputMaybe<Order_By>;
  universalProfile?: InputMaybe<Universal_Profile_Order_By>;
};

/** select columns of table "api.owned_tokens" */
export type Owned_Token_Select_Column =
  /** column name */
  | 'asset_address'
  /** column name */
  | 'balance'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'owner_address'
  /** column name */
  | 'token_id';

/** aggregate stddev on columns */
export type Owned_Token_Stddev_Fields = {
  __typename?: 'owned_token_stddev_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev() on columns of table "api.owned_tokens" */
export type Owned_Token_Stddev_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_pop on columns */
export type Owned_Token_Stddev_Pop_Fields = {
  __typename?: 'owned_token_stddev_pop_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_pop() on columns of table "api.owned_tokens" */
export type Owned_Token_Stddev_Pop_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate stddev_samp on columns */
export type Owned_Token_Stddev_Samp_Fields = {
  __typename?: 'owned_token_stddev_samp_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by stddev_samp() on columns of table "api.owned_tokens" */
export type Owned_Token_Stddev_Samp_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate sum on columns */
export type Owned_Token_Sum_Fields = {
  __typename?: 'owned_token_sum_fields';
  balance?: Maybe<Scalars['numeric']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** order by sum() on columns of table "api.owned_tokens" */
export type Owned_Token_Sum_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_pop on columns */
export type Owned_Token_Var_Pop_Fields = {
  __typename?: 'owned_token_var_pop_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_pop() on columns of table "api.owned_tokens" */
export type Owned_Token_Var_Pop_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate var_samp on columns */
export type Owned_Token_Var_Samp_Fields = {
  __typename?: 'owned_token_var_samp_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by var_samp() on columns of table "api.owned_tokens" */
export type Owned_Token_Var_Samp_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

/** aggregate variance on columns */
export type Owned_Token_Variance_Fields = {
  __typename?: 'owned_token_variance_fields';
  balance?: Maybe<Scalars['Float']['output']>;
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** order by variance() on columns of table "api.owned_tokens" */
export type Owned_Token_Variance_Order_By = {
  balance?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
};

export type Query_Root = {
  __typename?: 'query_root';
  /** fetch data from the table: "api.blocks" */
  block: Array<Block>;
  /** fetch aggregated fields from the table: "api.blocks" */
  block_aggregate: Block_Aggregate;
  /** fetch data from the table: "api.chillwhales_nfts" */
  chillwhales_nft: Array<Chillwhales_Nft>;
  /** fetch aggregated fields from the table: "api.chillwhales_nfts" */
  chillwhales_nft_aggregate: Chillwhales_Nft_Aggregate;
  /** fetch data from the table: "api.data_values" */
  data_value: Array<Data_Value>;
  /** fetch aggregated fields from the table: "api.data_values" */
  data_value_aggregate: Data_Value_Aggregate;
  /** fetch data from the table: "api.digital_assets" */
  digital_asset: Array<Digital_Asset>;
  /** fetch aggregated fields from the table: "api.digital_assets" */
  digital_asset_aggregate: Digital_Asset_Aggregate;
  /** fetch data from the table: "api.event_facts" */
  event_fact: Array<Event_Fact>;
  /** fetch aggregated fields from the table: "api.event_facts" */
  event_fact_aggregate: Event_Fact_Aggregate;
  /** fetch data from the table: "api.follower_edges" */
  follower: Array<Follower>;
  /** fetch aggregated fields from the table: "api.follower_edges" */
  follower_aggregate: Follower_Aggregate;
  /** fetch data from the table: "api.indexed_heads" */
  indexed_head: Array<Indexed_Head>;
  /** fetch aggregated fields from the table: "api.indexed_heads" */
  indexed_head_aggregate: Indexed_Head_Aggregate;
  /** fetch data from the table: "api.creators" */
  lsp4_creator: Array<Lsp4_Creator>;
  /** fetch aggregated fields from the table: "api.creators" */
  lsp4_creator_aggregate: Lsp4_Creator_Aggregate;
  /** fetch data from the table: "api.controllers" */
  lsp6_controller: Array<Lsp6_Controller>;
  /** fetch aggregated fields from the table: "api.controllers" */
  lsp6_controller_aggregate: Lsp6_Controller_Aggregate;
  /** fetch data from the table: "api.issued_assets" */
  lsp12_issued_asset: Array<Lsp12_Issued_Asset>;
  /** fetch aggregated fields from the table: "api.issued_assets" */
  lsp12_issued_asset_aggregate: Lsp12_Issued_Asset_Aggregate;
  /** fetch data from the table: "api.metadata_revisions" */
  metadata_revision: Array<Metadata_Revision>;
  /** fetch aggregated fields from the table: "api.metadata_revisions" */
  metadata_revision_aggregate: Metadata_Revision_Aggregate;
  /** fetch data from the table: "api.nfts" */
  nft: Array<Nft>;
  /** fetch aggregated fields from the table: "api.nfts" */
  nft_aggregate: Nft_Aggregate;
  /** fetch data from the table: "api.owned_assets" */
  owned_asset: Array<Owned_Asset>;
  /** fetch aggregated fields from the table: "api.owned_assets" */
  owned_asset_aggregate: Owned_Asset_Aggregate;
  /** fetch data from the table: "api.owned_tokens" */
  owned_token: Array<Owned_Token>;
  /** fetch aggregated fields from the table: "api.owned_tokens" */
  owned_token_aggregate: Owned_Token_Aggregate;
  /** fetch data from the table: "api.universal_profiles" */
  universal_profile: Array<Universal_Profile>;
  /** fetch aggregated fields from the table: "api.universal_profiles" */
  universal_profile_aggregate: Universal_Profile_Aggregate;
};


export type Query_RootBlockArgs = {
  distinct_on?: InputMaybe<Array<Block_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Block_Order_By>>;
  where?: InputMaybe<Block_Bool_Exp>;
};


export type Query_RootBlock_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Block_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Block_Order_By>>;
  where?: InputMaybe<Block_Bool_Exp>;
};


export type Query_RootChillwhales_NftArgs = {
  distinct_on?: InputMaybe<Array<Chillwhales_Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Chillwhales_Nft_Order_By>>;
  where?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
};


export type Query_RootChillwhales_Nft_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Chillwhales_Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Chillwhales_Nft_Order_By>>;
  where?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
};


export type Query_RootData_ValueArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


export type Query_RootData_Value_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


export type Query_RootDigital_AssetArgs = {
  distinct_on?: InputMaybe<Array<Digital_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Digital_Asset_Order_By>>;
  where?: InputMaybe<Digital_Asset_Bool_Exp>;
};


export type Query_RootDigital_Asset_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Digital_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Digital_Asset_Order_By>>;
  where?: InputMaybe<Digital_Asset_Bool_Exp>;
};


export type Query_RootEvent_FactArgs = {
  distinct_on?: InputMaybe<Array<Event_Fact_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Event_Fact_Order_By>>;
  where?: InputMaybe<Event_Fact_Bool_Exp>;
};


export type Query_RootEvent_Fact_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Event_Fact_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Event_Fact_Order_By>>;
  where?: InputMaybe<Event_Fact_Bool_Exp>;
};


export type Query_RootFollowerArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


export type Query_RootFollower_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


export type Query_RootIndexed_HeadArgs = {
  distinct_on?: InputMaybe<Array<Indexed_Head_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Indexed_Head_Order_By>>;
  where?: InputMaybe<Indexed_Head_Bool_Exp>;
};


export type Query_RootIndexed_Head_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Indexed_Head_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Indexed_Head_Order_By>>;
  where?: InputMaybe<Indexed_Head_Bool_Exp>;
};


export type Query_RootLsp4_CreatorArgs = {
  distinct_on?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp4_Creator_Order_By>>;
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
};


export type Query_RootLsp4_Creator_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp4_Creator_Order_By>>;
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
};


export type Query_RootLsp6_ControllerArgs = {
  distinct_on?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp6_Controller_Order_By>>;
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
};


export type Query_RootLsp6_Controller_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp6_Controller_Order_By>>;
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
};


export type Query_RootLsp12_Issued_AssetArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


export type Query_RootLsp12_Issued_Asset_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


export type Query_RootMetadata_RevisionArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


export type Query_RootMetadata_Revision_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


export type Query_RootNftArgs = {
  distinct_on?: InputMaybe<Array<Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Nft_Order_By>>;
  where?: InputMaybe<Nft_Bool_Exp>;
};


export type Query_RootNft_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Nft_Order_By>>;
  where?: InputMaybe<Nft_Bool_Exp>;
};


export type Query_RootOwned_AssetArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


export type Query_RootOwned_Asset_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


export type Query_RootOwned_TokenArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


export type Query_RootOwned_Token_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


export type Query_RootUniversal_ProfileArgs = {
  distinct_on?: InputMaybe<Array<Universal_Profile_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Universal_Profile_Order_By>>;
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
};


export type Query_RootUniversal_Profile_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Universal_Profile_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Universal_Profile_Order_By>>;
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
};

export type Subscription_Root = {
  __typename?: 'subscription_root';
  /** fetch data from the table: "api.blocks" */
  block: Array<Block>;
  /** fetch data from the table: "api.chillwhales_nfts" */
  chillwhales_nft: Array<Chillwhales_Nft>;
  /** fetch data from the table: "api.data_values" */
  data_value: Array<Data_Value>;
  /** fetch data from the table: "api.digital_assets" */
  digital_asset: Array<Digital_Asset>;
  /** fetch data from the table: "api.event_facts" */
  event_fact: Array<Event_Fact>;
  /** fetch data from the table: "api.follower_edges" */
  follower: Array<Follower>;
  /** fetch data from the table: "api.indexed_heads" */
  indexed_head: Array<Indexed_Head>;
  /** fetch data from the table: "api.creators" */
  lsp4_creator: Array<Lsp4_Creator>;
  /** fetch data from the table: "api.controllers" */
  lsp6_controller: Array<Lsp6_Controller>;
  /** fetch data from the table: "api.issued_assets" */
  lsp12_issued_asset: Array<Lsp12_Issued_Asset>;
  /** fetch data from the table: "api.metadata_revisions" */
  metadata_revision: Array<Metadata_Revision>;
  /** fetch data from the table: "api.nfts" */
  nft: Array<Nft>;
  /** fetch data from the table: "api.owned_assets" */
  owned_asset: Array<Owned_Asset>;
  /** fetch data from the table: "api.owned_tokens" */
  owned_token: Array<Owned_Token>;
  /** fetch data from the table: "api.universal_profiles" */
  universal_profile: Array<Universal_Profile>;
};


export type Subscription_RootBlockArgs = {
  distinct_on?: InputMaybe<Array<Block_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Block_Order_By>>;
  where?: InputMaybe<Block_Bool_Exp>;
};


export type Subscription_RootChillwhales_NftArgs = {
  distinct_on?: InputMaybe<Array<Chillwhales_Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Chillwhales_Nft_Order_By>>;
  where?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
};


export type Subscription_RootData_ValueArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


export type Subscription_RootDigital_AssetArgs = {
  distinct_on?: InputMaybe<Array<Digital_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Digital_Asset_Order_By>>;
  where?: InputMaybe<Digital_Asset_Bool_Exp>;
};


export type Subscription_RootEvent_FactArgs = {
  distinct_on?: InputMaybe<Array<Event_Fact_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Event_Fact_Order_By>>;
  where?: InputMaybe<Event_Fact_Bool_Exp>;
};


export type Subscription_RootFollowerArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


export type Subscription_RootIndexed_HeadArgs = {
  distinct_on?: InputMaybe<Array<Indexed_Head_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Indexed_Head_Order_By>>;
  where?: InputMaybe<Indexed_Head_Bool_Exp>;
};


export type Subscription_RootLsp4_CreatorArgs = {
  distinct_on?: InputMaybe<Array<Lsp4_Creator_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp4_Creator_Order_By>>;
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
};


export type Subscription_RootLsp6_ControllerArgs = {
  distinct_on?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp6_Controller_Order_By>>;
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
};


export type Subscription_RootLsp12_Issued_AssetArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


export type Subscription_RootMetadata_RevisionArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


export type Subscription_RootNftArgs = {
  distinct_on?: InputMaybe<Array<Nft_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Nft_Order_By>>;
  where?: InputMaybe<Nft_Bool_Exp>;
};


export type Subscription_RootOwned_AssetArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


export type Subscription_RootOwned_TokenArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


export type Subscription_RootUniversal_ProfileArgs = {
  distinct_on?: InputMaybe<Array<Universal_Profile_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Universal_Profile_Order_By>>;
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']['input']>;
  _gt?: InputMaybe<Scalars['timestamptz']['input']>;
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
  _neq?: InputMaybe<Scalars['timestamptz']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
};

/** columns and relationships of "api.universal_profiles" */
export type Universal_Profile = {
  __typename?: 'universal_profile';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  /** An array relationship */
  controllers: Array<Lsp6_Controller>;
  /** An aggregate relationship */
  controllers_aggregate: Lsp6_Controller_Aggregate;
  /** An array relationship */
  dataValues: Array<Data_Value>;
  /** An aggregate relationship */
  dataValues_aggregate: Data_Value_Aggregate;
  /** An array relationship */
  followed: Array<Follower>;
  /** An array relationship */
  followedBy: Array<Follower>;
  /** An aggregate relationship */
  followedBy_aggregate: Follower_Aggregate;
  /** An aggregate relationship */
  followed_aggregate: Follower_Aggregate;
  id?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  issuedAssets: Array<Lsp12_Issued_Asset>;
  /** An aggregate relationship */
  issuedAssets_aggregate: Lsp12_Issued_Asset_Aggregate;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  /** An array relationship */
  metadataRevisions: Array<Metadata_Revision>;
  /** An aggregate relationship */
  metadataRevisions_aggregate: Metadata_Revision_Aggregate;
  network?: Maybe<Scalars['String']['output']>;
  /** An array relationship */
  ownedAssets: Array<Owned_Asset>;
  /** An aggregate relationship */
  ownedAssets_aggregate: Owned_Asset_Aggregate;
  /** An array relationship */
  ownedTokens: Array<Owned_Token>;
  /** An aggregate relationship */
  ownedTokens_aggregate: Owned_Token_Aggregate;
  owner_address?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileControllersArgs = {
  distinct_on?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp6_Controller_Order_By>>;
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileControllers_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp6_Controller_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp6_Controller_Order_By>>;
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileDataValuesArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileDataValues_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Data_Value_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Data_Value_Order_By>>;
  where?: InputMaybe<Data_Value_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileFollowedArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileFollowedByArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileFollowedBy_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileFollowed_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Follower_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Follower_Order_By>>;
  where?: InputMaybe<Follower_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileIssuedAssetsArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileIssuedAssets_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Lsp12_Issued_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By>>;
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileMetadataRevisionsArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileMetadataRevisions_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Metadata_Revision_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Metadata_Revision_Order_By>>;
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileOwnedAssetsArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileOwnedAssets_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Asset_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Asset_Order_By>>;
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileOwnedTokensArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};


/** columns and relationships of "api.universal_profiles" */
export type Universal_ProfileOwnedTokens_AggregateArgs = {
  distinct_on?: InputMaybe<Array<Owned_Token_Select_Column>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order_by?: InputMaybe<Array<Owned_Token_Order_By>>;
  where?: InputMaybe<Owned_Token_Bool_Exp>;
};

/** aggregated selection of "api.universal_profiles" */
export type Universal_Profile_Aggregate = {
  __typename?: 'universal_profile_aggregate';
  aggregate?: Maybe<Universal_Profile_Aggregate_Fields>;
  nodes: Array<Universal_Profile>;
};

/** aggregate fields of "api.universal_profiles" */
export type Universal_Profile_Aggregate_Fields = {
  __typename?: 'universal_profile_aggregate_fields';
  avg?: Maybe<Universal_Profile_Avg_Fields>;
  count: Scalars['Int']['output'];
  max?: Maybe<Universal_Profile_Max_Fields>;
  min?: Maybe<Universal_Profile_Min_Fields>;
  stddev?: Maybe<Universal_Profile_Stddev_Fields>;
  stddev_pop?: Maybe<Universal_Profile_Stddev_Pop_Fields>;
  stddev_samp?: Maybe<Universal_Profile_Stddev_Samp_Fields>;
  sum?: Maybe<Universal_Profile_Sum_Fields>;
  var_pop?: Maybe<Universal_Profile_Var_Pop_Fields>;
  var_samp?: Maybe<Universal_Profile_Var_Samp_Fields>;
  variance?: Maybe<Universal_Profile_Variance_Fields>;
};


/** aggregate fields of "api.universal_profiles" */
export type Universal_Profile_Aggregate_FieldsCountArgs = {
  columns?: InputMaybe<Array<Universal_Profile_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
};

/** aggregate avg on columns */
export type Universal_Profile_Avg_Fields = {
  __typename?: 'universal_profile_avg_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to filter rows from the table "api.universal_profiles". All fields are combined with a logical 'AND'. */
export type Universal_Profile_Bool_Exp = {
  _and?: InputMaybe<Array<Universal_Profile_Bool_Exp>>;
  _not?: InputMaybe<Universal_Profile_Bool_Exp>;
  _or?: InputMaybe<Array<Universal_Profile_Bool_Exp>>;
  address?: InputMaybe<String_Comparison_Exp>;
  chain_id?: InputMaybe<Bigint_Comparison_Exp>;
  controllers?: InputMaybe<Lsp6_Controller_Bool_Exp>;
  controllers_aggregate?: InputMaybe<Lsp6_Controller_Aggregate_Bool_Exp>;
  dataValues?: InputMaybe<Data_Value_Bool_Exp>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Bool_Exp>;
  followed?: InputMaybe<Follower_Bool_Exp>;
  followedBy?: InputMaybe<Follower_Bool_Exp>;
  followedBy_aggregate?: InputMaybe<Follower_Aggregate_Bool_Exp>;
  followed_aggregate?: InputMaybe<Follower_Aggregate_Bool_Exp>;
  id?: InputMaybe<String_Comparison_Exp>;
  issuedAssets?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  issuedAssets_aggregate?: InputMaybe<Lsp12_Issued_Asset_Aggregate_Bool_Exp>;
  last_block_hash?: InputMaybe<String_Comparison_Exp>;
  last_block_number?: InputMaybe<Bigint_Comparison_Exp>;
  last_log_index?: InputMaybe<Int_Comparison_Exp>;
  last_transaction_hash?: InputMaybe<String_Comparison_Exp>;
  last_transaction_index?: InputMaybe<Int_Comparison_Exp>;
  metadataRevisions?: InputMaybe<Metadata_Revision_Bool_Exp>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Bool_Exp>;
  network?: InputMaybe<String_Comparison_Exp>;
  ownedAssets?: InputMaybe<Owned_Asset_Bool_Exp>;
  ownedAssets_aggregate?: InputMaybe<Owned_Asset_Aggregate_Bool_Exp>;
  ownedTokens?: InputMaybe<Owned_Token_Bool_Exp>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Bool_Exp>;
  owner_address?: InputMaybe<String_Comparison_Exp>;
  verification?: InputMaybe<Verification_Status_Comparison_Exp>;
};

/** aggregate max on columns */
export type Universal_Profile_Max_Fields = {
  __typename?: 'universal_profile_max_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** aggregate min on columns */
export type Universal_Profile_Min_Fields = {
  __typename?: 'universal_profile_min_fields';
  address?: Maybe<Scalars['String']['output']>;
  chain_id?: Maybe<Scalars['bigint']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  last_block_hash?: Maybe<Scalars['String']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_hash?: Maybe<Scalars['String']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
  network?: Maybe<Scalars['String']['output']>;
  owner_address?: Maybe<Scalars['String']['output']>;
  verification?: Maybe<Scalars['verification_status']['output']>;
};

/** Ordering options when selecting data from "api.universal_profiles". */
export type Universal_Profile_Order_By = {
  address?: InputMaybe<Order_By>;
  chain_id?: InputMaybe<Order_By>;
  controllers_aggregate?: InputMaybe<Lsp6_Controller_Aggregate_Order_By>;
  dataValues_aggregate?: InputMaybe<Data_Value_Aggregate_Order_By>;
  followedBy_aggregate?: InputMaybe<Follower_Aggregate_Order_By>;
  followed_aggregate?: InputMaybe<Follower_Aggregate_Order_By>;
  id?: InputMaybe<Order_By>;
  issuedAssets_aggregate?: InputMaybe<Lsp12_Issued_Asset_Aggregate_Order_By>;
  last_block_hash?: InputMaybe<Order_By>;
  last_block_number?: InputMaybe<Order_By>;
  last_log_index?: InputMaybe<Order_By>;
  last_transaction_hash?: InputMaybe<Order_By>;
  last_transaction_index?: InputMaybe<Order_By>;
  metadataRevisions_aggregate?: InputMaybe<Metadata_Revision_Aggregate_Order_By>;
  network?: InputMaybe<Order_By>;
  ownedAssets_aggregate?: InputMaybe<Owned_Asset_Aggregate_Order_By>;
  ownedTokens_aggregate?: InputMaybe<Owned_Token_Aggregate_Order_By>;
  owner_address?: InputMaybe<Order_By>;
  verification?: InputMaybe<Order_By>;
};

/** select columns of table "api.universal_profiles" */
export type Universal_Profile_Select_Column =
  /** column name */
  | 'address'
  /** column name */
  | 'chain_id'
  /** column name */
  | 'id'
  /** column name */
  | 'last_block_hash'
  /** column name */
  | 'last_block_number'
  /** column name */
  | 'last_log_index'
  /** column name */
  | 'last_transaction_hash'
  /** column name */
  | 'last_transaction_index'
  /** column name */
  | 'network'
  /** column name */
  | 'owner_address'
  /** column name */
  | 'verification';

/** aggregate stddev on columns */
export type Universal_Profile_Stddev_Fields = {
  __typename?: 'universal_profile_stddev_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_pop on columns */
export type Universal_Profile_Stddev_Pop_Fields = {
  __typename?: 'universal_profile_stddev_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate stddev_samp on columns */
export type Universal_Profile_Stddev_Samp_Fields = {
  __typename?: 'universal_profile_stddev_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate sum on columns */
export type Universal_Profile_Sum_Fields = {
  __typename?: 'universal_profile_sum_fields';
  chain_id?: Maybe<Scalars['bigint']['output']>;
  last_block_number?: Maybe<Scalars['bigint']['output']>;
  last_log_index?: Maybe<Scalars['Int']['output']>;
  last_transaction_index?: Maybe<Scalars['Int']['output']>;
};

/** aggregate var_pop on columns */
export type Universal_Profile_Var_Pop_Fields = {
  __typename?: 'universal_profile_var_pop_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate var_samp on columns */
export type Universal_Profile_Var_Samp_Fields = {
  __typename?: 'universal_profile_var_samp_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** aggregate variance on columns */
export type Universal_Profile_Variance_Fields = {
  __typename?: 'universal_profile_variance_fields';
  chain_id?: Maybe<Scalars['Float']['output']>;
  last_block_number?: Maybe<Scalars['Float']['output']>;
  last_log_index?: Maybe<Scalars['Float']['output']>;
  last_transaction_index?: Maybe<Scalars['Float']['output']>;
};

/** Boolean expression to compare columns of type "verification_status". All fields are combined with logical 'AND'. */
export type Verification_Status_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['verification_status']['input']>;
  _gt?: InputMaybe<Scalars['verification_status']['input']>;
  _gte?: InputMaybe<Scalars['verification_status']['input']>;
  _in?: InputMaybe<Array<Scalars['verification_status']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['verification_status']['input']>;
  _lte?: InputMaybe<Scalars['verification_status']['input']>;
  _neq?: InputMaybe<Scalars['verification_status']['input']>;
  _nin?: InputMaybe<Array<Scalars['verification_status']['input']>>;
};

export type V3BlockFieldsFragment = { __typename?: 'block', id?: string | null, network?: string | null, number?: string | null, hash?: string | null, timestamp?: string | null, chainId?: string | null, parentHash?: string | null } & { ' $fragmentName'?: 'V3BlockFieldsFragment' };

export type V3EventFieldsFragment = { __typename?: 'event_fact', id?: string | null, network?: string | null, address?: string | null, topic0?: string | null, topics?: Array<string> | null, data?: string | null, decoded?: unknown | null, chainId?: string | null, blockNumber?: string | null, blockHash?: string | null, parentHash?: string | null, timestamp?: string | null, transactionHash?: string | null, transactionIndex?: number | null, logIndex?: number | null, eventName?: string | null, eventDomain?: string | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3EventFieldsFragment' };

export type V3ProfileFieldsFragment = { __typename?: 'universal_profile', id?: string | null, network?: string | null, address?: string | null, verification?: any | null, chainId?: string | null, ownerAddress?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, metadataRevisions: Array<{ __typename?: 'metadata_revision', content?: unknown | null }>, followerCount: { __typename?: 'follower_aggregate', aggregate?: { __typename?: 'follower_aggregate_fields', count: number } | null }, followingCount: { __typename?: 'follower_aggregate', aggregate?: { __typename?: 'follower_aggregate_fields', count: number } | null } } & { ' $fragmentName'?: 'V3ProfileFieldsFragment' };

export type V3DigitalAssetFieldsFragment = { __typename?: 'digital_asset', id?: string | null, network?: string | null, address?: string | null, standard?: any | null, name?: string | null, symbol?: string | null, decimals?: number | null, verification?: any | null, chainId?: string | null, ownerAddress?: string | null, tokenType?: number | null, totalSupply?: string | null, tokenIdFormat?: number | null, tokenIdReferenceContract?: string | null, baseUri?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, metadataRevisions: Array<{ __typename?: 'metadata_revision', content?: unknown | null }>, holderCount: { __typename?: 'owned_asset_aggregate', aggregate?: { __typename?: 'owned_asset_aggregate_fields', count: number } | null }, creatorCount: { __typename?: 'lsp4_creator_aggregate', aggregate?: { __typename?: 'lsp4_creator_aggregate_fields', count: number } | null } } & { ' $fragmentName'?: 'V3DigitalAssetFieldsFragment' };

export type V3NftFieldsFragment = { __typename?: 'nft', id?: string | null, network?: string | null, address?: string | null, verification?: any | null, chainId?: string | null, tokenId?: string | null, formattedTokenId?: string | null, isMinted?: boolean | null, isBurned?: boolean | null, ownerAddress?: string | null, tokenUri?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, metadataRevisions: Array<{ __typename?: 'metadata_revision', content?: unknown | null, dataKey?: string | null }>, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, ownedToken?: { __typename?: 'owned_token', ownerAddress?: string | null, lastBlockNumber?: string | null, universalProfile?: (
      { __typename?: 'universal_profile' }
      & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
    ) | null } | null, chillwhales?: { __typename?: 'chillwhales_nft', level?: number | null, faction?: string | null, chillClaimed?: boolean | null, orbsClaimed?: boolean | null, cooldownExpiry?: string | null } | null } & { ' $fragmentName'?: 'V3NftFieldsFragment' };

export type V3OwnedAssetFieldsFragment = { __typename?: 'owned_asset', id?: string | null, network?: string | null, balance?: string | null, chainId?: string | null, ownerAddress?: string | null, assetAddress?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, tokenIdCount: { __typename?: 'owned_token_aggregate', aggregate?: { __typename?: 'owned_token_aggregate_fields', count: number } | null } } & { ' $fragmentName'?: 'V3OwnedAssetFieldsFragment' };

export type V3OwnedTokenFieldsFragment = { __typename?: 'owned_token', id?: string | null, network?: string | null, balance?: string | null, chainId?: string | null, ownerAddress?: string | null, assetAddress?: string | null, tokenId?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, nft?: (
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  ) | null, ownedAsset?: (
    { __typename?: 'owned_asset' }
    & { ' $fragmentRefs'?: { 'V3OwnedAssetFieldsFragment': V3OwnedAssetFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3OwnedTokenFieldsFragment' };

export type V3FollowerFieldsFragment = { __typename?: 'follower', id?: string | null, network?: string | null, chainId?: string | null, followerAddress?: string | null, followedAddress?: string | null, isFollowing?: boolean | null, followedAt?: string | null, unfollowedAt?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, followerProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, followedProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3FollowerFieldsFragment' };

export type V3CreatorFieldsFragment = { __typename?: 'lsp4_creator', id?: string | null, network?: string | null, verified?: boolean | null, chainId?: string | null, assetAddress?: string | null, creatorAddress?: string | null, arrayIndex?: string | null, interfaceId?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, creatorProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3CreatorFieldsFragment' };

export type V3IssuedAssetFieldsFragment = { __typename?: 'lsp12_issued_asset', id?: string | null, network?: string | null, chainId?: string | null, issuerAddress?: string | null, assetAddress?: string | null, arrayIndex?: string | null, interfaceId?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, issuerProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3IssuedAssetFieldsFragment' };

export type V3ControllerFieldsFragment = { __typename?: 'lsp6_controller', id?: string | null, network?: string | null, permissions?: string | null, chainId?: string | null, profileAddress?: string | null, controllerAddress?: string | null, arrayIndex?: string | null, allowedCalls?: unknown | null, allowedDataKeys?: unknown | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, controllerProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3ControllerFieldsFragment' };

export type V3ChillwhalesNftFieldsFragment = { __typename?: 'chillwhales_nft', id?: string | null, network?: string | null, address?: string | null, level?: number | null, faction?: string | null, chainId?: string | null, tokenId?: string | null, chillClaimed?: boolean | null, orbsClaimed?: boolean | null, claimCheckAfterBlock?: string | null, cooldownExpiry?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, nft?: (
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3ChillwhalesNftFieldsFragment' };

export type V3DataValueFieldsFragment = { __typename?: 'data_value', id?: string | null, network?: string | null, address?: string | null, chainId?: string | null, tokenId?: string | null, dataKey?: string | null, dataValue?: string | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, nft?: (
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3DataValueFieldsFragment' };

export type V3MetadataRevisionFieldsFragment = { __typename?: 'metadata_revision', id?: string | null, network?: string | null, address?: string | null, kind?: any | null, content?: unknown | null, chainId?: string | null, tokenId?: string | null, dataKey?: string | null, sourceRevision?: string | null, contentUri?: string | null, contentHash?: string | null, contentType?: string | null, contentLength?: number | null, fetchedAt?: string | null, isCurrent?: boolean | null, lastBlockNumber?: string | null, lastBlockHash?: string | null, lastTransactionHash?: string | null, lastTransactionIndex?: number | null, lastLogIndex?: number | null, universalProfile?: (
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  ) | null, digitalAsset?: (
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  ) | null, nft?: (
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  ) | null } & { ' $fragmentName'?: 'V3MetadataRevisionFieldsFragment' };

export type V3IndexedHeadFieldsFragment = { __typename?: 'indexed_head', network?: string | null, chainId?: string | null, blockNumber?: string | null, blockHash?: string | null, blockTimestamp?: string | null, finalizedBlockNumber?: string | null, finalizedBlockHash?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'V3IndexedHeadFieldsFragment' };

export type V3BlocksQueryVariables = Exact<{
  where?: InputMaybe<Block_Bool_Exp>;
  orderBy?: InputMaybe<Array<Block_Order_By> | Block_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3BlocksQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'block' }
    & { ' $fragmentRefs'?: { 'V3BlockFieldsFragment': V3BlockFieldsFragment } }
  )>, total: { __typename?: 'block_aggregate', aggregate?: { __typename?: 'block_aggregate_fields', count: number } | null } };

export type V3BlocksSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Block_Bool_Exp>;
  orderBy?: InputMaybe<Array<Block_Order_By> | Block_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3BlocksSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'block' }
    & { ' $fragmentRefs'?: { 'V3BlockFieldsFragment': V3BlockFieldsFragment } }
  )> };

export type V3EventsQueryVariables = Exact<{
  where?: InputMaybe<Event_Fact_Bool_Exp>;
  orderBy?: InputMaybe<Array<Event_Fact_Order_By> | Event_Fact_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3EventsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'event_fact' }
    & { ' $fragmentRefs'?: { 'V3EventFieldsFragment': V3EventFieldsFragment } }
  )>, total: { __typename?: 'event_fact_aggregate', aggregate?: { __typename?: 'event_fact_aggregate_fields', count: number } | null } };

export type V3EventsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Event_Fact_Bool_Exp>;
  orderBy?: InputMaybe<Array<Event_Fact_Order_By> | Event_Fact_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3EventsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'event_fact' }
    & { ' $fragmentRefs'?: { 'V3EventFieldsFragment': V3EventFieldsFragment } }
  )> };

export type V3UniversalProfilesQueryVariables = Exact<{
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
  orderBy?: InputMaybe<Array<Universal_Profile_Order_By> | Universal_Profile_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3UniversalProfilesQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  )>, total: { __typename?: 'universal_profile_aggregate', aggregate?: { __typename?: 'universal_profile_aggregate_fields', count: number } | null } };

export type V3UniversalProfilesSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Universal_Profile_Bool_Exp>;
  orderBy?: InputMaybe<Array<Universal_Profile_Order_By> | Universal_Profile_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3UniversalProfilesSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'universal_profile' }
    & { ' $fragmentRefs'?: { 'V3ProfileFieldsFragment': V3ProfileFieldsFragment } }
  )> };

export type V3DigitalAssetsQueryVariables = Exact<{
  where?: InputMaybe<Digital_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Digital_Asset_Order_By> | Digital_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3DigitalAssetsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  )>, total: { __typename?: 'digital_asset_aggregate', aggregate?: { __typename?: 'digital_asset_aggregate_fields', count: number } | null } };

export type V3DigitalAssetsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Digital_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Digital_Asset_Order_By> | Digital_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3DigitalAssetsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'digital_asset' }
    & { ' $fragmentRefs'?: { 'V3DigitalAssetFieldsFragment': V3DigitalAssetFieldsFragment } }
  )> };

export type V3NftsQueryVariables = Exact<{
  where?: InputMaybe<Nft_Bool_Exp>;
  orderBy?: InputMaybe<Array<Nft_Order_By> | Nft_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3NftsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  )>, total: { __typename?: 'nft_aggregate', aggregate?: { __typename?: 'nft_aggregate_fields', count: number } | null } };

export type V3NftsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Nft_Bool_Exp>;
  orderBy?: InputMaybe<Array<Nft_Order_By> | Nft_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3NftsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'nft' }
    & { ' $fragmentRefs'?: { 'V3NftFieldsFragment': V3NftFieldsFragment } }
  )> };

export type V3OwnedAssetsQueryVariables = Exact<{
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Owned_Asset_Order_By> | Owned_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3OwnedAssetsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'owned_asset' }
    & { ' $fragmentRefs'?: { 'V3OwnedAssetFieldsFragment': V3OwnedAssetFieldsFragment } }
  )>, total: { __typename?: 'owned_asset_aggregate', aggregate?: { __typename?: 'owned_asset_aggregate_fields', count: number } | null } };

export type V3OwnedAssetsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Owned_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Owned_Asset_Order_By> | Owned_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3OwnedAssetsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'owned_asset' }
    & { ' $fragmentRefs'?: { 'V3OwnedAssetFieldsFragment': V3OwnedAssetFieldsFragment } }
  )> };

export type V3OwnedTokensQueryVariables = Exact<{
  where?: InputMaybe<Owned_Token_Bool_Exp>;
  orderBy?: InputMaybe<Array<Owned_Token_Order_By> | Owned_Token_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3OwnedTokensQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'owned_token' }
    & { ' $fragmentRefs'?: { 'V3OwnedTokenFieldsFragment': V3OwnedTokenFieldsFragment } }
  )>, total: { __typename?: 'owned_token_aggregate', aggregate?: { __typename?: 'owned_token_aggregate_fields', count: number } | null } };

export type V3OwnedTokensSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Owned_Token_Bool_Exp>;
  orderBy?: InputMaybe<Array<Owned_Token_Order_By> | Owned_Token_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3OwnedTokensSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'owned_token' }
    & { ' $fragmentRefs'?: { 'V3OwnedTokenFieldsFragment': V3OwnedTokenFieldsFragment } }
  )> };

export type V3FollowersQueryVariables = Exact<{
  where?: InputMaybe<Follower_Bool_Exp>;
  orderBy?: InputMaybe<Array<Follower_Order_By> | Follower_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3FollowersQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'follower' }
    & { ' $fragmentRefs'?: { 'V3FollowerFieldsFragment': V3FollowerFieldsFragment } }
  )>, total: { __typename?: 'follower_aggregate', aggregate?: { __typename?: 'follower_aggregate_fields', count: number } | null } };

export type V3FollowersSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Follower_Bool_Exp>;
  orderBy?: InputMaybe<Array<Follower_Order_By> | Follower_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3FollowersSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'follower' }
    & { ' $fragmentRefs'?: { 'V3FollowerFieldsFragment': V3FollowerFieldsFragment } }
  )> };

export type V3CreatorsQueryVariables = Exact<{
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp4_Creator_Order_By> | Lsp4_Creator_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3CreatorsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'lsp4_creator' }
    & { ' $fragmentRefs'?: { 'V3CreatorFieldsFragment': V3CreatorFieldsFragment } }
  )>, total: { __typename?: 'lsp4_creator_aggregate', aggregate?: { __typename?: 'lsp4_creator_aggregate_fields', count: number } | null } };

export type V3CreatorsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Lsp4_Creator_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp4_Creator_Order_By> | Lsp4_Creator_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3CreatorsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'lsp4_creator' }
    & { ' $fragmentRefs'?: { 'V3CreatorFieldsFragment': V3CreatorFieldsFragment } }
  )> };

export type V3IssuedAssetsQueryVariables = Exact<{
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By> | Lsp12_Issued_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3IssuedAssetsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'lsp12_issued_asset' }
    & { ' $fragmentRefs'?: { 'V3IssuedAssetFieldsFragment': V3IssuedAssetFieldsFragment } }
  )>, total: { __typename?: 'lsp12_issued_asset_aggregate', aggregate?: { __typename?: 'lsp12_issued_asset_aggregate_fields', count: number } | null } };

export type V3IssuedAssetsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Lsp12_Issued_Asset_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp12_Issued_Asset_Order_By> | Lsp12_Issued_Asset_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3IssuedAssetsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'lsp12_issued_asset' }
    & { ' $fragmentRefs'?: { 'V3IssuedAssetFieldsFragment': V3IssuedAssetFieldsFragment } }
  )> };

export type V3ControllersQueryVariables = Exact<{
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp6_Controller_Order_By> | Lsp6_Controller_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3ControllersQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'lsp6_controller' }
    & { ' $fragmentRefs'?: { 'V3ControllerFieldsFragment': V3ControllerFieldsFragment } }
  )>, total: { __typename?: 'lsp6_controller_aggregate', aggregate?: { __typename?: 'lsp6_controller_aggregate_fields', count: number } | null } };

export type V3ControllersSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Lsp6_Controller_Bool_Exp>;
  orderBy?: InputMaybe<Array<Lsp6_Controller_Order_By> | Lsp6_Controller_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3ControllersSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'lsp6_controller' }
    & { ' $fragmentRefs'?: { 'V3ControllerFieldsFragment': V3ControllerFieldsFragment } }
  )> };

export type V3ChillwhalesNftsQueryVariables = Exact<{
  where?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
  orderBy?: InputMaybe<Array<Chillwhales_Nft_Order_By> | Chillwhales_Nft_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3ChillwhalesNftsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'chillwhales_nft' }
    & { ' $fragmentRefs'?: { 'V3ChillwhalesNftFieldsFragment': V3ChillwhalesNftFieldsFragment } }
  )>, total: { __typename?: 'chillwhales_nft_aggregate', aggregate?: { __typename?: 'chillwhales_nft_aggregate_fields', count: number } | null } };

export type V3ChillwhalesNftsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Chillwhales_Nft_Bool_Exp>;
  orderBy?: InputMaybe<Array<Chillwhales_Nft_Order_By> | Chillwhales_Nft_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3ChillwhalesNftsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'chillwhales_nft' }
    & { ' $fragmentRefs'?: { 'V3ChillwhalesNftFieldsFragment': V3ChillwhalesNftFieldsFragment } }
  )> };

export type V3DataValuesQueryVariables = Exact<{
  where?: InputMaybe<Data_Value_Bool_Exp>;
  orderBy?: InputMaybe<Array<Data_Value_Order_By> | Data_Value_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3DataValuesQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'data_value' }
    & { ' $fragmentRefs'?: { 'V3DataValueFieldsFragment': V3DataValueFieldsFragment } }
  )>, total: { __typename?: 'data_value_aggregate', aggregate?: { __typename?: 'data_value_aggregate_fields', count: number } | null } };

export type V3DataValuesSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Data_Value_Bool_Exp>;
  orderBy?: InputMaybe<Array<Data_Value_Order_By> | Data_Value_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3DataValuesSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'data_value' }
    & { ' $fragmentRefs'?: { 'V3DataValueFieldsFragment': V3DataValueFieldsFragment } }
  )> };

export type V3MetadataRevisionsQueryVariables = Exact<{
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
  orderBy?: InputMaybe<Array<Metadata_Revision_Order_By> | Metadata_Revision_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3MetadataRevisionsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'metadata_revision' }
    & { ' $fragmentRefs'?: { 'V3MetadataRevisionFieldsFragment': V3MetadataRevisionFieldsFragment } }
  )>, total: { __typename?: 'metadata_revision_aggregate', aggregate?: { __typename?: 'metadata_revision_aggregate_fields', count: number } | null } };

export type V3MetadataRevisionsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Metadata_Revision_Bool_Exp>;
  orderBy?: InputMaybe<Array<Metadata_Revision_Order_By> | Metadata_Revision_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3MetadataRevisionsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'metadata_revision' }
    & { ' $fragmentRefs'?: { 'V3MetadataRevisionFieldsFragment': V3MetadataRevisionFieldsFragment } }
  )> };

export type V3IndexedHeadsQueryVariables = Exact<{
  where?: InputMaybe<Indexed_Head_Bool_Exp>;
  orderBy?: InputMaybe<Array<Indexed_Head_Order_By> | Indexed_Head_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3IndexedHeadsQuery = { __typename?: 'query_root', items: Array<(
    { __typename?: 'indexed_head' }
    & { ' $fragmentRefs'?: { 'V3IndexedHeadFieldsFragment': V3IndexedHeadFieldsFragment } }
  )>, total: { __typename?: 'indexed_head_aggregate', aggregate?: { __typename?: 'indexed_head_aggregate_fields', count: number } | null } };

export type V3IndexedHeadsSubscriptionSubscriptionVariables = Exact<{
  where?: InputMaybe<Indexed_Head_Bool_Exp>;
  orderBy?: InputMaybe<Array<Indexed_Head_Order_By> | Indexed_Head_Order_By>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type V3IndexedHeadsSubscriptionSubscription = { __typename?: 'subscription_root', items: Array<(
    { __typename?: 'indexed_head' }
    & { ' $fragmentRefs'?: { 'V3IndexedHeadFieldsFragment': V3IndexedHeadFieldsFragment } }
  )> };

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
export const V3BlockFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3BlockFields on block {
  id
  network
  chainId: chain_id
  number
  hash
  parentHash: parent_hash
  timestamp
}
    `, {"fragmentName":"V3BlockFields"}) as unknown as TypedDocumentString<V3BlockFieldsFragment, unknown>;
export const V3ProfileFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
    `, {"fragmentName":"V3ProfileFields"}) as unknown as TypedDocumentString<V3ProfileFieldsFragment, unknown>;
export const V3DigitalAssetFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
    `, {"fragmentName":"V3DigitalAssetFields"}) as unknown as TypedDocumentString<V3DigitalAssetFieldsFragment, unknown>;
export const V3EventFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3EventFields on event_fact {
  id
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  parentHash: parent_hash
  timestamp: block_timestamp
  transactionHash: transaction_hash
  transactionIndex: transaction_index
  logIndex: log_index
  address
  topic0
  topics
  data
  eventName: event_name
  eventDomain: event_domain
  decoded
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3EventFields"}) as unknown as TypedDocumentString<V3EventFieldsFragment, unknown>;
export const V3NftFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3NftFields"}) as unknown as TypedDocumentString<V3NftFieldsFragment, unknown>;
export const V3OwnedAssetFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3OwnedAssetFields"}) as unknown as TypedDocumentString<V3OwnedAssetFieldsFragment, unknown>;
export const V3OwnedTokenFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3OwnedTokenFields on owned_token {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  tokenId: token_id
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  nft {
    ...V3NftFields
  }
  ownedAsset {
    ...V3OwnedAssetFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3OwnedTokenFields"}) as unknown as TypedDocumentString<V3OwnedTokenFieldsFragment, unknown>;
export const V3FollowerFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3FollowerFields on follower {
  id
  network
  chainId: chain_id
  followerAddress: follower_address
  followedAddress: followed_address
  isFollowing: is_following
  followedAt: followed_at
  unfollowedAt: unfollowed_at
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  followerProfile: followerUniversalProfile {
    ...V3ProfileFields
  }
  followedProfile: followedUniversalProfile {
    ...V3ProfileFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3FollowerFields"}) as unknown as TypedDocumentString<V3FollowerFieldsFragment, unknown>;
export const V3CreatorFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3CreatorFields on lsp4_creator {
  id
  network
  chainId: chain_id
  assetAddress: asset_address
  creatorAddress: creator_address
  arrayIndex: array_index
  interfaceId: interface_id
  verified
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  creatorProfile {
    ...V3ProfileFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3CreatorFields"}) as unknown as TypedDocumentString<V3CreatorFieldsFragment, unknown>;
export const V3IssuedAssetFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3IssuedAssetFields on lsp12_issued_asset {
  id
  network
  chainId: chain_id
  issuerAddress: issuer_address
  assetAddress: asset_address
  arrayIndex: array_index
  interfaceId: interface_id
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  issuerProfile: universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3IssuedAssetFields"}) as unknown as TypedDocumentString<V3IssuedAssetFieldsFragment, unknown>;
export const V3ControllerFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3ControllerFields on lsp6_controller {
  id
  network
  chainId: chain_id
  profileAddress: profile_address
  controllerAddress: controller_address
  arrayIndex: array_index
  permissions
  allowedCalls: allowed_calls
  allowedDataKeys: allowed_data_keys
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  controllerProfile {
    ...V3ProfileFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}`, {"fragmentName":"V3ControllerFields"}) as unknown as TypedDocumentString<V3ControllerFieldsFragment, unknown>;
export const V3ChillwhalesNftFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3ChillwhalesNftFields on chillwhales_nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  chillClaimed: chill_claimed
  orbsClaimed: orbs_claimed
  claimCheckAfterBlock: claim_check_after_block
  level
  cooldownExpiry: cooldown_expiry
  faction
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}`, {"fragmentName":"V3ChillwhalesNftFields"}) as unknown as TypedDocumentString<V3ChillwhalesNftFieldsFragment, unknown>;
export const V3DataValueFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3DataValueFields on data_value {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  dataValue: data_value
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}`, {"fragmentName":"V3DataValueFields"}) as unknown as TypedDocumentString<V3DataValueFieldsFragment, unknown>;
export const V3MetadataRevisionFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3MetadataRevisionFields on metadata_revision {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  kind
  sourceRevision: source_revision
  contentUri: content_uri
  contentHash: content_hash
  contentType: content_type
  contentLength: content_length
  content
  fetchedAt: fetched_at
  isCurrent: is_current
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}`, {"fragmentName":"V3MetadataRevisionFields"}) as unknown as TypedDocumentString<V3MetadataRevisionFieldsFragment, unknown>;
export const V3IndexedHeadFieldsFragmentDoc = new TypedDocumentString(`
    fragment V3IndexedHeadFields on indexed_head {
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  blockTimestamp: block_timestamp
  finalizedBlockNumber: finalized_block_number
  finalizedBlockHash: finalized_block_hash
  updatedAt: updated_at
}
    `, {"fragmentName":"V3IndexedHeadFields"}) as unknown as TypedDocumentString<V3IndexedHeadFieldsFragment, unknown>;
export const V3BlocksDocument = new TypedDocumentString(`
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
    fragment V3BlockFields on block {
  id
  network
  chainId: chain_id
  number
  hash
  parentHash: parent_hash
  timestamp
}`) as unknown as TypedDocumentString<V3BlocksQuery, V3BlocksQueryVariables>;
export const V3BlocksSubscriptionDocument = new TypedDocumentString(`
    subscription V3BlocksSubscription($where: block_bool_exp, $orderBy: [block_order_by!], $limit: Int, $offset: Int) {
  items: block(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
    ...V3BlockFields
  }
}
    fragment V3BlockFields on block {
  id
  network
  chainId: chain_id
  number
  hash
  parentHash: parent_hash
  timestamp
}`) as unknown as TypedDocumentString<V3BlocksSubscriptionSubscription, V3BlocksSubscriptionSubscriptionVariables>;
export const V3EventsDocument = new TypedDocumentString(`
    query V3Events($where: event_fact_bool_exp, $orderBy: [event_fact_order_by!], $limit: Int, $offset: Int) {
  items: event_fact(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3EventFields
  }
  total: event_fact_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3EventFields on event_fact {
  id
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  parentHash: parent_hash
  timestamp: block_timestamp
  transactionHash: transaction_hash
  transactionIndex: transaction_index
  logIndex: log_index
  address
  topic0
  topics
  data
  eventName: event_name
  eventDomain: event_domain
  decoded
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}
fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3EventsQuery, V3EventsQueryVariables>;
export const V3EventsSubscriptionDocument = new TypedDocumentString(`
    subscription V3EventsSubscription($where: event_fact_bool_exp, $orderBy: [event_fact_order_by!], $limit: Int, $offset: Int) {
  items: event_fact(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3EventFields
  }
}
    fragment V3EventFields on event_fact {
  id
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  parentHash: parent_hash
  timestamp: block_timestamp
  transactionHash: transaction_hash
  transactionIndex: transaction_index
  logIndex: log_index
  address
  topic0
  topics
  data
  eventName: event_name
  eventDomain: event_domain
  decoded
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}
fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3EventsSubscriptionSubscription, V3EventsSubscriptionSubscriptionVariables>;
export const V3UniversalProfilesDocument = new TypedDocumentString(`
    query V3UniversalProfiles($where: universal_profile_bool_exp, $orderBy: [universal_profile_order_by!], $limit: Int, $offset: Int) {
  items: universal_profile(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ProfileFields
  }
  total: universal_profile_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3UniversalProfilesQuery, V3UniversalProfilesQueryVariables>;
export const V3UniversalProfilesSubscriptionDocument = new TypedDocumentString(`
    subscription V3UniversalProfilesSubscription($where: universal_profile_bool_exp, $orderBy: [universal_profile_order_by!], $limit: Int, $offset: Int) {
  items: universal_profile(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ProfileFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3UniversalProfilesSubscriptionSubscription, V3UniversalProfilesSubscriptionSubscriptionVariables>;
export const V3DigitalAssetsDocument = new TypedDocumentString(`
    query V3DigitalAssets($where: digital_asset_bool_exp, $orderBy: [digital_asset_order_by!], $limit: Int, $offset: Int) {
  items: digital_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3DigitalAssetFields
  }
  total: digital_asset_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3DigitalAssetsQuery, V3DigitalAssetsQueryVariables>;
export const V3DigitalAssetsSubscriptionDocument = new TypedDocumentString(`
    subscription V3DigitalAssetsSubscription($where: digital_asset_bool_exp, $orderBy: [digital_asset_order_by!], $limit: Int, $offset: Int) {
  items: digital_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3DigitalAssetFields
  }
}
    fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3DigitalAssetsSubscriptionSubscription, V3DigitalAssetsSubscriptionSubscriptionVariables>;
export const V3NftsDocument = new TypedDocumentString(`
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
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}`) as unknown as TypedDocumentString<V3NftsQuery, V3NftsQueryVariables>;
export const V3NftsSubscriptionDocument = new TypedDocumentString(`
    subscription V3NftsSubscription($where: nft_bool_exp, $orderBy: [nft_order_by!], $limit: Int, $offset: Int) {
  items: nft(where: $where, order_by: $orderBy, limit: $limit, offset: $offset) {
    ...V3NftFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}`) as unknown as TypedDocumentString<V3NftsSubscriptionSubscription, V3NftsSubscriptionSubscriptionVariables>;
export const V3OwnedAssetsDocument = new TypedDocumentString(`
    query V3OwnedAssets($where: owned_asset_bool_exp, $orderBy: [owned_asset_order_by!], $limit: Int, $offset: Int) {
  items: owned_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3OwnedAssetFields
  }
  total: owned_asset_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3OwnedAssetsQuery, V3OwnedAssetsQueryVariables>;
export const V3OwnedAssetsSubscriptionDocument = new TypedDocumentString(`
    subscription V3OwnedAssetsSubscription($where: owned_asset_bool_exp, $orderBy: [owned_asset_order_by!], $limit: Int, $offset: Int) {
  items: owned_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3OwnedAssetFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}`) as unknown as TypedDocumentString<V3OwnedAssetsSubscriptionSubscription, V3OwnedAssetsSubscriptionSubscriptionVariables>;
export const V3OwnedTokensDocument = new TypedDocumentString(`
    query V3OwnedTokens($where: owned_token_bool_exp, $orderBy: [owned_token_order_by!], $limit: Int, $offset: Int) {
  items: owned_token(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3OwnedTokenFields
  }
  total: owned_token_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3OwnedTokenFields on owned_token {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  tokenId: token_id
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  nft {
    ...V3NftFields
  }
  ownedAsset {
    ...V3OwnedAssetFields
  }
}`) as unknown as TypedDocumentString<V3OwnedTokensQuery, V3OwnedTokensQueryVariables>;
export const V3OwnedTokensSubscriptionDocument = new TypedDocumentString(`
    subscription V3OwnedTokensSubscription($where: owned_token_bool_exp, $orderBy: [owned_token_order_by!], $limit: Int, $offset: Int) {
  items: owned_token(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3OwnedTokenFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3OwnedAssetFields on owned_asset {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  tokenIdCount: tokenIds_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3OwnedTokenFields on owned_token {
  id
  network
  chainId: chain_id
  ownerAddress: owner_address
  assetAddress: asset_address
  tokenId: token_id
  balance
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  universalProfile {
    ...V3ProfileFields
  }
  nft {
    ...V3NftFields
  }
  ownedAsset {
    ...V3OwnedAssetFields
  }
}`) as unknown as TypedDocumentString<V3OwnedTokensSubscriptionSubscription, V3OwnedTokensSubscriptionSubscriptionVariables>;
export const V3FollowersDocument = new TypedDocumentString(`
    query V3Followers($where: follower_bool_exp, $orderBy: [follower_order_by!], $limit: Int, $offset: Int) {
  items: follower(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3FollowerFields
  }
  total: follower_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3FollowerFields on follower {
  id
  network
  chainId: chain_id
  followerAddress: follower_address
  followedAddress: followed_address
  isFollowing: is_following
  followedAt: followed_at
  unfollowedAt: unfollowed_at
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  followerProfile: followerUniversalProfile {
    ...V3ProfileFields
  }
  followedProfile: followedUniversalProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3FollowersQuery, V3FollowersQueryVariables>;
export const V3FollowersSubscriptionDocument = new TypedDocumentString(`
    subscription V3FollowersSubscription($where: follower_bool_exp, $orderBy: [follower_order_by!], $limit: Int, $offset: Int) {
  items: follower(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3FollowerFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3FollowerFields on follower {
  id
  network
  chainId: chain_id
  followerAddress: follower_address
  followedAddress: followed_address
  isFollowing: is_following
  followedAt: followed_at
  unfollowedAt: unfollowed_at
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  followerProfile: followerUniversalProfile {
    ...V3ProfileFields
  }
  followedProfile: followedUniversalProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3FollowersSubscriptionSubscription, V3FollowersSubscriptionSubscriptionVariables>;
export const V3CreatorsDocument = new TypedDocumentString(`
    query V3Creators($where: lsp4_creator_bool_exp, $orderBy: [lsp4_creator_order_by!], $limit: Int, $offset: Int) {
  items: lsp4_creator(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3CreatorFields
  }
  total: lsp4_creator_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3CreatorFields on lsp4_creator {
  id
  network
  chainId: chain_id
  assetAddress: asset_address
  creatorAddress: creator_address
  arrayIndex: array_index
  interfaceId: interface_id
  verified
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  creatorProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3CreatorsQuery, V3CreatorsQueryVariables>;
export const V3CreatorsSubscriptionDocument = new TypedDocumentString(`
    subscription V3CreatorsSubscription($where: lsp4_creator_bool_exp, $orderBy: [lsp4_creator_order_by!], $limit: Int, $offset: Int) {
  items: lsp4_creator(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3CreatorFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3CreatorFields on lsp4_creator {
  id
  network
  chainId: chain_id
  assetAddress: asset_address
  creatorAddress: creator_address
  arrayIndex: array_index
  interfaceId: interface_id
  verified
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  creatorProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3CreatorsSubscriptionSubscription, V3CreatorsSubscriptionSubscriptionVariables>;
export const V3IssuedAssetsDocument = new TypedDocumentString(`
    query V3IssuedAssets($where: lsp12_issued_asset_bool_exp, $orderBy: [lsp12_issued_asset_order_by!], $limit: Int, $offset: Int) {
  items: lsp12_issued_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3IssuedAssetFields
  }
  total: lsp12_issued_asset_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3IssuedAssetFields on lsp12_issued_asset {
  id
  network
  chainId: chain_id
  issuerAddress: issuer_address
  assetAddress: asset_address
  arrayIndex: array_index
  interfaceId: interface_id
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  issuerProfile: universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}`) as unknown as TypedDocumentString<V3IssuedAssetsQuery, V3IssuedAssetsQueryVariables>;
export const V3IssuedAssetsSubscriptionDocument = new TypedDocumentString(`
    subscription V3IssuedAssetsSubscription($where: lsp12_issued_asset_bool_exp, $orderBy: [lsp12_issued_asset_order_by!], $limit: Int, $offset: Int) {
  items: lsp12_issued_asset(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3IssuedAssetFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3IssuedAssetFields on lsp12_issued_asset {
  id
  network
  chainId: chain_id
  issuerAddress: issuer_address
  assetAddress: asset_address
  arrayIndex: array_index
  interfaceId: interface_id
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  issuerProfile: universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
}`) as unknown as TypedDocumentString<V3IssuedAssetsSubscriptionSubscription, V3IssuedAssetsSubscriptionSubscriptionVariables>;
export const V3ControllersDocument = new TypedDocumentString(`
    query V3Controllers($where: lsp6_controller_bool_exp, $orderBy: [lsp6_controller_order_by!], $limit: Int, $offset: Int) {
  items: lsp6_controller(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ControllerFields
  }
  total: lsp6_controller_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3ControllerFields on lsp6_controller {
  id
  network
  chainId: chain_id
  profileAddress: profile_address
  controllerAddress: controller_address
  arrayIndex: array_index
  permissions
  allowedCalls: allowed_calls
  allowedDataKeys: allowed_data_keys
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  controllerProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3ControllersQuery, V3ControllersQueryVariables>;
export const V3ControllersSubscriptionDocument = new TypedDocumentString(`
    subscription V3ControllersSubscription($where: lsp6_controller_bool_exp, $orderBy: [lsp6_controller_order_by!], $limit: Int, $offset: Int) {
  items: lsp6_controller(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ControllerFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3ControllerFields on lsp6_controller {
  id
  network
  chainId: chain_id
  profileAddress: profile_address
  controllerAddress: controller_address
  arrayIndex: array_index
  permissions
  allowedCalls: allowed_calls
  allowedDataKeys: allowed_data_keys
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  controllerProfile {
    ...V3ProfileFields
  }
}`) as unknown as TypedDocumentString<V3ControllersSubscriptionSubscription, V3ControllersSubscriptionSubscriptionVariables>;
export const V3ChillwhalesNftsDocument = new TypedDocumentString(`
    query V3ChillwhalesNfts($where: chillwhales_nft_bool_exp, $orderBy: [chillwhales_nft_order_by!], $limit: Int, $offset: Int) {
  items: chillwhales_nft(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ChillwhalesNftFields
  }
  total: chillwhales_nft_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3ChillwhalesNftFields on chillwhales_nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  chillClaimed: chill_claimed
  orbsClaimed: orbs_claimed
  claimCheckAfterBlock: claim_check_after_block
  level
  cooldownExpiry: cooldown_expiry
  faction
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3ChillwhalesNftsQuery, V3ChillwhalesNftsQueryVariables>;
export const V3ChillwhalesNftsSubscriptionDocument = new TypedDocumentString(`
    subscription V3ChillwhalesNftsSubscription($where: chillwhales_nft_bool_exp, $orderBy: [chillwhales_nft_order_by!], $limit: Int, $offset: Int) {
  items: chillwhales_nft(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3ChillwhalesNftFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3ChillwhalesNftFields on chillwhales_nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  chillClaimed: chill_claimed
  orbsClaimed: orbs_claimed
  claimCheckAfterBlock: claim_check_after_block
  level
  cooldownExpiry: cooldown_expiry
  faction
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3ChillwhalesNftsSubscriptionSubscription, V3ChillwhalesNftsSubscriptionSubscriptionVariables>;
export const V3DataValuesDocument = new TypedDocumentString(`
    query V3DataValues($where: data_value_bool_exp, $orderBy: [data_value_order_by!], $limit: Int, $offset: Int) {
  items: data_value(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3DataValueFields
  }
  total: data_value_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3DataValueFields on data_value {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  dataValue: data_value
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3DataValuesQuery, V3DataValuesQueryVariables>;
export const V3DataValuesSubscriptionDocument = new TypedDocumentString(`
    subscription V3DataValuesSubscription($where: data_value_bool_exp, $orderBy: [data_value_order_by!], $limit: Int, $offset: Int) {
  items: data_value(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3DataValueFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3DataValueFields on data_value {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  dataValue: data_value
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3DataValuesSubscriptionSubscription, V3DataValuesSubscriptionSubscriptionVariables>;
export const V3MetadataRevisionsDocument = new TypedDocumentString(`
    query V3MetadataRevisions($where: metadata_revision_bool_exp, $orderBy: [metadata_revision_order_by!], $limit: Int, $offset: Int) {
  items: metadata_revision(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3MetadataRevisionFields
  }
  total: metadata_revision_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3MetadataRevisionFields on metadata_revision {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  kind
  sourceRevision: source_revision
  contentUri: content_uri
  contentHash: content_hash
  contentType: content_type
  contentLength: content_length
  content
  fetchedAt: fetched_at
  isCurrent: is_current
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3MetadataRevisionsQuery, V3MetadataRevisionsQueryVariables>;
export const V3MetadataRevisionsSubscriptionDocument = new TypedDocumentString(`
    subscription V3MetadataRevisionsSubscription($where: metadata_revision_bool_exp, $orderBy: [metadata_revision_order_by!], $limit: Int, $offset: Int) {
  items: metadata_revision(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3MetadataRevisionFields
  }
}
    fragment V3ProfileFields on universal_profile {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp3_profile}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  followerCount: followedBy_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
  followingCount: followed_aggregate(where: {is_following: {_eq: true}}) {
    aggregate {
      count
    }
  }
}
fragment V3DigitalAssetFields on digital_asset {
  id
  network
  chainId: chain_id
  address
  ownerAddress: owner_address
  standard
  tokenType: token_type
  name
  symbol
  decimals
  totalSupply: total_supply
  tokenIdFormat: token_id_format
  tokenIdReferenceContract: token_id_reference_contract
  baseUri: base_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_asset}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 1
  ) {
    content
  }
  holderCount: ownedAssets_aggregate(where: {balance: {_gt: "0"}}) {
    aggregate {
      count
    }
  }
  creatorCount: lsp4Creators_aggregate {
    aggregate {
      count
    }
  }
}
fragment V3NftFields on nft {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  formattedTokenId: formatted_token_id
  isMinted: is_minted
  isBurned: is_burned
  ownerAddress: owner_address
  tokenUri: token_uri
  verification
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  metadataRevisions(
    where: {is_current: {_eq: true}, kind: {_eq: lsp4_token}, data_key: {_in: ["0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e", "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843"]}}
    order_by: [{last_block_number: desc}, {last_transaction_index: desc_nulls_last}, {last_log_index: desc_nulls_last}, {chain_id: asc}, {id: asc}]
    limit: 2
  ) {
    dataKey: data_key
    content
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  ownedToken {
    ownerAddress: owner_address
    lastBlockNumber: last_block_number
    universalProfile {
      ...V3ProfileFields
    }
  }
  chillwhales {
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    level
    cooldownExpiry: cooldown_expiry
    faction
  }
}
fragment V3MetadataRevisionFields on metadata_revision {
  id
  network
  chainId: chain_id
  address
  tokenId: token_id
  dataKey: data_key
  kind
  sourceRevision: source_revision
  contentUri: content_uri
  contentHash: content_hash
  contentType: content_type
  contentLength: content_length
  content
  fetchedAt: fetched_at
  isCurrent: is_current
  lastBlockNumber: last_block_number
  lastBlockHash: last_block_hash
  lastTransactionHash: last_transaction_hash
  lastTransactionIndex: last_transaction_index
  lastLogIndex: last_log_index
  universalProfile {
    ...V3ProfileFields
  }
  digitalAsset {
    ...V3DigitalAssetFields
  }
  nft {
    ...V3NftFields
  }
}`) as unknown as TypedDocumentString<V3MetadataRevisionsSubscriptionSubscription, V3MetadataRevisionsSubscriptionSubscriptionVariables>;
export const V3IndexedHeadsDocument = new TypedDocumentString(`
    query V3IndexedHeads($where: indexed_head_bool_exp, $orderBy: [indexed_head_order_by!], $limit: Int, $offset: Int) {
  items: indexed_head(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3IndexedHeadFields
  }
  total: indexed_head_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    fragment V3IndexedHeadFields on indexed_head {
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  blockTimestamp: block_timestamp
  finalizedBlockNumber: finalized_block_number
  finalizedBlockHash: finalized_block_hash
  updatedAt: updated_at
}`) as unknown as TypedDocumentString<V3IndexedHeadsQuery, V3IndexedHeadsQueryVariables>;
export const V3IndexedHeadsSubscriptionDocument = new TypedDocumentString(`
    subscription V3IndexedHeadsSubscription($where: indexed_head_bool_exp, $orderBy: [indexed_head_order_by!], $limit: Int, $offset: Int) {
  items: indexed_head(
    where: $where
    order_by: $orderBy
    limit: $limit
    offset: $offset
  ) {
    ...V3IndexedHeadFields
  }
}
    fragment V3IndexedHeadFields on indexed_head {
  network
  chainId: chain_id
  blockNumber: block_number
  blockHash: block_hash
  blockTimestamp: block_timestamp
  finalizedBlockNumber: finalized_block_number
  finalizedBlockHash: finalized_block_hash
  updatedAt: updated_at
}`) as unknown as TypedDocumentString<V3IndexedHeadsSubscriptionSubscription, V3IndexedHeadsSubscriptionSubscriptionVariables>;