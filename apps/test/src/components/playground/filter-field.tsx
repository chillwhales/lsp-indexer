'use client';

import React, { useState } from 'react';

import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

export interface FilterFieldConfig {
  /** Unique key for the filter field */
  key: string;
  /** Label displayed above the input */
  label: string;
  /** Input placeholder text */
  placeholder: string;
  /** Whether to use monospace font (for addresses) */
  mono?: boolean;
}

interface FilterFieldProps {
  config: FilterFieldConfig;
  value: string;
  onChange: (value: string) => void;
}

export function FilterField({ config, value, onChange }: FilterFieldProps): React.ReactNode {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{config.label}</label>
      <Input
        placeholder={config.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-48 ${config.mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  );
}

/**
 * Hook that manages multiple debounced filter fields.
 *
 * Returns raw values (for inputs) and debounced values (for queries).
 * Generic across all domains — just pass different FilterFieldConfig[].
 *
 * @example
 * const { values, debouncedValues, setFieldValue } = useFilterFields(PROFILE_FILTERS);
 * // values.name — raw input value (for controlled input)
 * // debouncedValues.name — debounced value (for query filter)
 */
export function useFilterFields(
  configs: readonly FilterFieldConfig[],
  debounceMs = 300,
): {
  values: Record<string, string>;
  debouncedValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
} {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const c of configs) initial[c.key] = '';
    return initial;
  });

  const debouncedValues = useDebounce(values, debounceMs);

  const setFieldValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return { values, debouncedValues, setFieldValue };
}

interface FilterFieldsRowProps {
  configs: readonly FilterFieldConfig[];
  values: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
}

/**
 * Renders a row of filter fields from config. Reusable across domains.
 */
export function FilterFieldsRow({
  configs,
  values,
  onFieldChange,
}: FilterFieldsRowProps): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {configs.map((config) => (
        <FilterField
          key={config.key}
          config={config}
          value={values[config.key] ?? ''}
          onChange={(v) => onFieldChange(config.key, v)}
        />
      ))}
    </div>
  );
}
