'use client';

import { Activity, ChevronDown } from 'lucide-react';
import React from 'react';

import type { DataChangedEvent, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatRelativeTime, truncateAddress } from '@/lib/utils';

// ---------------------------------------------------------------------------
// DataChangedEventCard
// ---------------------------------------------------------------------------

export interface DataChangedEventCardProps {
  dataChangedEvent: PartialExcept<
    DataChangedEvent,
    'address' | 'dataKey' | 'dataValue' | 'dataKeyName'
  >;
}

/**
 * Card component for rendering a single ERC725Y DataChanged event.
 *
 * Base fields (always present): address, dataKey, dataValue, dataKeyName.
 * Conditional scalars: blockNumber, timestamp, logIndex, transactionIndex —
 * rendered via `'key' in obj` field-presence guards (DX-04 pattern).
 * Two collapsible relation sections: Universal Profile + Digital Asset.
 *
 * The dataKeyName field gets special treatment: bold resolved name when known,
 * "(Unknown Key)" in muted text when null. Raw hex always displayed in mono.
 */
export function DataChangedEventCard({
  dataChangedEvent,
}: DataChangedEventCardProps): React.ReactNode {
  const universalProfile =
    'universalProfile' in dataChangedEvent ? dataChangedEvent.universalProfile : null;
  const digitalAsset = 'digitalAsset' in dataChangedEvent ? dataChangedEvent.digitalAsset : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs truncate">
            {truncateAddress(dataChangedEvent.address)}
          </span>
          <span className="text-muted-foreground shrink-0">·</span>
          <span className="truncate">
            {dataChangedEvent.dataKeyName ?? (
              <span className="text-muted-foreground italic">Unknown Key</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fields — always present */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Address</dt>
            <dd className="font-mono text-xs break-all">{dataChangedEvent.address}</dd>
          </div>

          {/* Data Key with resolved name */}
          <DataKeyDisplay
            dataKey={dataChangedEvent.dataKey}
            dataKeyName={dataChangedEvent.dataKeyName}
          />

          {/* Data Value — truncated hex */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Value</dt>
            <dd className="font-mono text-xs break-all">
              {truncateDataValue(dataChangedEvent.dataValue)}
            </dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'blockNumber' in dataChangedEvent && dataChangedEvent.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Block Number</dt>
              <dd className="font-mono">{String(dataChangedEvent.blockNumber)}</dd>
            </div>
          )}
          {'timestamp' in dataChangedEvent && dataChangedEvent.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(dataChangedEvent.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(dataChangedEvent.timestamp)})
                </span>
              </dd>
            </div>
          )}
          {'logIndex' in dataChangedEvent && dataChangedEvent.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Log Index</dt>
              <dd className="font-mono">{String(dataChangedEvent.logIndex)}</dd>
            </div>
          )}
          {'transactionIndex' in dataChangedEvent && dataChangedEvent.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Tx Index</dt>
              <dd className="font-mono">{String(dataChangedEvent.transactionIndex)}</dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: Universal Profile */}
        {universalProfile != null && (
          <CollapsibleProfileSection label="Universal Profile" profile={universalProfile} />
        )}

        {/* Collapsible section 2: Digital Asset */}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={dataChangedEvent} label="dataChangedEvent" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DataKeyDisplay — shows resolved name (bold) + raw hex (mono)
// ---------------------------------------------------------------------------

function DataKeyDisplay({
  dataKey,
  dataKeyName,
}: {
  dataKey: string;
  dataKeyName: string | null;
}): React.ReactNode {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground w-40 shrink-0">Data Key</dt>
      <dd className="min-w-0">
        {dataKeyName != null ? (
          <div>
            <span className="font-semibold text-sm">{dataKeyName}</span>
            <div className="font-mono text-xs text-muted-foreground break-all">
              {dataKey.length > 20 ? `${dataKey.slice(0, 20)}…` : dataKey}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-muted-foreground text-xs italic">(Unknown Key)</span>
            <div className="font-mono text-xs break-all">
              {dataKey.length > 20 ? `${dataKey.slice(0, 20)}…` : dataKey}
            </div>
          </div>
        )}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data value truncation helper
// ---------------------------------------------------------------------------

/**
 * Truncate a hex data value for display. Shows the first ~80 chars
 * (including 0x prefix) followed by ellipsis for long values.
 */
function truncateDataValue(value: string): string {
  if (value.length <= 80) return value;
  return `${value.slice(0, 80)}…`;
}

// ---------------------------------------------------------------------------
// Collapsible raw data section (for future extensibility)
// ---------------------------------------------------------------------------

/** Simple collapsible section with ghost button trigger — matches existing card patterns */
export function CollapsibleSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          {icon}
          {label}
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
