import type { SubscriptionConfig } from '@lsp-indexer/types';

/**
 * Input for {@link createSubscriptionConfig} — identical to `SubscriptionConfig`
 * except the parser receives the concrete raw type `R` instead of `unknown`.
 *
 * @typeParam T - The clean output type (e.g., `Profile`)
 * @typeParam R - The raw Hasura row type (e.g., `RawProfile`)
 */
interface SubscriptionConfigInput<T, R> {
  /** GraphQL subscription document string */
  document: string;
  /** The key in the GraphQL response object (e.g., 'universal_profile') */
  dataKey: string;
  /** GraphQL variables (where, order_by, limit) */
  variables: Record<string, unknown>;
  /** Strongly-typed parser: `R[] → T[]` */
  parser: (raw: R[]) => T[];
}

/**
 * Create a `SubscriptionConfig<T>` from a strongly-typed input.
 *
 * This is the **single controlled boundary** between untyped GraphQL JSON
 * responses (`unknown[]`) and typed domain parsers (`R[] → T[]`). The
 * wrapper function bridges the gap so that:
 *
 * - **Parser authors** write `parseProfiles(raw: RawProfile[]): Profile[]`
 *   — no `unknown`, no `as` casts, no overloads.
 * - **Domain config factories** pass `parser: parseProfiles` directly
 *   — TypeScript infers `R = RawProfile`, `T = Profile`.
 * - **Infrastructure code** calls `config.parser(rawData)` with `unknown[]`
 *   — unchanged, no generics added.
 *
 * @typeParam T - Inferred from the parser's return type
 * @typeParam R - Inferred from the parser's parameter type
 *
 * @example
 * ```ts
 * const config = createSubscriptionConfig({
 *   document: ProfileSubscriptionDocument,
 *   dataKey: 'universal_profile',
 *   variables: { limit: 10 },
 *   parser: parseProfiles, // R = RawProfile, T = Profile — inferred
 * });
 * // config: SubscriptionConfig<Profile>
 * ```
 */
export function createSubscriptionConfig<T, R>(
  input: SubscriptionConfigInput<T, R>,
): SubscriptionConfig<T> {
  return {
    document: input.document,
    dataKey: input.dataKey,
    variables: input.variables,
    parser: input.parser as SubscriptionConfig<T>['parser'],
  };
}
