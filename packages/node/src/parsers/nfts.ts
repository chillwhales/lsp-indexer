import type { Nft } from '@lsp-indexer/types';
import type { GetNftQuery } from '../graphql/graphql';
import { parseImage } from './utils';

/**
 * Raw Hasura NFT type from the codegen-generated query result.
 *
 * This is the shape of a single `nft` element returned by both
 * `GetNftQuery` and `GetNftsQuery`. We extract it from the codegen type
 * to keep the parser type-safe against schema changes.
 */
type RawNft = GetNftQuery['nft'][number];

/**
 * Transform a raw Hasura NFT response into a clean `Nft` type.
 *
 * Handles all edge cases:
 * - **Nullable lsp4Metadata:** Some NFTs may not have resolved metadata yet
 *   (the per-token metadata relation can be null). All metadata fields use
 *   optional chaining on `raw.lsp4Metadata` and fall back to `null`.
 * - **`@include(if: false)` omitted fields:** Won't be present in the response —
 *   uses optional chaining; omitted arrays become `null`, included-but-empty arrays become `[]`.
 * - **Ownership mapping:** Maps `ownedToken.owner` (address string) and
 *   `ownedToken.timestamp` to a clean `{ address, timestamp }` owner object.
 * - **Collection info:** Parent collection name/symbol from digitalAsset relation.
 *
 * **Array field convention (T[] | null):**
 * - `null` = field not included in query OR metadata absent
 * - `[]` = fetched but legitimately empty
 *
 * @param raw - A single nft from the Hasura GraphQL response
 * @returns A clean, camelCase `Nft` with safe defaults
 */
export function parseNft(raw: RawNft): Nft {
  const metadata = raw.lsp4Metadata;

  return {
    address: raw.address,
    tokenId: raw.token_id,
    formattedTokenId: raw.formatted_token_id ?? null,
    isBurned: raw.is_burned,
    isMinted: raw.is_minted,

    // From digitalAsset relation (parent collection)
    collectionName: raw.digitalAsset?.lsp4TokenName?.value ?? null,
    collectionSymbol: raw.digitalAsset?.lsp4TokenSymbol?.value ?? null,

    // From ownedToken relation (current holder)
    owner: raw.ownedToken
      ? { address: raw.ownedToken.owner, timestamp: raw.ownedToken.timestamp ?? '' }
      : null,

    // From lsp4Metadata relation (individual token metadata — may be null)
    description: metadata?.description?.value ?? null,
    category: metadata?.category?.value ?? null,
    icons: metadata?.icon ? metadata.icon.map(parseImage) : null,
    images: metadata?.images ? metadata.images.map(parseImage) : null,
    links: metadata?.links
      ? metadata.links.map((l) => ({ title: l.title ?? '', url: l.url ?? '' }))
      : null,
    attributes: metadata?.attributes
      ? metadata.attributes.map((a) => ({
          key: a.key ?? '',
          value: a.value ?? '',
          type: a.type ?? '',
        }))
      : null,
  };
}

/**
 * Transform an array of raw Hasura NFT responses into clean `Nft[]`.
 *
 * Convenience wrapper around `parseNft` for batch results.
 *
 * @param raw - Array of nft from the Hasura GraphQL response
 * @returns Array of clean, camelCase `Nft` objects
 */
export function parseNfts(raw: RawNft[]): Nft[] {
  return raw.map(parseNft);
}
