import type { EncryptedAsset, EncryptedAssetImage } from '@lsp-indexer/types';
import type { GetEncryptedAssetQuery } from '../graphql/graphql';

/**
 * Raw Hasura encrypted asset type from the codegen-generated query result.
 *
 * This is the shape of a single `lsp29_encrypted_asset` element returned by
 * both `GetEncryptedAssetQuery` and `GetEncryptedAssetsQuery`. We extract it
 * from the codegen type to keep the parser type-safe against schema changes.
 */
type RawEncryptedAsset = GetEncryptedAssetQuery['lsp29_encrypted_asset'][number];

/**
 * Raw image type from the Hasura encrypted asset images array.
 */
type RawImage = RawEncryptedAsset['images'][number];

/**
 * Parse a raw image from Hasura into a clean EncryptedAssetImage.
 */
function parseImage(raw: RawImage): EncryptedAssetImage {
  return {
    url: raw.url ?? '',
    width: raw.width ?? null,
    height: raw.height ?? null,
  };
}

/**
 * Transform a raw Hasura LSP29 Encrypted Asset response into a clean `EncryptedAsset` type.
 *
 * Handles all edge cases:
 * - `title`, `description`, `file`, `encryption` may be `null` (not set)
 * - File size is returned as a numeric string from Hasura — parsed to number
 * - Images array may be empty
 * - Aggregate counts may have `null` aggregate — defaults to `0`
 *
 * @param raw - A single lsp29_encrypted_asset from the Hasura GraphQL response
 * @returns A clean, camelCase `EncryptedAsset` with safe defaults
 */
export function parseEncryptedAsset(raw: RawEncryptedAsset): EncryptedAsset {
  return {
    id: raw.id,
    address: raw.address,
    title: raw.title?.value ?? null,
    description: raw.description?.value ?? null,
    url: raw.url ?? null,
    contentId: raw.content_id ?? null,
    isDataFetched: raw.is_data_fetched,
    version: raw.version ?? null,
    encryptionMethod: raw.encryption?.method ?? null,
    fileName: raw.file?.name ?? null,
    fileType: raw.file?.type ?? null,
    fileSize: raw.file?.size != null ? Number(raw.file.size) : null,
    imageCount: raw.images_aggregate?.aggregate?.count ?? 0,
    images: raw.images?.map(parseImage) ?? [],
    ownerAddress: raw.universal_profile_id ?? null,
    timestamp: raw.timestamp,
  };
}

/**
 * Transform an array of raw Hasura LSP29 Encrypted Asset responses into clean `EncryptedAsset[]`.
 *
 * Convenience wrapper around `parseEncryptedAsset` for batch results.
 *
 * @param raw - Array of lsp29_encrypted_asset from the Hasura GraphQL response
 * @returns Array of clean, camelCase `EncryptedAsset` objects
 */
export function parseEncryptedAssets(raw: RawEncryptedAsset[]): EncryptedAsset[] {
  return raw.map(parseEncryptedAsset);
}
