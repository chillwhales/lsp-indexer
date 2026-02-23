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
export function orderDir(direction: 'asc' | 'desc', nulls?: 'first' | 'last'): Order_By {
  if (!nulls) return direction;
  return `${direction}_nulls_${nulls}`;
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

/**
 * Normalize a timestamp value to an ISO 8601 string for Hasura.
 *
 * Accepts either:
 * - An ISO date string (e.g. `"2024-01-01"`, `"2024-01-01T00:00:00Z"`) — passed through as-is
 * - A unix timestamp in **seconds** (e.g. `1704067200`) — converted to ISO string
 *
 * Unix timestamps are detected by type: `number` → unix seconds, `string` → ISO string.
 */
export function normalizeTimestamp(value: string | number): string {
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }
  return value;
}
