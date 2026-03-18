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
import { formatRelativeTime, formatTimestamp, truncateAddress } from '@/lib/utils';

export interface DataChangedEventCardProps {
  dataChangedEvent: PartialExcept<DataChangedEvent, 'address' | 'dataKey' | 'dataValue'>;
}

/** ERC725Y DataChanged event card. Shows data key/value with optional key name resolution. */
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
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Address</dt>
            <dd className="font-mono text-xs break-all">{dataChangedEvent.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Key</dt>
            <dd className="font-mono text-xs break-all">{dataChangedEvent.dataKey}</dd>
          </div>
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
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Value</dt>
            <dd className="min-w-0">
              <ExpandableHex value={dataChangedEvent.dataValue} />
            </dd>
          </div>
          {'timestamp' in dataChangedEvent && dataChangedEvent.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {formatTimestamp(dataChangedEvent.timestamp)}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(dataChangedEvent.timestamp)})
                </span>
              </dd>
            </div>
          )}
          {'blockNumber' in dataChangedEvent && dataChangedEvent.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Block Number</dt>
              <dd className="font-mono text-xs">{String(dataChangedEvent.blockNumber)}</dd>
            </div>
          )}
          {'transactionIndex' in dataChangedEvent && dataChangedEvent.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Tx Index</dt>
              <dd className="font-mono text-xs">{String(dataChangedEvent.transactionIndex)}</dd>
            </div>
          )}
          {'logIndex' in dataChangedEvent && dataChangedEvent.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Log Index</dt>
              <dd className="font-mono text-xs">{String(dataChangedEvent.logIndex)}</dd>
            </div>
          )}
        </dl>
        {universalProfile != null && (
          <CollapsibleProfileSection label="Universal Profile" profile={universalProfile} />
        )}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={dataChangedEvent} label="dataChangedEvent" />
      </CardContent>
    </Card>
  );
}
