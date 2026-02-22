/**
 * Runtime utility for stripping excluded fields from parsed domain objects.
 *
 * Works in conjunction with the `IncludeResult` type to ensure that excluded
 * fields are absent from the returned object at runtime (not just at the type
 * level). This means `Object.keys()` only returns included fields + base fields.
 *
 * @module
 */

/**
 * Strip excluded fields from a parsed domain object at runtime.
 *
 * Returns a new object containing only base fields + fields with truthy include values.
 *
 * - If `include` is `undefined` → return object unchanged (full type)
 * - If `include` is provided → only keep base fields + fields with truthy include values
 *
 * @param obj - The fully parsed object
 * @param include - The include parameter (`undefined` = keep everything)
 * @param baseFields - Field names to always keep (e.g., `['address']`)
 * @param derivedFields - Optional map of derived field → source field
 *                        (e.g., `{ standard: 'decimals' }` — standard follows decimals)
 * @returns A new object with only included fields, or the original object if include is undefined
 */
export function stripExcluded<T extends Record<string, unknown>>(
  obj: T,
  include: Record<string, boolean | Record<string, unknown> | undefined> | undefined,
  baseFields: readonly string[],
  derivedFields?: Record<string, string>,
): T {
  if (!include) return obj;

  const result: Record<string, unknown> = {};

  // Always include base fields
  for (const key of baseFields) {
    if (key in obj) result[key] = obj[key];
  }

  // Include fields that are in the include parameter and truthy
  for (const [key, value] of Object.entries(include)) {
    if (value === true || (typeof value === 'object' && value !== null)) {
      if (key in obj) result[key] = obj[key];
    }
  }

  // Handle derived fields (e.g., standard follows decimals)
  if (derivedFields) {
    for (const [derived, source] of Object.entries(derivedFields)) {
      if (
        include[source] === true ||
        (typeof include[source] === 'object' && include[source] !== null)
      ) {
        if (derived in obj) result[derived] = obj[derived];
      }
    }
  }

  return result as T;
}
