import { Coins, ExternalLink, Loader2 } from 'lucide-react';
import React from 'react';

import { RawJsonToggle } from '@/components/playground';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTokenAmount, isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Type helpers — access fields that may be absent from narrowed result types
// ---------------------------------------------------------------------------

type Lsp4Image = {
  url: string;
  fileType?: string | null;
  width?: number | null;
  height?: number | null;
};
type Lsp4Link = { title: string; url: string };
type Lsp4Attribute = { key: string; value: string; type: string };

// ---------------------------------------------------------------------------
// Standard badge
// ---------------------------------------------------------------------------

function StandardBadge({
  standard,
  tokenType,
}: {
  standard: string | null | undefined;
  tokenType: string | null | undefined;
}): React.ReactNode {
  if (!standard && !tokenType) return null;

  let label = '';
  let className = '';

  if (standard === 'LSP7' && tokenType === 'TOKEN') {
    label = 'LSP7 TOKEN';
    className =
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  } else if (standard === 'LSP7' && tokenType === 'NFT') {
    label = 'LSP7 NDT';
    className =
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
  } else if (standard === 'LSP8' && tokenType === 'NFT') {
    label = 'LSP8 NFT';
    className =
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
  } else if (standard === 'LSP8' && tokenType === 'COLLECTION') {
    label = 'LSP8 COLLECTION';
    className =
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
  } else {
    label = [standard, tokenType].filter(Boolean).join(' ');
    className = 'bg-muted text-muted-foreground';
  }

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Digital Asset Card
// ---------------------------------------------------------------------------

export interface DigitalAssetCardProps {
  /** Accepts full DigitalAsset or narrowed DigitalAssetResult<I> — uses field-presence checks */
  digitalAsset: Record<string, unknown>;
  isFetching?: boolean;
}

export function DigitalAssetCard({
  digitalAsset,
  isFetching,
}: DigitalAssetCardProps): React.ReactNode {
  // Base field — always present
  const address = digitalAsset.address as string;

  // Conditionally included scalar fields
  const name = 'name' in digitalAsset ? (digitalAsset.name as string | null) : undefined;
  const symbol = 'symbol' in digitalAsset ? (digitalAsset.symbol as string | null) : undefined;
  const decimals =
    'decimals' in digitalAsset ? (digitalAsset.decimals as number | null) : undefined;
  const totalSupply =
    'totalSupply' in digitalAsset ? (digitalAsset.totalSupply as string | null) : undefined;
  const tokenType =
    'tokenType' in digitalAsset ? (digitalAsset.tokenType as string | null) : undefined;
  const standard =
    'standard' in digitalAsset ? (digitalAsset.standard as string | null) : undefined;
  const category =
    'category' in digitalAsset ? (digitalAsset.category as string | null) : undefined;
  const holderCount =
    'holderCount' in digitalAsset ? (digitalAsset.holderCount as number | null) : undefined;
  const creatorCount =
    'creatorCount' in digitalAsset ? (digitalAsset.creatorCount as number | null) : undefined;
  const description =
    'description' in digitalAsset ? (digitalAsset.description as string | null) : undefined;
  const referenceContract =
    'referenceContract' in digitalAsset
      ? (digitalAsset.referenceContract as string | null)
      : undefined;
  const tokenIdFormat =
    'tokenIdFormat' in digitalAsset ? (digitalAsset.tokenIdFormat as number | null) : undefined;
  const baseUri = 'baseUri' in digitalAsset ? (digitalAsset.baseUri as string | null) : undefined;

  // Conditionally included array fields
  const icons =
    'icons' in digitalAsset && Array.isArray(digitalAsset.icons)
      ? (digitalAsset.icons as Lsp4Image[])
      : undefined;
  const images =
    'images' in digitalAsset && Array.isArray(digitalAsset.images)
      ? (digitalAsset.images as Lsp4Image[])
      : undefined;
  const links =
    'links' in digitalAsset && Array.isArray(digitalAsset.links)
      ? (digitalAsset.links as Lsp4Link[])
      : undefined;
  const attributes =
    'attributes' in digitalAsset && Array.isArray(digitalAsset.attributes)
      ? (digitalAsset.attributes as Lsp4Attribute[])
      : undefined;

  // Conditionally included relation
  const owner =
    'owner' in digitalAsset && digitalAsset.owner
      ? (digitalAsset.owner as { address: string })
      : undefined;

  const firstIcon = icons?.[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {firstIcon && isSafeUrl(firstIcon.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveUrl(firstIcon.url)}
                  alt={name ?? 'icon'}
                  className="size-5 rounded object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Coins className="size-5 text-muted-foreground" />
              )}
              {name !== undefined ? (name ?? 'Unnamed Asset') : 'Digital Asset'}
              {symbol && (
                <span className="text-base font-normal text-muted-foreground">({symbol})</span>
              )}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">{address}</CardDescription>
            {('standard' in digitalAsset || 'tokenType' in digitalAsset) && (
              <StandardBadge standard={standard} tokenType={tokenType} />
            )}
          </div>
          <div className="flex gap-3 text-sm">
            {holderCount !== undefined && holderCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{holderCount}</div>
                <div className="text-muted-foreground text-xs">Holders</div>
              </div>
            )}
            {creatorCount !== undefined && creatorCount !== null && (
              <div className="text-center">
                <div className="font-semibold">{creatorCount}</div>
                <div className="text-muted-foreground text-xs">Creators</div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core token details */}
        <dl className="space-y-1.5 text-sm">
          {decimals !== undefined && decimals !== null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Decimals</dt>
              <dd className="font-mono">{decimals}</dd>
            </div>
          )}
          {totalSupply !== undefined && totalSupply !== null && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Total Supply</dt>
              <dd>
                <Tooltip>
                  <TooltipTrigger className="font-mono underline decoration-dashed underline-offset-2 cursor-default">
                    {formatTokenAmount(totalSupply, decimals ?? 0)}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono">{totalSupply}</p>
                  </TooltipContent>
                </Tooltip>
              </dd>
            </div>
          )}
          {category && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Category</dt>
              <dd>{category}</dd>
            </div>
          )}
          {owner && (
            <div className="flex gap-2">
              <dt className="text-muted-foreground w-28 shrink-0">Owner</dt>
              <dd className="font-mono text-xs break-all">{owner.address}</dd>
            </div>
          )}
        </dl>

        {/* LSP4 Metadata */}
        {(description ||
          (icons && icons.length > 0) ||
          (images && images.length > 0) ||
          (links && links.length > 0) ||
          (attributes && attributes.length > 0)) && (
          <div>
            <h4 className="text-sm font-semibold mb-2">LSP4 Metadata</h4>
            <div className="space-y-3">
              {description && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                  <p className="text-sm">{description}</p>
                </div>
              )}

              {icons && icons.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Icons ({icons.length})
                  </h5>
                  <div className="space-y-1.5">
                    {icons.map((icon, i) => (
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

              {images && images.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-1">
                    Images ({images.length})
                  </h5>
                  <div className="space-y-1.5">
                    {images.map((image, i) => (
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

        {/* LSP8 Section — shown when any LSP8 field was fetched and has a value */}
        {('referenceContract' in digitalAsset ||
          'tokenIdFormat' in digitalAsset ||
          'baseUri' in digitalAsset) &&
          (referenceContract !== null || tokenIdFormat !== null || baseUri !== null) && (
            <div className="border rounded-lg p-3 space-y-2 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
              <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                LSP8 Token Details
              </h4>
              {'referenceContract' in digitalAsset && referenceContract !== null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Reference Contract:</span>{' '}
                  <span className="font-mono text-xs break-all">
                    {referenceContract ?? 'not set'}
                  </span>
                </div>
              )}
              {'tokenIdFormat' in digitalAsset && tokenIdFormat !== null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Token ID Format:</span>{' '}
                  <span className="font-mono">{tokenIdFormat ?? 'not set'}</span>
                </div>
              )}
              {'baseUri' in digitalAsset && baseUri !== null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Base URI:</span>{' '}
                  {baseUri ? (
                    isSafeUrl(baseUri) ? (
                      <a
                        href={resolveUrl(baseUri)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {baseUri}
                      </a>
                    ) : (
                      <span className="font-mono text-xs">{baseUri}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">not set</span>
                  )}
                </div>
              )}
            </div>
          )}

        <RawJsonToggle data={digitalAsset} label="digitalAsset" />
      </CardContent>
    </Card>
  );
}
