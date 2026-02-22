import { ChevronDown, Coins, ExternalLink, Gem, Loader2, User } from 'lucide-react';
import React from 'react';

import { DigitalAssetCard } from '@/components/digital-asset-card';
import { RawJsonToggle } from '@/components/playground';
import { ProfileCard } from '@/components/profile-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { isSafeUrl, resolveUrl } from '@/lib/utils';

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
// NFT Card
// ---------------------------------------------------------------------------

export interface NftCardProps {
  /** Accepts full Nft or narrowed NftResult<I> — uses field-presence checks */
  nft: Record<string, unknown>;
  isFetching?: boolean;
}

export function NftCard({ nft, isFetching }: NftCardProps): React.ReactNode {
  // Base fields — always present
  const address = nft.address as string;
  const tokenId = nft.tokenId as string;
  const isBurned = nft.isBurned as boolean;
  const isMinted = nft.isMinted as boolean;

  // Conditionally included scalar fields
  const name = 'name' in nft ? (nft.name as string | null) : undefined;
  const formattedTokenId =
    'formattedTokenId' in nft ? (nft.formattedTokenId as string | null) : undefined;
  const category = 'category' in nft ? (nft.category as string | null) : undefined;
  const description = 'description' in nft ? (nft.description as string | null) : undefined;

  // Conditionally included array fields
  const icons = 'icons' in nft && Array.isArray(nft.icons) ? (nft.icons as Lsp4Image[]) : undefined;
  const images =
    'images' in nft && Array.isArray(nft.images) ? (nft.images as Lsp4Image[]) : undefined;
  const links = 'links' in nft && Array.isArray(nft.links) ? (nft.links as Lsp4Link[]) : undefined;
  const attributes =
    'attributes' in nft && Array.isArray(nft.attributes)
      ? (nft.attributes as Lsp4Attribute[])
      : undefined;

  // Conditionally included nested relations
  const holder =
    'holder' in nft && nft.holder ? (nft.holder as Record<string, unknown>) : undefined;
  const collection =
    'collection' in nft && nft.collection ? (nft.collection as Record<string, unknown>) : undefined;

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
                  alt={name ?? 'nft icon'}
                  className="size-5 rounded object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Gem className="size-5 text-muted-foreground" />
              )}
              {name !== undefined ? (name ?? 'Unnamed NFT') : 'NFT'}
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              Token ID: {formattedTokenId !== undefined ? (formattedTokenId ?? tokenId) : tokenId}
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
        {/* Core token details */}
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

        {/* Holder section (collapsible) */}
        {holder && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                Holder:{' '}
                {('name' in holder ? (holder.name as string | null) : null) ??
                  (holder.address as string)}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {/* Acquisition timestamp */}
              {'timestamp' in holder && typeof holder.timestamp === 'string' && (
                <dl className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-24 shrink-0">Acquired</dt>
                    <dd className="text-xs">{new Date(holder.timestamp).toLocaleString()}</dd>
                  </div>
                </dl>
              )}
              {/* Holder profile (flat — holder IS a Profile with timestamp) */}
              <ProfileCard profile={holder} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* LSP4 Metadata */}
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

        {/* Collection (full DigitalAsset) — last section like owned-asset pattern */}
        {collection && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Coins className="size-3.5" />
                Collection:{' '}
                {('name' in collection ? (collection.name as string | null) : null) ??
                  (collection.address as string)}
                {'symbol' in collection && typeof collection.symbol === 'string' && (
                  <span className="text-muted-foreground font-normal">({collection.symbol})</span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <DigitalAssetCard digitalAsset={collection} />
            </CollapsibleContent>
          </Collapsible>
        )}

        <RawJsonToggle data={nft} label="nft" />
      </CardContent>
    </Card>
  );
}
