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

// ---------------------------------------------------------------------------
// Sub-include hook + component — for nested relations with per-field toggles
// ---------------------------------------------------------------------------

/** State returned by `useSubInclude` for a single nested relation. */
export interface SubIncludeState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  subValues: Record<string, boolean>;
  toggleSub: (key: string) => void;
  /**
   * The include value to pass into the parent include object.
   * - `undefined` → relation excluded (enabled = false)
   * - `{}` → relation included with all defaults (enabled + all sub-toggles ON)
   * - `{ key: true/false, ... }` → relation included with explicit sub-fields
   */
  value: Record<string, boolean> | undefined;
}

/**
 * Generic hook for managing a nested relation's include state.
 *
 * Replaces the 7 identical `useCollectionInclude`, `useHolderInclude`,
 * `useProfileInclude`, `useDigitalAssetInclude`, `useNftInclude` hooks
 * that were duplicated across pages.
 *
 * @param configs - The sub-field toggle configs for this relation
 */
export function useSubInclude(configs: readonly IncludeToggleConfig[]): SubIncludeState {
  const [enabled, setEnabled] = useState(true);
  const { values: subValues, toggle: toggleSub, include: subInclude } = useIncludeToggles(configs);

  return {
    enabled,
    setEnabled,
    subValues,
    toggleSub,
    // When all sub-toggles are ON, subInclude is undefined (useIncludeToggles returns
    // undefined for "all defaults"). We must pass the explicit subValues (all true) instead
    // of {} — because {} is treated as "no active includes" by hasActiveIncludes, which
    // would incorrectly exclude this relation when the parent include object is present.
    value: enabled ? (subInclude ?? { ...subValues }) : undefined,
  };
}

/**
 * Collapsible sub-include toggle section for a nested relation.
 *
 * Shows a parent enable/disable switch with a label, and when enabled,
 * shows the individual sub-field toggles indented beneath it.
 *
 * Replaces 7 near-identical `CollectionIncludeSection`, `HolderIncludeSection`,
 * `DigitalAssetIncludeSection`, etc. components.
 */
export function SubIncludeSection({
  label,
  subtitle,
  configs,
  state,
}: {
  label: string;
  subtitle: string;
  configs: readonly IncludeToggleConfig[];
  state: SubIncludeState;
}): React.ReactNode {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
        <Switch size="sm" checked={state.enabled} onCheckedChange={state.setEnabled} />
        <span className={state.enabled ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {label}
        </span>
      </label>
      {state.enabled && (
        <div className="ml-6 pl-3 border-l space-y-1">
          <span className="text-xs text-muted-foreground">{subtitle}</span>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {configs.map((config) => (
              <label
                key={config.key}
                className="flex items-center gap-1 text-xs cursor-pointer select-none"
              >
                <Switch
                  size="sm"
                  checked={state.subValues[config.key] ?? true}
                  onCheckedChange={() => state.toggleSub(config.key)}
                />
                <span
                  className={
                    state.subValues[config.key] ? 'text-foreground' : 'text-muted-foreground'
                  }
                >
                  {config.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build nested include — merges base toggles with sub-include relation values
// ---------------------------------------------------------------------------

/**
 * Build a nested include object from flat base-toggle values and
 * sub-include relation values.
 *
 * Returns `undefined` when everything is at defaults (all base toggles ON
 * and all sub-includes enabled with all sub-fields ON), letting the GraphQL
 * document defaults apply.
 *
 * @param baseValues - Flat boolean toggles (e.g., `{ tokenIdCount: true }`)
 * @param subIncludes - Keyed sub-include values from `useSubInclude().value`
 */
export function buildNestedInclude(
  baseValues: Record<string, boolean>,
  subIncludes: Record<string, Record<string, boolean> | undefined>,
): Record<string, unknown> | undefined {
  const allBaseOn = Object.values(baseValues).every(Boolean);
  const allSubsDefaulted = Object.values(subIncludes).every(
    (v) => v !== undefined && Object.keys(v).length === 0,
  );

  if (allBaseOn && allSubsDefaulted) return undefined; // Everything at defaults

  const include: Record<string, unknown> = { ...baseValues };
  for (const [key, val] of Object.entries(subIncludes)) {
    if (val !== undefined) {
      include[key] = val;
    }
  }
  return include;
}
