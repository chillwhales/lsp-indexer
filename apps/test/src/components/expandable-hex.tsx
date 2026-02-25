'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ExpandableHex — truncated hex with click-to-expand
// ---------------------------------------------------------------------------

/** Threshold (in characters) above which the value is truncated */
const TRUNCATE_THRESHOLD = 80;

/** Number of leading characters to show when truncated (including 0x prefix) */
const TRUNCATE_LENGTH = 80;

interface ExpandableHexProps {
  /** The full hex string to display */
  value: string;
  /** Optional additional className for the container */
  className?: string;
}

/**
 * Displays a hex string that truncates long values with an expand/collapse toggle.
 *
 * - Short values (≤ 80 chars): shown in full, no toggle
 * - Long values: truncated with "…" suffix and a "Show full" / "Show less" toggle
 * - Expanded state wraps across multiple lines via `break-all`
 *
 * Shared between DataChangedEventCard and TokenIdDataChangedEventCard.
 */
export function ExpandableHex({ value, className }: ExpandableHexProps): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > TRUNCATE_THRESHOLD;

  if (!isLong) {
    return <span className={cn('font-mono text-xs break-all', className)}>{value}</span>;
  }

  return (
    <div className={cn('min-w-0', className)}>
      <span className="font-mono text-xs break-all">
        {expanded ? value : `${value.slice(0, TRUNCATE_LENGTH)}…`}
      </span>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
      >
        {expanded ? 'Show less' : 'Show full'}
      </button>
    </div>
  );
}
