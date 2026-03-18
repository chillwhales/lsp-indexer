'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SortOption {
  /** Value used in the sort object (e.g., 'followerCount') */
  value: string;
  /** Display label (e.g., 'Followers') */
  label: string;
}

interface SortControlsProps {
  options: readonly SortOption[];
  sortField: string;
  sortDirection: string;
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: string) => void;
  /** Current nulls ordering — empty string means "use Hasura default" */
  sortNulls?: string;
  onSortNullsChange?: (nulls: string) => void;
  /** If provided, shows a limit input */
  limit?: number;
  onLimitChange?: (limit: number) => void;
  /** When true, hide Direction and Nulls dropdowns (used for self-describing sort fields like 'newest'/'oldest') */
  hideDirectionAndNulls?: boolean;
}

/**
 * Generic sort + direction + nulls + optional limit controls.
 * Reusable across all domain playground pages.
 */
export function SortControls({
  options,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  sortNulls = '',
  onSortNullsChange,
  limit,
  onLimitChange,
  hideDirectionAndNulls,
}: SortControlsProps): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground font-medium">Sort by</Label>
        <Select value={sortField} onValueChange={onSortFieldChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hideDirectionAndNulls && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground font-medium">Direction</Label>
          <Select value={sortDirection} onValueChange={onSortDirectionChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!hideDirectionAndNulls && onSortNullsChange && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground font-medium">Nulls</Label>
          <Select value={sortNulls || 'default'} onValueChange={onSortNullsChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="first">Nulls first</SelectItem>
              <SelectItem value="last">Nulls last</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {limit !== undefined && onLimitChange && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground font-medium">Limit</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value) || 10)}
            className="w-20"
          />
        </div>
      )}
    </div>
  );
}
