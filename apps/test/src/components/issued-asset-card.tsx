'use client';

import { FileOutput } from 'lucide-react';
import React from 'react';

import type { IssuedAsset, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { RawJsonToggle } from '@/components/playground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime, getDigitalAssetLabel, getProfileLabel } from '@/lib/utils';

export interface IssuedAssetCardProps {
  issuedAsset: PartialExcept<IssuedAsset, 'issuerAddress' | 'assetAddress'>;
  index: number;
}

/** LSP12 issued asset card. Shows issuer-to-asset relationship. */
export function IssuedAssetCard({
  issuedAsset,
  index: _index,
}: IssuedAssetCardProps): React.ReactNode {
  const issuerProfile = 'issuerProfile' in issuedAsset ? issuedAsset.issuerProfile : null;
  const digitalAsset = 'digitalAsset' in issuedAsset ? issuedAsset.digitalAsset : null;

  const issuerLabel = getProfileLabel(issuerProfile, issuedAsset.issuerAddress);
  const daInfo = getDigitalAssetLabel(digitalAsset, issuedAsset.assetAddress);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileOutput className="size-4 text-muted-foreground" />
          <span className="truncate">{issuerLabel}</span>
          <span className="text-muted-foreground shrink-0">→</span>
          <span className="truncate">{daInfo.label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Issuer Address</dt>
            <dd className="font-mono text-xs break-all">{issuedAsset.issuerAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-40 shrink-0">Asset Address</dt>
            <dd className="font-mono text-xs break-all">{issuedAsset.assetAddress}</dd>
          </div>
          {'arrayIndex' in issuedAsset && issuedAsset.arrayIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Array Index</dt>
              <dd className="font-mono">{String(issuedAsset.arrayIndex)}</dd>
            </div>
          )}
          {'interfaceId' in issuedAsset && issuedAsset.interfaceId != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Interface ID</dt>
              <dd className="font-mono text-xs break-all">{issuedAsset.interfaceId}</dd>
            </div>
          )}
          {'timestamp' in issuedAsset && issuedAsset.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-40 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {new Date(issuedAsset.timestamp).toLocaleString()}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(issuedAsset.timestamp)})
                </span>
              </dd>
            </div>
          )}
        </dl>
        {issuerProfile != null && (
          <CollapsibleProfileSection label="Issuer Profile" profile={issuerProfile} />
        )}
        {digitalAsset != null && (
          <CollapsibleDigitalAssetSection label="Digital Asset" digitalAsset={digitalAsset} />
        )}

        <RawJsonToggle data={issuedAsset} label="issuedAsset" />
      </CardContent>
    </Card>
  );
}
