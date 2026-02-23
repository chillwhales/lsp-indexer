'use client';

import { ChevronDown, Coins, Paintbrush, User } from 'lucide-react';
import React from 'react';

import type { PartialExcept } from '@lsp-indexer/types';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatRelativeTime } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate an address to 0x1234…abcd format */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Extract the profile name from a nested profile object, or fall back to truncated address */
function getProfileLabel(profile: Record<string, unknown> | null | undefined): string | null {
  if (
    profile &&
    typeof profile === 'object' &&
    'name' in profile &&
    typeof profile.name === 'string'
  ) {
    return profile.name;
  }
  if (profile && typeof profile === 'object' && 'address' in profile) {
    return truncateAddress(String(profile.address));
  }
  return null;
}

/** Extract digital asset name and symbol from a nested DA object */
function getDigitalAssetLabel(da: Record<string, unknown>): {
  name: string | null;
  symbol: string | null;
} {
  const name = 'name' in da && typeof da.name === 'string' ? da.name : null;
  const symbol = 'symbol' in da && typeof da.symbol === 'string' ? da.symbol : null;
  return { name, symbol };
}

// ---------------------------------------------------------------------------
// CreatorCard
// ---------------------------------------------------------------------------

export interface CreatorCardProps {
  /** Accepts any shape of Creator — full, narrowed via include, or partial */
  creator: Record<string, unknown>;
  index: number;
}

/**
 * Card component for rendering a single LSP4 creator record.
 *
 * Base fields (always present): creatorAddress, digitalAssetAddress.
 * Conditional scalars: arrayIndex, interfaceId, timestamp — rendered via
 * `'key' in obj` field-presence guards (DX-04 pattern).
 * Two collapsible relation sections: Creator Profile + Digital Asset.
 */
export function CreatorCard({ creator, index }: CreatorCardProps): React.ReactNode {
  const obj = creator;

  // Derive display labels from nested relations
  const profileLabel =
    'creatorProfile' in obj
      ? getProfileLabel(obj.creatorProfile as Record<string, unknown> | null)
      : null;
  const daInfo =
    'digitalAsset' in obj && obj.digitalAsset
      ? getDigitalAssetLabel(obj.digitalAsset as Record<string, unknown>)
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Paintbrush className="size-4 text-muted-foreground" />
          <span className="truncate">
            {profileLabel ?? truncateAddress(obj.creatorAddress as string)}
          </span>
          <span className="text-muted-foreground shrink-0">→</span>
          <span className="truncate">
            {daInfo?.name ?? truncateAddress(obj.digitalAssetAddress as string)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base fields — always present */}
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Creator Address</dt>
            <dd className="font-mono text-xs break-all">{obj.creatorAddress as string}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Digital Asset Address</dt>
            <dd className="font-mono text-xs break-all">{obj.digitalAssetAddress as string}</dd>
          </div>

          {/* Conditional scalar fields via field-presence checks */}
          {'arrayIndex' in obj && obj.arrayIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Array Index</dt>
              <dd className="font-mono">{String(obj.arrayIndex)}</dd>
            </div>
          )}
          {'interfaceId' in obj && obj.interfaceId != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Interface ID</dt>
              <dd className="font-mono text-xs break-all">{obj.interfaceId as string}</dd>
            </div>
          )}
          {'timestamp' in obj && obj.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(obj.timestamp as string).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(obj.timestamp as string)})
                </span>
              </dd>
            </div>
          )}
        </dl>

        {/* Collapsible section 1: Creator Profile */}
        {'creatorProfile' in obj && obj.creatorProfile != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Creator Profile: {profileLabel ?? 'Unknown'}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ProfileCard
                profile={obj.creatorProfile as PartialExcept<{ address: string }, 'address'>}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Collapsible section 2: Digital Asset */}
        {'digitalAsset' in obj && obj.digitalAsset != null && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Coins className="size-3.5" />
                Digital Asset:{' '}
                {daInfo?.name ??
                  truncateAddress(
                    ((obj.digitalAsset as Record<string, unknown>).address as string) ??
                      (obj.digitalAssetAddress as string),
                  )}
                {daInfo?.symbol && (
                  <span className="text-muted-foreground font-normal">({daInfo.symbol})</span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <DigitalAssetCard
                digitalAsset={obj.digitalAsset as PartialExcept<{ address: string }, 'address'>}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={creator} label="creator" />
      </CardContent>
    </Card>
  );
}
