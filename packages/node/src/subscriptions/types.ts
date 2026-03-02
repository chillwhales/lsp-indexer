import type { TypedDocumentString } from '../graphql/graphql';

/**
 * Type-safe subscription configuration with 4 generic parameters.
 *
 * - TResult — The full GraphQL result type from codegen (e.g., ProfileSubscriptionSubscription)
 * - TVariables — The variables type from codegen (e.g., ProfileSubscriptionSubscriptionVariables)
 * - TRaw — The raw Hasura row type extracted from TResult (e.g., RawProfile)
 * - TParsed — The clean domain type after parsing (e.g., Profile)
 *
 * Replaces the old SubscriptionConfig<T> which used `document: string` (no type flow)
 * and `dataKey: string` (runtime string lookup, no type safety).
 */
export interface SubscriptionConfig<
  TResult,
  TVariables extends Record<string, unknown>,
  TRaw,
  TParsed,
> {
  /** Codegen TypedDocumentString — carries TResult and TVariables generics */
  document: TypedDocumentString<TResult, TVariables>;
  /** GraphQL variables (typed via TVariables) */
  variables: TVariables;
  /** Type-safe extractor: pulls the raw data array from the GraphQL result.
   *  Replaces the old string `dataKey` with a typed function.
   *  Example: `(result) => result.universal_profile` */
  extract: (result: TResult) => TRaw[];
  /** Parser: transforms raw Hasura rows to clean domain types.
   *  Example: `parseProfiles` */
  parser: (raw: TRaw[]) => TParsed[];
}
