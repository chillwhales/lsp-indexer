import type { Creator } from '@lsp-indexer/types';
import type { GetCreatorAddressesQuery } from '../graphql/graphql';

/**
 * Raw Hasura lsp4_creator type from the codegen-generated query result.
 *
 * Extracted from the codegen type to keep the parser type-safe against schema changes.
 */
type RawCreator = GetCreatorAddressesQuery['lsp4_creator'][number];

/**
 * Transform a raw Hasura lsp4_creator row into a clean `Creator` type.
 *
 * Field mapping:
 * - `address` → `assetAddress` (digital asset contract address)
 * - `creator_address` → `creatorAddress` (UP address of the creator)
 *
 * @param raw - A single lsp4_creator from the Hasura GraphQL response
 * @returns A clean, camelCase `Creator` with semantic field names
 */
export function parseCreator(raw: RawCreator): Creator {
  return {
    assetAddress: raw.address,
    creatorAddress: raw.creator_address,
  };
}

/**
 * Transform an array of raw Hasura lsp4_creator rows into clean `Creator[]`.
 *
 * Convenience wrapper around `parseCreator` for batch results.
 *
 * @param raw - Array of lsp4_creator from the Hasura GraphQL response
 * @returns Array of clean, camelCase `Creator` objects
 */
export function parseCreators(raw: RawCreator[]): Creator[] {
  return raw.map(parseCreator);
}
