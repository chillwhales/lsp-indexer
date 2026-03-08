'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';

/** Hex string display with click-to-expand for long values. */

const TRUNCATE_THRESHOLD = 80;
const TRUNCATE_LENGTH = 80;

interface ExpandableHexProps {
  value: string;
  className?: string;
}
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
