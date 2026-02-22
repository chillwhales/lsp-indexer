/**
 * Shared TypeScript utility types for conditional include inference.
 *
 * These types enable Prisma-style return type narrowing based on an `include`
 * parameter. When a consumer passes `{ name: true }`, the return type is
 * narrowed to only contain base fields + `name`.
 *
 * @module
 */

/**
 * Extract active field names from an include map.
 *
 * Given a mapping of include-key → full-type-field-name and the actual include
 * object, returns a union of full-type field names where the include value is
 * `true` or a sub-include object.
 *
 * - `true` → field is active
 * - `Record<string, unknown>` (sub-include) → field is active
 * - `false`, `undefined`, `never` → field is NOT active
 */
type ActiveFields<Map extends Record<string, string>, I extends Record<string, unknown>> = {
  [K in keyof Map & keyof I]: I[K] extends true
    ? Map[K]
    : I[K] extends Record<string, unknown>
      ? Map[K]
      : never;
}[keyof Map & keyof I];

/**
 * Narrow a full domain type based on an include parameter.
 *
 * @typeParam Full - The complete domain type (e.g., `Profile`)
 * @typeParam Base - Keys that are always present (e.g., `'address'`)
 * @typeParam Map - Mapping from include schema key → `Full` field name
 * @typeParam I - The actual include object type, or `undefined` for full type
 *
 * Behavior:
 * - `undefined` include → full type (backward compatible)
 * - `{}` include → base fields only
 * - `{ name: true }` → base fields + name
 * - `{ name: true, tags: false }` → same as `{ name: true }` (false = omitted)
 *
 * @example
 * ```ts
 * type Full = IncludeResult<Profile, 'address', ProfileIncludeFieldMap, undefined>;
 * // = Profile (all fields)
 *
 * type Minimal = IncludeResult<Profile, 'address', ProfileIncludeFieldMap, {}>;
 * // = { address: string }
 *
 * type NameOnly = IncludeResult<Profile, 'address', ProfileIncludeFieldMap, { name: true }>;
 * // = { address: string; name: string | null }
 * ```
 */
export type IncludeResult<
  Full,
  Base extends keyof Full,
  Map extends Record<string, keyof Full & string>,
  I extends Partial<Record<keyof Map, boolean | Record<string, unknown>>> | undefined,
> = I extends undefined
  ? Full
  : Pick<Full, Base | Extract<ActiveFields<Map, NonNullable<I>>, keyof Full>>;
