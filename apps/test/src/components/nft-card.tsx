import type { Nft } from '@lsp-indexer/types';
import { ExternalLink, Gem, Loader2 } from 'lucide-react';
import React from 'react';

import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// NFT Card
// ---------------------------------------------------------------------------

export interface NftCardProps {
  nft: Nft;
  isFetching?: boolean;
}

export function NftCard({ nft, isFetching }: NftCardProps): React.ReactNode {
  const firstIcon = nft.icons?.[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {firstIcon && isSafeUrl(firstIcon.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveUrl(firstIcon.url)}
                  alt={nft.name ?? 'nft icon'}
                  className="size-5 rounded object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Gem className="size-5 text-muted-foreground" />
              )}
              {nft.name ?? 'Unnamed NFT'}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              Token ID: {nft.formattedTokenId ?? nft.tokenId}
            </CardDescription>
            <CardDescription className="font-mono text-xs break-all">
              Collection: {nft.collection?.name ?? nft.address}
              {nft.collection?.symbol && (
                <span className="text-muted-foreground"> ({nft.collection.symbol})</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {nft.isMinted && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              >
                Minted
              </Badge>
            )}
            {nft.isBurned && (
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
        {/* Core token details */}
        <dl className="space-y-1.5 text-sm">
          {nft.formattedTokenId && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Formatted ID</dt>
              <dd className="font-mono text-xs break-all">{nft.formattedTokenId}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-32 shrink-0">Raw Token ID</dt>
            <dd className="font-mono text-xs break-all">{nft.tokenId}</dd>
          </div>
          {nft.category && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-32 shrink-0">Category</dt>
              <dd>{nft.category}</dd>
            </div>
          )}
        </dl>

        {/* Holder section */}
        {nft.holder && (
          <div className="border rounded-lg p-3 space-y-2 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Holder</h4>
            <div className="text-sm">
              <span className="text-muted-foreground">Address:</span>{' '}
              <span className="font-mono text-xs break-all">{nft.holder.address}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Acquired:</span>{' '}
              <span className="text-xs">{new Date(nft.holder.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* LSP4 Metadata */}
        {(nft.description ||
          (nft.icons != null && nft.icons.length > 0) ||
          (nft.images != null && nft.images.length > 0) ||
          (nft.links != null && nft.links.length > 0) ||
          (nft.attributes != null && nft.attributes.length > 0)) && (
          <div>
            <h4 className="text-sm font-semibold mb-2">NFT Metadata</h4>
            <div className="space-y-3">
              {nft.description && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                  <p className="text-sm">{nft.description}</p>
                </div>
              )}

              {nft.icons != null && nft.icons.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Icons ({nft.icons.length})
                  </h5>
                  <div className="space-y-1.5">
                    {nft.icons.map((icon, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isSafeUrl(icon.url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveUrl(icon.url)}
                            alt=""
                            className="size-8 rounded object-cover shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="size-8 rounded bg-muted shrink-0" />
                        )}
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {icon.url}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nft.images != null && nft.images.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Images ({nft.images.length})
                  </h5>
                  <div className="space-y-1.5">
                    {nft.images.map((image, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {isSafeUrl(image.url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveUrl(image.url)}
                            alt=""
                            className="size-8 rounded object-cover shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="size-8 rounded bg-muted shrink-0" />
                        )}
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {image.url}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nft.links != null && nft.links.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Links</h5>
                  <div className="space-y-1">
                    {nft.links.map((link, i) =>
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

              {nft.attributes != null && nft.attributes.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Attributes ({nft.attributes.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {nft.attributes.map((attr, i) => (
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

        <RawJsonToggle data={nft} label="nft" />
      </CardContent>
    </Card>
  );
}
