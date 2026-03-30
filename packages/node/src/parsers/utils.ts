import type { Asset, Image, Link, Lsp4Attribute } from '@lsp-indexer/types';

/** Raw LSP4 metadata image data. */
interface RawImage {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  verification_method?: string | null;
  verification_data?: string | null;
}

/** Parse a raw metadata image into a clean Image. */
export function parseImage(raw: RawImage): Image {
  return {
    url: raw.url ?? '',
    width: raw.width ?? null,
    height: raw.height ?? null,
    verification:
      raw.verification_method != null
        ? { method: raw.verification_method, data: raw.verification_data ?? '' }
        : null,
  };
}

/** Raw asset data . */
interface RawAsset {
  url?: string | null;
  file_type?: string | null;
  verification_method?: string | null;
  verification_data?: string | null;
}

/** Parse a raw asset file into a clean Asset. */
export function parseAsset(raw: RawAsset): Asset {
  return {
    url: raw.url ?? '',
    fileType: raw.file_type ?? '',
    verification:
      raw.verification_method != null
        ? { method: raw.verification_method, data: raw.verification_data ?? '' }
        : null,
  };
}

/** Parse links array — returns `null` if input is nullish. */
export function parseLinks(
  links: ReadonlyArray<{ title?: string | null; url?: string | null }> | null | undefined,
): Link[] | null {
  if (!links) return null;
  return links.map((l) => ({ title: l.title ?? '', url: l.url ?? '' }));
}

/** Parse attributes array — returns `null` if input is nullish. */
export function parseAttributes(
  attrs:
    | ReadonlyArray<{
        key?: string | null;
        value?: string | null;
        type?: string | null;
        score?: string | number | null;
        rarity?: string | number | null;
      }>
    | null
    | undefined,
): Lsp4Attribute[] | null {
  if (!attrs) return null;
  return attrs.map((a) => ({
    key: a.key ?? '',
    value: a.value ?? '',
    type: a.type ?? '',
    score: a.score != null ? (Number.isNaN(Number(a.score)) ? null : Number(a.score)) : null,
    rarity: a.rarity != null ? (Number.isNaN(Number(a.rarity)) ? null : Number(a.rarity)) : null,
  }));
}

/** Parse images into a matrix grouped by `image_index`. */
export function parseImages(
  raw: ReadonlyArray<RawImage & { image_index?: number | null }> | null | undefined,
): Image[][] | null {
  if (!raw) return null;
  const matrix: Image[][] = [];
  for (const item of raw) {
    const idx = item.image_index ?? 0;
    if (!matrix[idx]) matrix[idx] = [];
    matrix[idx].push(parseImage(item));
  }
  return matrix;
}

/**
 * Convert a Hasura `numeric` value to a plain decimal string safe for `BigInt()`.
 * Handles scientific notation from large uint256 values.
 */
export function numericToString(value: string | number): string {
  const s = String(value);
  // Fast path: plain integer with no scientific notation
  if (/^-?\d+$/.test(s)) return s;
  // Slow path: scientific notation or decimal — round to integer via BigInt
  try {
    return BigInt(Math.round(Number(s))).toString();
  } catch {
    return s; // last-resort fallback
  }
}
