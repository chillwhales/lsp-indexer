'use client';

import React from 'react';

import { isSafeUrl, resolveUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// ImageList — reusable component for rendering flat or matrix image arrays
// ---------------------------------------------------------------------------

/** A single image object — must have at least a `url` field */
type ImageItem = { url?: string | null; [key: string]: unknown };

export interface ImageListProps {
  /** Section label, e.g. "Images (3)" or "Icons (2)" */
  label: string;
  /**
   * Images to render. Accepts either:
   * - **Flat array** (`Image[]`) — icons, profileImage, backgroundImage
   * - **Matrix** (`Image[][]`) — images grouped by `image_index` (digital assets, NFTs, encrypted assets)
   *
   * When a matrix is provided, each inner array is rendered as an indented group
   * labelled by its index, making the resolution grouping explicit.
   */
  images: ReadonlyArray<ImageItem> | ReadonlyArray<ReadonlyArray<ImageItem>>;
}

/**
 * Renders a list of images with thumbnails and URLs.
 *
 * Supports two layouts:
 * 1. **Flat** — simple list of images (icons, profile images, background images)
 * 2. **Matrix** — grouped by image_index with indented resolution sub-lists
 *    (digital asset images, NFT images, encrypted asset images)
 *
 * Detects matrix format by checking if the first element is an array.
 */
export function ImageList({ label, images }: ImageListProps): React.ReactNode {
  if (images.length === 0) return null;

  const isMatrix = Array.isArray(images[0]);

  if (isMatrix) {
    const matrix = images as ReadonlyArray<ReadonlyArray<ImageItem>>;
    return (
      <div>
        <h5 className="text-xs font-medium text-muted-foreground mb-1">{label}</h5>
        <div className="space-y-2">
          {matrix.map((resolutions, idx) =>
            resolutions.length > 0 ? (
              <div key={idx}>
                <h6 className="text-xs text-muted-foreground/70 mb-1 font-mono">
                  [{idx}] {resolutions.length} resolution{resolutions.length > 1 ? 's' : ''}
                </h6>
                <div className="ml-4 space-y-1.5">
                  {resolutions.map((image, i) => (
                    <ImageRow key={i} image={image} />
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      </div>
    );
  }

  // Flat array
  const flat = images as ReadonlyArray<ImageItem>;
  return (
    <div>
      <h5 className="text-xs font-medium text-muted-foreground mb-1">{label}</h5>
      <div className="space-y-1.5">
        {flat.map((image, i) => (
          <ImageRow key={i} image={image} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageRow — single image thumbnail + URL
// ---------------------------------------------------------------------------

function ImageRow({ image }: { image: ImageItem }): React.ReactNode {
  return (
    <div className="flex items-center gap-2">
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
  );
}
