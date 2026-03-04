/**
 * Deterministic JSON serialisation with sorted object keys.
 *
 * Plain `JSON.stringify` does not guarantee key ordering — two objects with
 * identical entries inserted in different orders can produce different strings.
 * This function sorts keys at every nesting level so the output is stable
 * regardless of property insertion order, matching the approach used by
 * TanStack Query's internal `hashKey` / `stableValueHash`.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    val != null && typeof val === 'object' && !Array.isArray(val)
      ? Object.keys(val as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((sorted, k) => {
            sorted[k] = (val as Record<string, unknown>)[k];
            return sorted;
          }, {})
      : val,
  );
}
