'use client';

import { Paintbrush } from 'lucide-react';
import React from 'react';

import type { DigitalAsset, PartialExcept, Profile } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getDigitalAssetLabel, getProfileLabel } from '@/lib/utils';

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
  const profile =
    'creatorProfile' in obj ? (obj.creatorProfile as PartialExcept<Profile, 'address'>) : null;
  const digitalAsset =
    'digitalAsset' in obj ? (obj.digitalAsset as PartialExcept<DigitalAsset, 'address'>) : null;

  const creatorLabel = getProfileLabel(profile, obj.creatorAddress as string);
  const daInfo = getDigitalAssetLabel(digitalAsset, obj.digitalAssetAddress as string);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Paintbrush className="size-4 text-muted-foreground" />
          <span className="truncate">{creatorLabel}</span>
          <span className="text-muted-foreground shrink-0">→</span>
          <span className="truncate">{daInfo.label}</span>
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
        {profile != null && <CollapsibleProfileSection label="Creator Profile" profile={profile} />}

        {/* Collapsible section 2: Digital Asset */}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={creator} label="creator" />
      </CardContent>
    </Card>
  );
}
