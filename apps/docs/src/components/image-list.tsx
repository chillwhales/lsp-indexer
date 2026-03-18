'use client';

import React from 'react';

import { isSafeUrl, resolveUrl } from '@/lib/utils';

/** Image list supporting flat arrays and matrix (grouped by index) layouts. */

type ImageItem = { url?: string | null; [key: string]: unknown };

type FlatImages = ReadonlyArray<ImageItem>;
type MatrixImages = ReadonlyArray<ReadonlyArray<ImageItem>>;

function isMatrix(images: FlatImages | MatrixImages): images is MatrixImages {
  return images.length > 0 && Array.isArray(images[0]);
}

export interface ImageListProps {
  label: string;
  images: FlatImages | MatrixImages;
}
export function ImageList({ label, images }: ImageListProps): React.ReactNode {
  if (images.length === 0) return null;

  if (isMatrix(images)) {
    return (
      <div>
        <h5 className="text-xs font-medium text-muted-foreground mb-1">{label}</h5>
        <div className="space-y-2">
          {images.map((resolutions, idx) =>
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
  return (
    <div>
      <h5 className="text-xs font-medium text-muted-foreground mb-1">{label}</h5>
      <div className="space-y-1.5">
        {images.map((image, i) => (
          <ImageRow key={i} image={image} />
        ))}
      </div>
    </div>
  );
}

function ImageRow({ image }: { image: ImageItem }): React.ReactNode {
  return (
    <div className="flex items-center gap-2">
      {image.url && isSafeUrl(image.url) ? (
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
