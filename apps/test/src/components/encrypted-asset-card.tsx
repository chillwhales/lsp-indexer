'use client';

import { ChevronDown, FileText, Layers, Lock, ShieldCheck } from 'lucide-react';
import React from 'react';

import type { EncryptedAsset, PartialExcept } from '@lsp-indexer/types';

import { CollapsibleProfileSection } from '@/components/collapsible-sections';
import { ImageList } from '@/components/image-list';
import { RawJsonToggle } from '@/components/playground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatRelativeTime, formatTimestamp, truncateAddress } from '@/lib/utils';

export interface EncryptedAssetCardProps {
  encryptedAsset: PartialExcept<EncryptedAsset, 'address' | 'contentId' | 'revision'>;
}

/** LSP29 encrypted asset card. Shows encryption, file/chunks metadata, and images. */
export function EncryptedAssetCard({ encryptedAsset }: EncryptedAssetCardProps): React.ReactNode {
  const universalProfile =
    'universalProfile' in encryptedAsset ? encryptedAsset.universalProfile : null;

  // Determine card title: use title if present, otherwise truncated address
  const titleText =
    'title' in encryptedAsset && encryptedAsset.title
      ? encryptedAsset.title
      : truncateAddress(encryptedAsset.address);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Lock className="size-4 text-muted-foreground" />
          <span className="truncate">{titleText}</span>
          {encryptedAsset.contentId && (
            <span className="font-mono text-xs text-muted-foreground shrink-0">
              {encryptedAsset.contentId.length > 16
                ? `${encryptedAsset.contentId.slice(0, 16)}…`
                : encryptedAsset.contentId}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Address</dt>
            <dd className="font-mono text-xs break-all">{encryptedAsset.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Content ID</dt>
            <dd className="font-mono text-xs break-all">{encryptedAsset.contentId ?? '(none)'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Revision</dt>
            <dd className="font-mono">{encryptedAsset.revision ?? '(none)'}</dd>
          </div>
          {'arrayIndex' in encryptedAsset && encryptedAsset.arrayIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Array Index</dt>
              <dd className="font-mono">{String(encryptedAsset.arrayIndex)}</dd>
            </div>
          )}
          {'timestamp' in encryptedAsset && encryptedAsset.timestamp != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Timestamp</dt>
              <dd className="text-xs">
                {formatTimestamp(encryptedAsset.timestamp)}{' '}
                <span className="text-muted-foreground">
                  ({formatRelativeTime(encryptedAsset.timestamp)})
                </span>
              </dd>
            </div>
          )}
          {'blockNumber' in encryptedAsset && encryptedAsset.blockNumber != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Block Number</dt>
              <dd className="font-mono text-xs">{String(encryptedAsset.blockNumber)}</dd>
            </div>
          )}
          {'transactionIndex' in encryptedAsset && encryptedAsset.transactionIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Tx Index</dt>
              <dd className="font-mono text-xs">{String(encryptedAsset.transactionIndex)}</dd>
            </div>
          )}
          {'logIndex' in encryptedAsset && encryptedAsset.logIndex != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Log Index</dt>
              <dd className="font-mono text-xs">{String(encryptedAsset.logIndex)}</dd>
            </div>
          )}
        </dl>
        {'title' in encryptedAsset && encryptedAsset.title && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">Title</h5>
            <p className="text-sm">{encryptedAsset.title}</p>
          </div>
        )}
        {'description' in encryptedAsset && encryptedAsset.description && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
            <p className="text-sm">{encryptedAsset.description}</p>
          </div>
        )}
        {'encryption' in encryptedAsset && encryptedAsset.encryption != null && (
          <EncryptionSection encryption={encryptedAsset.encryption} />
        )}
        {'file' in encryptedAsset && encryptedAsset.file != null && (
          <FileSection file={encryptedAsset.file} />
        )}
        {'chunks' in encryptedAsset && encryptedAsset.chunks != null && (
          <ChunksSection chunks={encryptedAsset.chunks} />
        )}
        {'images' in encryptedAsset &&
          encryptedAsset.images != null &&
          encryptedAsset.images.length > 0 && (
            <ImageList
              label={`Images (${encryptedAsset.images.length} group${encryptedAsset.images.length > 1 ? 's' : ''})`}
              images={encryptedAsset.images}
            />
          )}
        {universalProfile != null && (
          <CollapsibleProfileSection label="Universal Profile" profile={universalProfile} />
        )}

        <RawJsonToggle data={encryptedAsset} label="encryptedAsset" />
      </CardContent>
    </Card>
  );
}

function EncryptionSection({
  encryption,
}: {
  encryption: NonNullable<EncryptedAsset['encryption']>;
}): React.ReactNode {
  const params = encryption.params;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Encryption Details
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Provider</dt>
            <dd className="font-mono text-xs">{encryption.provider}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Method</dt>
            <dd className="font-mono text-xs">{encryption.method}</dd>
          </div>
          {encryption.condition && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Condition</dt>
              <dd className="font-mono text-xs break-all">
                {encryption.condition.length > 100
                  ? `${encryption.condition.slice(0, 100)}…`
                  : encryption.condition}
              </dd>
            </div>
          )}
          {encryption.encryptedKey && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Encrypted Key</dt>
              <dd className="font-mono text-xs break-all">
                {encryption.encryptedKey.length > 100
                  ? `${encryption.encryptedKey.slice(0, 100)}…`
                  : encryption.encryptedKey}
              </dd>
            </div>
          )}
        </dl>
        {params != null && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-1.5">
              Encryption Params ({params.method})
            </h5>
            <div className="border rounded-md p-2.5 space-y-1 text-xs bg-muted/30">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Method</span>
                <span className="font-mono">{params.method}</span>
              </div>
              {params.tokenAddress && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Token Address</span>
                  <span className="font-mono break-all">{params.tokenAddress}</span>
                </div>
              )}
              {params.requiredBalance && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Required Balance</span>
                  <span className="font-mono">{params.requiredBalance}</span>
                </div>
              )}
              {params.requiredTokenId && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Required Token ID</span>
                  <span className="font-mono">{params.requiredTokenId}</span>
                </div>
              )}
              {params.followedAddresses && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Followed Addrs</span>
                  <span className="font-mono break-all">{params.followedAddresses}</span>
                </div>
              )}
              {params.unlockTimestamp && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Unlock Timestamp</span>
                  <span className="font-mono">{params.unlockTimestamp}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function FileSection({ file }: { file: NonNullable<EncryptedAsset['file']> }): React.ReactNode {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <FileText className="size-3.5" />
          File Details
          {file.name && (
            <span className="font-mono text-xs text-muted-foreground/70 truncate max-w-48">
              {file.name}
            </span>
          )}
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <dl className="space-y-1.5 text-sm">
          {file.name && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Name</dt>
              <dd className="text-xs break-all">{file.name}</dd>
            </div>
          )}
          {file.type && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Type</dt>
              <dd className="font-mono text-xs">{file.type}</dd>
            </div>
          )}
          {file.size != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Size</dt>
              <dd className="font-mono text-xs">{file.size.toLocaleString()} bytes</dd>
            </div>
          )}
          {file.hash && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Hash</dt>
              <dd className="font-mono text-xs break-all">{file.hash}</dd>
            </div>
          )}
          {file.lastModified != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Last Modified</dt>
              <dd className="text-xs">{formatTimestamp(file.lastModified)}</dd>
            </div>
          )}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChunksSection({
  chunks,
}: {
  chunks: NonNullable<EncryptedAsset['chunks']>;
}): React.ReactNode {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Layers className="size-3.5" />
          Chunks
          <ChevronDown className="size-3.5" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <dl className="space-y-1.5 text-sm">
          {chunks.totalSize != null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Total Size</dt>
              <dd className="font-mono text-xs">{chunks.totalSize.toLocaleString()} bytes</dd>
            </div>
          )}
          {chunks.iv && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">IV</dt>
              <dd className="font-mono text-xs break-all">{chunks.iv}</dd>
            </div>
          )}
          {chunks.ipfsChunks && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">IPFS Chunks</dt>
              <dd className="font-mono text-xs break-all">{chunks.ipfsChunks}</dd>
            </div>
          )}
          {chunks.lumeraChunks && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Lumera Chunks</dt>
              <dd className="font-mono text-xs break-all">{chunks.lumeraChunks}</dd>
            </div>
          )}
          {chunks.s3Chunks && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">S3 Chunks</dt>
              <dd className="font-mono text-xs break-all">{chunks.s3Chunks}</dd>
            </div>
          )}
          {chunks.arweaveChunks && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Arweave Chunks</dt>
              <dd className="font-mono text-xs break-all">{chunks.arweaveChunks}</dd>
            </div>
          )}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}
