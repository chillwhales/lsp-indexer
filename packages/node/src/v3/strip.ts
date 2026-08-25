interface IncludeMap {
  [key: string]: boolean | IncludeMap | undefined;
}

export interface NestedStripConfig {
  baseFields: readonly string[];
  nested?: Readonly<Record<string, NestedStripConfig>>;
  derived?: Readonly<Record<string, string>>;
}

/**
 * Apply the public include contract after parsing a fixed v3 GraphQL selection.
 * An omitted include returns the complete record; an include object returns only
 * identity/provenance fields plus explicitly requested fields.
 */
export function stripIncluded<T extends Record<string, unknown>>(
  value: T,
  include: undefined,
  config: NestedStripConfig,
): T;
export function stripIncluded<
  T extends Record<string, unknown>,
  const Key extends string & keyof T,
>(
  value: T,
  include: IncludeMap,
  config: NestedStripConfig & { baseFields: readonly Key[] },
): Partial<T> & Pick<T, Key>;
export function stripIncluded(
  value: Record<string, unknown>,
  include: IncludeMap | undefined,
  config: NestedStripConfig,
): Record<string, unknown> {
  if (include == null) return value;

  const result: Record<string, unknown> = {};
  for (const key of config.baseFields) {
    if (key in value) result[key] = value[key];
  }

  for (const [key, selection] of Object.entries(include)) {
    if (!selection || !(key in value)) continue;
    const fieldValue = value[key];
    if (selection === true || fieldValue == null) {
      result[key] = fieldValue;
      continue;
    }

    const nestedConfig = config.nested?.[key];
    if (nestedConfig == null || typeof fieldValue !== 'object' || Array.isArray(fieldValue)) {
      result[key] = fieldValue;
      continue;
    }
    result[key] = stripIncluded(fieldValue as Record<string, unknown>, selection, nestedConfig);
  }

  for (const [derivedField, sourceField] of Object.entries(config.derived ?? {})) {
    if (include[sourceField] && derivedField in value) result[derivedField] = value[derivedField];
  }

  return result;
}
