import type { Order_By } from '../graphql/graphql';

/**
 * Escape SQL LIKE wildcards (`%` and `_`) in a string so they are treated
 * as literal characters when used with Hasura's `_ilike` operator.
 *
 * Without escaping, user input like `"a%"` would match any value starting
 * with `"a"` instead of literally matching `"a%"`.
 */
export function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Compose a Hasura `order_by` direction string from a sort direction and
 * optional nulls preference.
 *
 * - `orderDir('asc')` → `'asc'` (Hasura default: nulls last)
 * - `orderDir('desc', 'first')` → `'desc_nulls_first'`
 * - `orderDir('asc', 'last')` → `'asc_nulls_last'`
 */
export function orderDir(direction: string, nulls?: 'first' | 'last'): Order_By {
  if (!nulls) return direction as Order_By;
  return `${direction}_nulls_${nulls}` as Order_By;
}

/**
 * Check whether a nested include object has at least one **truthy** sub-field.
 *
 * Used to decide if a nested relation (collection, holder, digitalAsset, etc.)
 * should be fetched at all. An empty object `{}` or an object with only falsy
 * values (`{ name: false }`) means "don't include the relation".
 *
 * @example
 * hasActiveIncludes(undefined)            // false — not provided
 * hasActiveIncludes({})                   // false — no sub-fields
 * hasActiveIncludes({ name: false })      // false — no truthy sub-fields
 * hasActiveIncludes({ name: true })       // true  — at least one active
 */
export function hasActiveIncludes(obj: Record<string, unknown> | undefined): boolean {
  return obj !== undefined && Object.values(obj).some(Boolean);
}
