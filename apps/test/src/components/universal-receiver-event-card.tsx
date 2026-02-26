'use client';

import { ArrowDownFromLine } from 'lucide-react';
import React from 'react';

import type { PartialExcept, UniversalReceiverEvent } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { ExpandableHex } from '@/components/expandable-hex';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, truncateAddress } from '@/lib/utils';

// ---------------------------------------------------------------------------
// UniversalReceiverEventCard
// ---------------------------------------------------------------------------

export interface UniversalReceiverEventCardProps {
  universalReceiverEvent: PartialExcept<
    UniversalReceiverEvent,
    'address' | 'from' | 'typeId' | 'receivedData' | 'returnedValue' | 'value'
  >;
}

/**
 * Card component for rendering a single universal receiver event.
 *
 * Base fields (always present): address, from, typeId, receivedData,
 * returnedValue, value.
 * Conditional scalars: blockNumber, timestamp, logIndex, transactionIndex —
 * rendered via `'key' in obj` field-presence guards (DX-04 pattern).
 * Three collapsible relation sections: Receiving Profile (universalProfile),
 * Sender Profile (fromProfile), Sender Asset (fromAsset).
 *
 * Most relation-heavy card in the project (3 collapsible sections).
 */
export function UniversalReceiverEventCard({
  universalReceiverEvent,
}: UniversalReceiverEventCardProps): React.ReactNode {
  const evt = universalReceiverEvent;

  const universalProfile = 'universalProfile' in evt ? evt.universalProfile : null;
  const fromProfile = 'fromProfile' in evt ? evt.fromProfile : null;
  const fromAsset = 'fromAsset' in evt ? evt.fromAsset : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ArrowDownFromLine className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs truncate">{truncateAddress(evt.address)}</span>
          <span className="text-muted-foreground shrink-0">←</span>
          <span className="font-mono text-xs truncate">{truncateAddress(evt.from)}</span>
          <span className="text-muted-foreground shrink-0">·</span>
          <span className="font-mono text-xs truncate">
            {evt.typeId.length > 20 ? `${evt.typeId.slice(0, 20)}…` : evt.typeId}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fields — always present */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Receiver</dt>
            <dd className="font-mono text-xs break-all">{evt.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">From</dt>
            <dd className="font-mono text-xs break-all">{evt.from}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Type ID</dt>
            <dd className="font-mono text-xs break-all">{evt.typeId}</dd>
          </div>

          {/* Received Data — expandable hex */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Received Data</dt>
            <dd className="min-w-0">
              <ExpandableHex value={evt.receivedData} />
            </dd>
          </div>

          {/* Returned Value — expandable hex */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Returned Value</dt>
            <dd className="min-w-0">
              <ExpandableHex value={evt.returnedValue} />
            </dd>
          </div>

          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Value (wei)</dt>
            <dd className="font-mono text-xs">{evt.value}</dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'blockNumber' in evt && evt.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Block Number</dt>
              <dd className="font-mono text-xs">{String(evt.blockNumber)}</dd>
            </div>
          )}
          {'timestamp' in evt && evt.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(evt.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">({formatRelativeTime(evt.timestamp)})</span>
              </dd>
            </div>
          )}
          {'logIndex' in evt && evt.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Log Index</dt>
              <dd className="font-mono text-xs">{String(evt.logIndex)}</dd>
            </div>
          )}
          {'transactionIndex' in evt && evt.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Tx Index</dt>
              <dd className="font-mono text-xs">{String(evt.transactionIndex)}</dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: Receiving Profile (universalProfile) */}
        {universalProfile != null && (
          <CollapsibleProfileSection label="Receiving Profile" profile={universalProfile} />
        )}

        {/* Collapsible section 2: Sender Profile (fromProfile) */}
        {fromProfile != null && (
          <CollapsibleProfileSection label="Sender Profile" profile={fromProfile} />
        )}

        {/* Collapsible section 3: Sender Asset (fromAsset) */}
        {fromAsset != null && (
          <CollapsibleDigitalAssetSection label="Sender Asset" digitalAsset={fromAsset} />
        )}

        <RawJsonToggle data={universalReceiverEvent} label="universalReceiverEvent" />
      </CardContent>
    </Card>
  );
}
