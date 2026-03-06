import type { TypedDocumentString } from '../graphql/graphql';

/** Type-safe subscription config: TResult → TVariables → TRaw → TParsed. */
export interface SubscriptionConfig<
  TResult,
  TVariables extends Record<string, unknown>,
  TRaw,
  TParsed,
> {
  document: TypedDocumentString<TResult, TVariables>;
  variables: TVariables;
  /** Pulls the raw data array from the GraphQL result. */
  extract: (result: TResult) => TRaw[];
  /** Transforms raw Hasura rows to clean domain types. */
  parser: (raw: TRaw[]) => TParsed[];
}
