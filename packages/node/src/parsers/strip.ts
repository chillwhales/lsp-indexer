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
 * **Recursive nested stripping:** When an include value is an object (sub-include map)
 * and a `nestedConfig` entry exists for that key, the nested object's sub-fields are
 * recursively stripped using the sub-include as the include map and the config's
 * `baseFields` / `derivedFields` for the nested type.
 *
 * @module
 */

type IncludeMap = Record<string, boolean | Record<string, unknown> | undefined>;

/** Configuration for recursively stripping a nested object's sub-fields. */
interface NestedStripConfig {
  /** Base fields to always keep in the nested object (e.g., `['address']` for profiles) */
  baseFields: readonly string[];
  /** Optional derived field map for the nested object (e.g., `{ standard: 'decimals' }`) */
  derivedFields?: Record<string, string>;
}

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
 * @param nestedConfig - Optional map of field name → nested strip config. When a field's
 *                       include value is an object (sub-include) and a config exists,
 *                       the nested object is recursively stripped.
 * @returns The original object if include is undefined, or a new partial object with base + included fields
 */
export function stripExcluded<T extends Record<string, unknown>>(
  obj: T,
  include: undefined,
  baseFields: readonly string[],
  derivedFields?: Record<string, string>,
  nestedConfig?: Record<string, NestedStripConfig>,
): T;
export function stripExcluded<T extends Record<string, unknown>, const K extends string & keyof T>(
  obj: T,
  include: IncludeMap,
  baseFields: readonly K[],
  derivedFields?: Record<string, string>,
  nestedConfig?: Record<string, NestedStripConfig>,
): Partial<T> & Pick<T, K>;
export function stripExcluded(
  obj: Record<string, unknown>,
  include: IncludeMap | undefined,
  baseFields: readonly string[],
  derivedFields?: Record<string, string>,
  nestedConfig?: Record<string, NestedStripConfig>,
): Record<string, unknown> {
  if (!include) return obj;

  const result: Record<string, unknown> = {};

  // Always include base fields
  for (const key of baseFields) {
    if (key in obj) result[key] = obj[key];
  }

  // Include fields that are in the include parameter and truthy
  for (const [key, value] of Object.entries(include)) {
    if (value === true) {
      if (key in obj) result[key] = obj[key];
    } else if (typeof value === 'object' && value !== null) {
      if (key in obj) {
        const nested = obj[key];
        const config = nestedConfig?.[key];
        if (nested && typeof nested === 'object' && config) {
          // Recursively strip nested object's sub-fields
          result[key] = stripExcluded(
            nested as Record<string, unknown>,
            value as IncludeMap,
            config.baseFields,
            config.derivedFields,
          );
        } else {
          // No config for this nested field — keep as-is
          result[key] = nested;
        }
      }
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
