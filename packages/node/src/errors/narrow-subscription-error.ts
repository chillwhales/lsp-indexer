import { IndexerError } from './indexer-error';

/**
 * Narrow an `unknown` subscription error into a human-readable message.
 *
 * Subscription hooks type `error` as `unknown` because the `@lsp-indexer/types`
 * package cannot depend on `@lsp-indexer/node`. This utility lives in the `node`
 * package and provides convenient narrowing so consumers don't have to repeat
 * `instanceof` checks everywhere.
 *
 * @param error - The `unknown` error from `UseSubscriptionReturn.error`
 * @returns A human-readable error message string
 *
 * @example
 * ```tsx
 * import { narrowSubscriptionError } from '@lsp-indexer/node';
 *
 * const { error } = useProfileSubscription();
 * if (error != null) {
 *   console.log(narrowSubscriptionError(error));
 * }
 * ```
 */
export function narrowSubscriptionError(error: unknown): string {
  if (error instanceof IndexerError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}
