'use client';

import { Activity } from 'lucide-react';
import React from 'react';

import type { DataChangedEvent, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { ExpandableHex } from '@/components/expandable-hex';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, truncateAddress } from '@/lib/utils';

// ---------------------------------------------------------------------------
// DataChangedEventCard
// ---------------------------------------------------------------------------

export interface DataChangedEventCardProps {
  dataChangedEvent: PartialExcept<DataChangedEvent, 'address' | 'dataKey' | 'dataValue'>;
}

/**
 * Card component for rendering a single ERC725Y DataChanged event.
 *
 * Base fields (always present): address, dataKey, dataValue.
 * Conditional scalars: dataKeyName, blockNumber, timestamp, logIndex, transactionIndex —
 * rendered via `'key' in obj` field-presence guards (DX-04 pattern).
 * Two collapsible relation sections: Universal Profile + Digital Asset.
 *
 * The dataKeyName field (when included) gets special treatment: bold resolved name
 * when known, "(Unknown Key)" in muted text when null. Raw hex always displayed in mono.
 */
export function DataChangedEventCard({
  dataChangedEvent,
}: DataChangedEventCardProps): React.ReactNode {
  const universalProfile =
    'universalProfile' in dataChangedEvent ? dataChangedEvent.universalProfile : null;
  const digitalAsset = 'digitalAsset' in dataChangedEvent ? dataChangedEvent.digitalAsset : null;
  const hasDataKeyName = 'dataKeyName' in dataChangedEvent;
  const dataKeyName = hasDataKeyName ? dataChangedEvent.dataKeyName : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs truncate">
            {truncateAddress(dataChangedEvent.address)}
          </span>
          {hasDataKeyName && (
            <>
              <span className="text-muted-foreground shrink-0">·</span>
              <span className="truncate">
                {dataKeyName ?? <span className="text-muted-foreground italic">Unknown Key</span>}
              </span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fields — always present */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Address</dt>
            <dd className="font-mono text-xs break-all">{dataChangedEvent.address}</dd>
          </div>

          {/* Data Key — always present (base field) */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Key</dt>
            <dd className="font-mono text-xs break-all">{dataChangedEvent.dataKey}</dd>
          </div>

          {/* Data Key Name — conditional include field */}
          {hasDataKeyName && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Data Key Name</dt>
              <dd>
                {dataKeyName != null ? (
                  <span className="text-xs">{dataKeyName}</span>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Unknown Key</span>
                )}
              </dd>
            </div>
          )}

          {/* Data Value — expandable hex */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Value</dt>
            <dd className="min-w-0">
              <ExpandableHex value={dataChangedEvent.dataValue} />
            </dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'blockNumber' in dataChangedEvent && dataChangedEvent.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Block Number</dt>
              <dd className="font-mono text-xs">{String(dataChangedEvent.blockNumber)}</dd>
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
              <dd className="font-mono text-xs">{String(dataChangedEvent.logIndex)}</dd>
            </div>
          )}
          {'transactionIndex' in dataChangedEvent && dataChangedEvent.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Tx Index</dt>
              <dd className="font-mono text-xs">{String(dataChangedEvent.transactionIndex)}</dd>
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
