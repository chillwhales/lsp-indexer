import { IndexerError } from './indexer-error';

/** Narrow an `unknown` subscription error into a human-readable message string. */
export function narrowSubscriptionError(error: unknown): string {
  if (error == null) return '';
  if (error instanceof IndexerError) return error.message;
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'Unknown error';
}
