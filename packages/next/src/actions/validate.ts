import { IndexerError } from '@lsp-indexer/node';
import type { ZodType } from 'zod';

/**
 * Validate server action input against a Zod schema.
 *
 * Designed for use at the top of each server action's implementation overload.
 * On validation failure, throws an `IndexerError` with category `VALIDATION`
 * and field-level details from Zod.
 *
 * @param schema - Zod schema to validate against (from @lsp-indexer/types)
 * @param input - The raw input to validate
 * @param actionName - Name of the action (for error messages)
 * @returns The validated and typed input
 * @throws IndexerError with category 'VALIDATION' on invalid input
 */
export function validateInput<T>(schema: ZodType<T>, input: unknown, actionName: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw IndexerError.fromValidationError(result.error.issues, actionName);
  }
  return result.data;
}
