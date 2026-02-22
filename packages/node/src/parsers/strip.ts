/**
 * Runtime utility for stripping excluded fields from parsed domain objects.
 *
 * Works in conjunction with the `PartialExcept` type to ensure that excluded
 * fields are absent from the returned object at runtime (not just at the type
 * level). This means `Object.keys()` only returns included fields + base fields.
 *
 * Uses function overloads to provide correct return types without type assertions:
 * - When `include` is `undefined` → returns the original object unchanged (full type `T`)
 * - When `include` is provided → returns a new object with only base + included fields,
 *   typed as `Partial<T> & Pick<T, K>` (base fields guaranteed, rest optional)
 *
 * @module
 */

type IncludeMap = Record<string, boolean | Record<string, unknown> | undefined>;

/**
 * Strip excluded fields from a parsed domain object at runtime.
 *
 * Returns a new object containing only base fields + fields with truthy include values.
 *
 * @param obj - The fully parsed object
 * @param include - `undefined` → keep everything (returns the original object as `T`)
 * @param baseFields - Field names to always keep (e.g., `['address']`)
 * @param derivedFields - Optional map of derived field → source field
 *                        (e.g., `{ standard: 'decimals' }` — standard follows decimals)
 * @returns The original object if include is undefined, or a new partial object with base + included fields
 */
export function stripExcluded<T extends Record<string, unknown>>(
  obj: T,
  include: undefined,
  baseFields: readonly string[],
  derivedFields?: Record<string, string>,
): T;
export function stripExcluded<T extends Record<string, unknown>, const K extends string & keyof T>(
  obj: T,
  include: IncludeMap,
  baseFields: readonly K[],
  derivedFields?: Record<string, string>,
): Partial<T> & Pick<T, K>;
export function stripExcluded(
  obj: Record<string, unknown>,
  include: IncludeMap | undefined,
  baseFields: readonly string[],
  derivedFields?: Record<string, string>,
): Record<string, unknown> {
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

  return result;
}
