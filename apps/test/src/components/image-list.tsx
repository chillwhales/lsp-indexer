'use client';

import React from 'react';

import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ImageList — reusable component for rendering flat arrays of images
// ---------------------------------------------------------------------------

export interface ImageListProps {
  /** Section label, e.g. "Images (3)" */
  label: string;
  /** Array of image objects — must have at least a `url` field (string | null) */
  images: ReadonlyArray<{ url?: string | null; [key: string]: unknown }>;
}

/**
 * Renders a list of images with thumbnails and URLs.
 *
 * Works for both LSP4 image arrays (profiles, digital assets, NFTs) and
 * LSP29 image arrays (encrypted assets). Accepts a generic shape requiring
 * only an optional `url` field — additional metadata is ignored.
 *
 * Extracted from duplicated patterns in ProfileCard, DigitalAssetCard, and
 * NftCard to eliminate code duplication.
 */
export function ImageList({ label, images }: ImageListProps): React.ReactNode {
  if (images.length === 0) return null;

  return (
    <div>
      <h5 className="text-xs font-medium text-muted-foreground mb-1">{label}</h5>
      <div className="space-y-1.5">
        {images.map((image, i) => (
          <div key={i} className="flex items-center gap-2">
            {image.url && isSafeUrl(image.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveUrl(image.url)}
                alt=""
                className="size-8 rounded object-cover shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="size-8 rounded bg-muted shrink-0" />
            )}
            <span className="font-mono text-xs text-muted-foreground truncate">
              {image.url ?? '(no url)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
