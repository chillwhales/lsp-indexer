'use client';

import { Activity } from 'lucide-react';
import React from 'react';

import type { PartialExcept, TokenIdDataChangedEvent } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleNftSection,
} from '@/components/collapsible-sections';
import { ExpandableHex } from '@/components/expandable-hex';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, truncateAddress } from '@/lib/utils';

// ---------------------------------------------------------------------------
// TokenIdDataChangedEventCard
// ---------------------------------------------------------------------------

export interface TokenIdDataChangedEventCardProps {
  tokenIdDataChangedEvent: PartialExcept<
    TokenIdDataChangedEvent,
    'address' | 'dataKey' | 'dataValue' | 'tokenId'
  >;
}

/**
 * Card component for rendering a single ERC725Y TokenIdDataChanged event.
 *
 * Base fields (always present): address, dataKey, dataValue, tokenId.
 * Conditional scalars: dataKeyName, blockNumber, timestamp, logIndex, transactionIndex —
 * rendered via `'key' in obj` field-presence guards.
 * Two collapsible relation sections: NFT (full NftCard) + Digital Asset.
 *
 * Very similar to DataChangedEventCard but adds tokenId prominently and
 * replaces the Universal Profile section with an NFT section using the
 * full `Nft` type rendered via `CollapsibleNftSection` / `NftCard`.
 */
export function TokenIdDataChangedEventCard({
  tokenIdDataChangedEvent,
}: TokenIdDataChangedEventCardProps): React.ReactNode {
  const digitalAsset =
    'digitalAsset' in tokenIdDataChangedEvent ? tokenIdDataChangedEvent.digitalAsset : null;
  const nft = 'nft' in tokenIdDataChangedEvent ? tokenIdDataChangedEvent.nft : null;
  const hasDataKeyName = 'dataKeyName' in tokenIdDataChangedEvent;
  const dataKeyName = hasDataKeyName ? tokenIdDataChangedEvent.dataKeyName : undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs truncate">
            {truncateAddress(tokenIdDataChangedEvent.address)}
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
            <dd className="font-mono text-xs break-all">{tokenIdDataChangedEvent.address}</dd>
          </div>

          {/* Token ID — prominent display */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Token ID</dt>
            <dd className="font-mono text-xs break-all">{tokenIdDataChangedEvent.tokenId}</dd>
          </div>

          {/* Data Key — always present (base field) */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Key</dt>
            <dd className="font-mono text-xs break-all">{tokenIdDataChangedEvent.dataKey}</dd>
          </div>

          {/* Data Key Name — conditional include field */}
          {hasDataKeyName && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Data Key Name</dt>
              <dd>
                {dataKeyName != null ? (
                  <span className="text-xs">{dataKeyName}</span>
                ) : (
                  <span className="text-muted-foreground text-xs italic">(Unknown Key)</span>
                )}
              </dd>
            </div>
          )}

          {/* Data Value — expandable hex */}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Data Value</dt>
            <dd className="min-w-0">
              <ExpandableHex value={tokenIdDataChangedEvent.dataValue} />
            </dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'timestamp' in tokenIdDataChangedEvent && tokenIdDataChangedEvent.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(tokenIdDataChangedEvent.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(tokenIdDataChangedEvent.timestamp)})
                </span>
              </dd>
            </div>
          )}
          {'blockNumber' in tokenIdDataChangedEvent &&
            tokenIdDataChangedEvent.blockNumber != null && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-40 shrink-0">Block Number</dt>
                <dd className="font-mono text-xs">{String(tokenIdDataChangedEvent.blockNumber)}</dd>
              </div>
            )}
          {'transactionIndex' in tokenIdDataChangedEvent &&
            tokenIdDataChangedEvent.transactionIndex != null && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-40 shrink-0">Tx Index</dt>
                <dd className="font-mono text-xs">
                  {String(tokenIdDataChangedEvent.transactionIndex)}
                </dd>
              </div>
            )}
          {'logIndex' in tokenIdDataChangedEvent && tokenIdDataChangedEvent.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Log Index</dt>
              <dd className="font-mono text-xs">{String(tokenIdDataChangedEvent.logIndex)}</dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: NFT (full NftCard) */}
        {nft != null && <CollapsibleNftSection label="NFT" nft={nft} />}

        {/* Collapsible section 2: Digital Asset */}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={tokenIdDataChangedEvent} label="tokenIdDataChangedEvent" />
      </CardContent>
    </Card>
  );
}
