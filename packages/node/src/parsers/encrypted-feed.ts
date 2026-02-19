import type { EncryptedFeedEntry } from '@lsp-indexer/types';
import type { GetEncryptedAssetFeedQuery } from '../graphql/graphql';

/**
 * Raw Hasura lsp29_encrypted_asset_entry type from the codegen-generated query result.
 *
 * Extracted from the codegen type to keep the parser type-safe against schema changes.
 */
type RawEncryptedFeedEntry = GetEncryptedAssetFeedQuery['lsp29_encrypted_asset_entry'][number];

/**
 * Transform a raw Hasura `lsp29_encrypted_asset_entry` row into a clean `EncryptedFeedEntry`.
 *
 * Maps snake_case Hasura fields to camelCase:
 * - `content_id_hash` → `contentIdHash`
 * - `array_index` → `arrayIndex`
 * - `universal_profile_id` → `universalProfileId`
 *
 * @param raw - A single entry from the Hasura GraphQL response
 * @returns A clean, camelCase `EncryptedFeedEntry` with safe defaults
 */
export function parseEncryptedFeedEntry(raw: RawEncryptedFeedEntry): EncryptedFeedEntry {
  return {
    id: raw.id,
    address: raw.address,
    contentIdHash: raw.content_id_hash,
    arrayIndex: raw.array_index != null ? Number(raw.array_index) : null,
    timestamp: raw.timestamp,
    universalProfileId: raw.universal_profile_id ?? null,
  };
}

/**
 * Transform an array of raw Hasura `lsp29_encrypted_asset_entry` rows into clean
 * `EncryptedFeedEntry[]`.
 *
 * Convenience wrapper around `parseEncryptedFeedEntry` for batch results.
 *
 * @param raw - Array of entries from the Hasura GraphQL response
 * @returns Array of clean, camelCase `EncryptedFeedEntry` objects
 */
export function parseEncryptedFeedEntries(raw: RawEncryptedFeedEntry[]): EncryptedFeedEntry[] {
  return raw.map(parseEncryptedFeedEntry);
}
