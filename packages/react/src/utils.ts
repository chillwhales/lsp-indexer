/**
 * Deterministic JSON serialisation with sorted object keys.
 *
 * Plain `JSON.stringify` does not guarantee key ordering — two objects with
 * identical entries inserted in different orders can produce different strings.
 * This function sorts keys at every nesting level so the output is stable
 * regardless of property insertion order, matching the approach used by
 * TanStack Query's internal `hashKey` / `stableValueHash`.
 */
function normalizeStableValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(normalizeStableValue);
  if (value == null || typeof value !== 'object') return value;

  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    normalized[key] = normalizeStableValue(Reflect.get(value, key));
  }
  return normalized;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeStableValue(value)) ?? 'undefined';
}
