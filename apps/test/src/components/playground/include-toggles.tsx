'use client';

import React, { useState } from 'react';

import { Switch } from '@/components/ui/switch';

export interface IncludeToggleConfig {
  /** Unique key matching the include field (e.g., 'tags', 'avatar') */
  key: string;
  /** Display label */
  label: string;
}

/**
 * Hook that manages include toggle state.
 *
 * All toggles start ON (matching the default behavior where omitting `include`
 * means "include everything"). Returns the include object only when at least
 * one toggle is OFF — otherwise returns `undefined` (use defaults).
 */
export function useIncludeToggles(configs: readonly IncludeToggleConfig[]): {
  values: Record<string, boolean>;
  toggle: (key: string) => void;
  /** Returns the include object, or undefined if all are ON (use defaults) */
  include: Record<string, boolean> | undefined;
} {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const c of configs) initial[c.key] = true;
    return initial;
  });

  const toggle = (key: string) => {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Only return include object when at least one toggle is OFF
  const allOn = Object.values(values).every(Boolean);
  const include = allOn ? undefined : values;

  return { values, toggle, include };
}

interface IncludeTogglesProps {
  configs: readonly IncludeToggleConfig[];
  values: Record<string, boolean>;
  onToggle: (key: string) => void;
}

/**
 * Row of include/exclude toggles. Reusable across all domain playground pages.
 * Each toggle controls whether a nested field is included in the GraphQL query
 * via @include directives.
 */
export function IncludeToggles({
  configs,
  values,
  onToggle,
}: IncludeTogglesProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium">Include fields</span>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {configs.map((config) => (
          <label
            key={config.key}
            className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
          >
            <Switch
              size="sm"
              checked={values[config.key] ?? true}
              onCheckedChange={() => onToggle(config.key)}
            />
            <span className={values[config.key] ? 'text-foreground' : 'text-muted-foreground'}>
              {config.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
