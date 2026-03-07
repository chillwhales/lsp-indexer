/** Owned Asset card (LSP7 fungible ownership). Shows balance, holder, and digital asset. */
import { Loader2, Wallet } from 'lucide-react';
import React from 'react';

import type { OwnedAsset, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelativeTime, formatTokenAmount } from '@/lib/utils';

/**
 * Format balance: use formatTokenAmount when digital asset decimals are available,
 * otherwise show raw bigint string with thousands separators.
 */
function formatBalance(balance: bigint, decimals: number | null | undefined): string {
  if (decimals != null && decimals > 0) {
    return formatTokenAmount(balance.toString(), decimals);
  }
  // No decimals: show raw value with thousands separators for readability
  return balance.toLocaleString();
}

/**
 * Build a descriptive tooltip for the balance field.
 * Always shows the raw bigint; when decimals available, also shows formatted.
 */
function balanceTooltip(balance: bigint, decimals: number | null | undefined): string {
  const raw = balance.toString();
  if (decimals != null && decimals > 0) {
    return `Raw: ${raw} (${decimals} decimals)`;
  }
  return `Raw: ${raw}`;
}

export interface OwnedAssetCardProps {
  ownedAsset: PartialExcept<OwnedAsset, 'id' | 'digitalAssetAddress' | 'holderAddress'>;
  isFetching?: boolean;
}

export function OwnedAssetCard({ ownedAsset, isFetching }: OwnedAssetCardProps): React.ReactNode {
  const {
    id,
    digitalAssetAddress,
    holderAddress,
    balance,
    block,
    timestamp,
    tokenIdCount,
    digitalAsset,
    holder,
  } = ownedAsset;

  // Derive decimals and name/symbol from nested digital asset for display
  const decimals = digitalAsset?.decimals;
  const daName = digitalAsset?.name;
  const daSymbol = digitalAsset?.symbol;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-muted-foreground" />
              {daName !== undefined ? (daName ?? 'Owned Asset') : 'Owned Asset'}
              {daSymbol && (
                <span className="text-base font-normal text-muted-foreground">({daSymbol})</span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">ID: {id}</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {tokenIdCount != null && (
              <Badge variant="secondary" className="text-xs">
                {tokenIdCount} token ID{tokenIdCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {timestamp && (
              <Badge variant="outline" className="text-xs">
                {formatRelativeTime(timestamp)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Holder</dt>
            <dd className="font-mono text-xs break-all">{holderAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-28 shrink-0">Asset Address</dt>
            <dd className="font-mono text-xs break-all">{digitalAssetAddress}</dd>
          </div>
          {balance != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Balance</dt>
              <dd>
                <Tooltip>
                  <TooltipTrigger className="font-mono underline decoration-dashed underline-offset-2 cursor-default">
                    {formatBalance(balance, decimals)}
                    {decimals != null && daSymbol && (
                      <span className="text-muted-foreground ml-1">{daSymbol}</span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{balanceTooltip(balance, decimals)}</p>
                  </TooltipContent>
                </Tooltip>
              </dd>
            </div>
          )}
          {block != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Block</dt>
              <dd className="font-mono text-xs">{block}</dd>
            </div>
          )}
          {timestamp && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">({formatRelativeTime(timestamp)})</span>
              </dd>
            </div>
          )}
        </dl>
        {holder != null && <CollapsibleProfileSection label="Holder Profile" profile={holder} />}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={ownedAsset} label="ownedAsset" />
      </CardContent>
    </Card>
  );
}
