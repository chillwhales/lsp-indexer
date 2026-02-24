import type { Asset, Image, Link, Lsp4Attribute } from '@lsp-indexer/types';

/**
 * Structural interface for raw LSP4 metadata image data.
 * Works with both lsp4_metadata_icon and lsp4_metadata_image types
 * without depending on codegen __typename.
 */
interface RawImage {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  verification_method?: string | null;
  verification_data?: string | null;
}

/**
 * Parse a raw metadata image into a clean Image.
 * Shared across profiles, digital-assets, nfts, and future domains.
 */
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

/**
 * Structural interface for raw asset data (LSP3 avatar / LSP4 assets).
 * Assets have fileType but no width/height — they're media files, not images.
 */
interface RawAsset {
  url?: string | null;
  file_type?: string | null;
  verification_method?: string | null;
  verification_data?: string | null;
}

/**
 * Parse a raw asset file into a clean Asset.
 * Shared across LSP3 avatars and LSP4 assets.
 */
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

/**
 * Parse an array of link objects from LSP4 metadata.
 * Returns `null` if the input is nullish (field not included or metadata absent).
 * Shared across digital-assets, nfts, and future domains.
 */
export function parseLinks(
  links: ReadonlyArray<{ title?: string | null; url?: string | null }> | null | undefined,
): Link[] | null {
  if (!links) return null;
  return links.map((l) => ({ title: l.title ?? '', url: l.url ?? '' }));
}

/**
 * Parse an array of attribute objects from LSP4 metadata.
 * Returns `null` if the input is nullish (field not included or metadata absent).
 * Shared across digital-assets, nfts, and future domains.
 */
export function parseAttributes(
  attrs:
    | ReadonlyArray<{ key?: string | null; value?: string | null; type?: string | null }>
    | null
    | undefined,
): Lsp4Attribute[] | null {
  if (!attrs) return null;
  return attrs.map((a) => ({ key: a.key ?? '', value: a.value ?? '', type: a.type ?? '' }));
}

/**
 * Parse raw Hasura metadata images into a matrix grouped by `image_index`.
 *
 * Each `image_index` groups multiple resolutions of the same logical image.
 * Returns `Image[][]` where `result[0]` = all resolutions for image 0, etc.
 *
 * Reuses the shared `parseImage` for individual image parsing.
 * Shared across digital-assets, nfts, encrypted-assets, and owned-tokens.
 */
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
 * Convert a Hasura `numeric` value to a plain decimal string, safe to pass
 * to `BigInt()`, avoiding scientific notation.
 *
 * In this codebase the generated GraphQL type for Hasura's `numeric` PostgreSQL
 * type (`Scalars['numeric']`) is typed as `string`. However this helper
 * defensively also accepts `number` inputs for cases where a numeric value has
 * already been coerced to a JS number (e.g. by a JSON parser or runtime layer).
 *
 * When a `numeric` value is represented as a JS number, very large uint256
 * values (e.g. total supply) become floats in scientific notation (`4.2e+76`),
 * which lose precision. We use `BigInt` to recover an integer representation
 * and return a non-scientific-notation decimal string.
 *
 * Handles:
 * - Normal integer strings: `"1000"` → `"1000"` (fast path, no conversion)
 * - Scientific notation strings: `"4.2e+76"` → rounded BigInt decimal string
 * - Defensive runtime `number`: `4.2e76` → rounded BigInt decimal string
 *
 * Note: for values already coerced to a JS `number`, precision may have been
 * lost before this function runs, but we at least return a decimal string safe
 * for `BigInt()`.
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
