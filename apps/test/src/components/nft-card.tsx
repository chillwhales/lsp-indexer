/** NFT (LSP8 token) card. Shows metadata, holder profile, and parent collection. */
import { ExternalLink, Gem, Loader2 } from 'lucide-react';
import React from 'react';

import type { Nft, PartialExcept } from '@lsp-indexer/types';

import {
  CollapsibleDigitalAssetSection,
  CollapsibleProfileSection,
} from '@/components/collapsible-sections';
import { ImageList } from '@/components/image-list';
import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

export interface NftCardProps {
  nft: PartialExcept<Nft, 'address' | 'tokenId' | 'isBurned' | 'isMinted'>;
  isFetching?: boolean;
}

export function NftCard({ nft, isFetching }: NftCardProps): React.ReactNode {
  const {
    address,
    tokenId,
    isBurned,
    isMinted,
    name,
    formattedTokenId,
    category,
    description,
    icons,
    images,
    links,
    attributes,
    holder,
    collection,
  } = nft;

  const firstIcon = icons?.[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {firstIcon && isSafeUrl(firstIcon.url) ? (
                <img
                  src={resolveUrl(firstIcon.url)}
                  alt={name ?? 'nft icon'}
                  className="size-5 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Gem className="size-5 text-muted-foreground" />
              )}
              {name !== undefined ? (name ?? 'Unnamed NFT') : 'NFT'}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              Token ID: {formattedTokenId ?? tokenId}
            </CardDescription>
            <CardDescription className="font-mono text-xs break-all">{address}</CardDescription>
          </div>
          <div className="flex gap-2">
            {isMinted && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              >
                Minted
              </Badge>
            )}
            {isBurned && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              >
                Burned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-1.5 text-sm">
          {formattedTokenId && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Formatted ID</dt>
              <dd className="font-mono text-xs break-all">{formattedTokenId}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Raw Token ID</dt>
            <dd className="font-mono text-xs break-all">{tokenId}</dd>
          </div>
          {category && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Category</dt>
              <dd>{category}</dd>
            </div>
          )}
        </dl>
        {holder != null && (
          <CollapsibleProfileSection
            label="Holder"
            profile={holder}
            before={
              holder.timestamp ? (
                <dl className="space-y-1.5 text-sm mb-3">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-24 shrink-0">Acquired</dt>
                    <dd className="text-xs">{new Date(holder.timestamp).toLocaleString()}</dd>
                  </div>
                </dl>
              ) : undefined
            }
          />
        )}
        {(description ||
          (icons && icons.length > 0) ||
          (images && images.length > 0) ||
          (links && links.length > 0) ||
          (attributes && attributes.length > 0)) && (
          <div>
            <h4 className="text-sm font-semibold mb-2">NFT Metadata</h4>
            <div className="space-y-3">
              {description && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                  <p className="text-sm">{description}</p>
                </div>
              )}

              {icons && icons.length > 0 && (
                <ImageList label={`Icons (${icons.length})`} images={icons} />
              )}

              {images && images.length > 0 && (
                <ImageList
                  label={`Images (${images.length} group${images.length > 1 ? 's' : ''})`}
                  images={images}
                />
              )}

              {links && links.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Links</h5>
                  <div className="space-y-1">
                    {links.map((link, i) =>
                      isSafeUrl(link.url) ? (
                        <a
                          key={`${link.url}-${i}`}
                          href={resolveUrl(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          {link.title || link.url}
                        </a>
                      ) : (
                        <span
                          key={`${link.url}-${i}`}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                          {link.title || link.url}
                          <Badge variant="outline" className="text-xs">
                            unsafe URL
                          </Badge>
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {attributes && attributes.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Attributes ({attributes.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {attributes.map((attr, i) => (
                      <Badge key={`${attr.key}-${i}`} variant="secondary" className="text-xs">
                        {attr.key}: {attr.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {collection != null && (
          <CollapsibleDigitalAssetSection label="Collection" digitalAsset={collection} />
        )}

        <RawJsonToggle data={nft} label="nft" />
      </CardContent>
    </Card>
  );
}
