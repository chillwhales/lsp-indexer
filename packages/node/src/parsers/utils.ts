/**
 * Convert a Hasura `numeric` value to a plain decimal string, avoiding
 * scientific notation that JavaScript uses for large floats.
 *
 * Hasura's `numeric` PostgreSQL type is serialized over JSON as a number.
 * For large uint256 values this becomes a JS float (e.g. 4.2e+76), which
 * loses precision. We use BigInt to recover the integer representation.
 *
 * Handles:
 * - Normal integer strings: `"1000"` → `"1000"`
 * - Scientific notation strings: `"4.2e+76"` → rounded BigInt string
 * - Already-a-number (runtime): `4.2e76` → rounded BigInt string
 *
 * Note: precision is already lost at the JSON parse step for very large
 * values, but we at least return a non-scientific-notation decimal string
 * that is safe to pass to `BigInt()`.
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
