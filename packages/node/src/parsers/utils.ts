/**
 * Convert a Hasura `numeric` value to a plain decimal string, safe to pass
 * to `BigInt()`, avoiding scientific notation.
 *
 * In this codebase the generated GraphQL type for Hasura's `numeric` PostgreSQL
 * type (`Scalars['numeric']`) is typed as `string`. However this helper
 * defensively also accepts `number` inputs for cases where a numeric value has
 * already been coerced to a JS number (e.g. by a JSON parser or runtime layer).
 *
 * When a `numeric` value is represented as a JS number, very large uint256
 * values (e.g. total supply) become floats in scientific notation (`4.2e+76`),
 * which lose precision. We use `BigInt` to recover an integer representation
 * and return a non-scientific-notation decimal string.
 *
 * Handles:
 * - Normal integer strings: `"1000"` → `"1000"` (fast path, no conversion)
 * - Scientific notation strings: `"4.2e+76"` → rounded BigInt decimal string
 * - Defensive runtime `number`: `4.2e76` → rounded BigInt decimal string
 *
 * Note: for values already coerced to a JS `number`, precision may have been
 * lost before this function runs, but we at least return a decimal string safe
 * for `BigInt()`.
 */
export function numericToString(value: string | number): string {
  const s = String(value);
  // Fast path: plain integer with no scientific notation
  if (/^-?\d+$/.test(s)) return s;
  // Slow path: scientific notation or decimal — round to integer via BigInt
  try {
    return BigInt(Math.round(Number(s))).toString();
  } catch {
    return s; // last-resort fallback
  }
}
