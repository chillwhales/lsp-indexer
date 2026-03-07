'use client';

import { Paintbrush } from 'lucide-react';
import React from 'react';

import type { Creator, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getDigitalAssetLabel, getProfileLabel } from '@/lib/utils';

export interface CreatorCardProps {
  creator: PartialExcept<Creator, 'creatorAddress' | 'digitalAssetAddress'>;
  index: number;
}

/** LSP4 creator record card. Shows creator-to-asset relationship. */
export function CreatorCard({ creator, index }: CreatorCardProps): React.ReactNode {
  const creatorProfile = 'creatorProfile' in creator ? creator.creatorProfile : null;
  const digitalAsset = 'digitalAsset' in creator ? creator.digitalAsset : null;

  const creatorLabel = getProfileLabel(creatorProfile, creator.creatorAddress);
  const daInfo = getDigitalAssetLabel(digitalAsset, creator.digitalAssetAddress);

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
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Creator Address</dt>
            <dd className="font-mono text-xs break-all">{creator.creatorAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Digital Asset Address</dt>
            <dd className="font-mono text-xs break-all">{creator.digitalAssetAddress}</dd>
          </div>
          {'arrayIndex' in creator && creator.arrayIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Array Index</dt>
              <dd className="font-mono">{String(creator.arrayIndex)}</dd>
            </div>
          )}
          {'interfaceId' in creator && creator.interfaceId != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Interface ID</dt>
              <dd className="font-mono text-xs break-all">{creator.interfaceId}</dd>
            </div>
          )}
          {'timestamp' in creator && creator.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(creator.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(creator.timestamp)})
                </span>
              </dd>
            </div>
          )}
        </dl>
        {creatorProfile != null && (
          <CollapsibleProfileSection label="Creator Profile" profile={creatorProfile} />
        )}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={creator} label="creator" />
      </CardContent>
    </Card>
  );
}
