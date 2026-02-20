/**
 * Escape SQL LIKE wildcards (`%` and `_`) in a string so they are treated
 * as literal characters when used with Hasura's `_ilike` operator.
 *
 * Without escaping, user input like `"a%"` would match any value starting
 * with `"a"` instead of literally matching `"a%"`.
 */
export function escapeLike(value: string): string {
  return value.replace(/%/g, '\\%').replace(/_/g, '\\_');
}
