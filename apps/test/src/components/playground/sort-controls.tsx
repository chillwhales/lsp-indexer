'use client';

import React from 'react';

import { Input } from '@/components/ui/input';
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
  /** If provided, shows a limit input */
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

/**
 * Generic sort + direction + optional limit controls.
 * Reusable across all domain playground pages.
 */
export function SortControls({
  options,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  limit,
  onLimitChange,
}: SortControlsProps): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">Sort by</label>
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

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">Direction</label>
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

      {limit !== undefined && onLimitChange && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">Limit</label>
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
