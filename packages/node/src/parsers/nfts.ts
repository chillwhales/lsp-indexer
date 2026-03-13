import type { Nft, NftInclude, NftResult, PartialNft } from '@lsp-indexer/types';
import type { GetNftQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { parseAttributes, parseImage, parseImages, parseLinks } from './utils';

/** Omits `id` so sub-selections from other domains also satisfy this type. */
type RawNft = Omit<GetNftQuery['nft'][number], 'id'>;

/** Parse a raw Hasura row into a clean `Nft`. */
export function parseNft(raw: RawNft): Nft;
export function parseNft<const I extends NftInclude>(raw: RawNft, include: I): NftResult<I>;
export function parseNft(raw: RawNft, include?: NftInclude): Nft | PartialNft {
  const direct = raw.lsp4Metadata;
  const baseUri = raw.lsp4MetadataBaseUri;

  const result: Nft = {
    address: raw.address,
    tokenId: raw.token_id,
    formattedTokenId: raw.formatted_token_id ?? null,
    isBurned: raw.is_burned,
    isMinted: raw.is_minted,

    // NFT's own name: direct metadata first, baseUri fallback
    name: direct?.name?.value ?? baseUri?.name?.value ?? null,

    // Full collection from digitalAsset — reuse parseDigitalAsset.
    // Always parse as full DigitalAsset; outer stripExcluded controls field presence.
    collection: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,

    // Holder — profile fields spread flat (no nested universalProfile wrapper).
    // When the holder has a UP, profile fields are populated from parseProfile.
    // When no UP exists, profile fields get safe defaults (null / 0 / []).
    // Always parse as full Profile; outer stripExcluded controls field presence.
    holder: raw.ownedToken
      ? {
          ...(raw.ownedToken.universalProfile
            ? parseProfile(raw.ownedToken.universalProfile)
            : {
                address: raw.ownedToken.owner,
                name: null,
                description: null,
                tags: null,
                links: null,
                avatar: null,
                profileImage: null,
                backgroundImage: null,
                followerCount: 0,
                followingCount: 0,
                timestamp: null,
                blockNumber: null,
                transactionIndex: null,
                logIndex: null,
              }),
          // Override profile's timestamp with holder acquisition timestamp
          timestamp: raw.ownedToken.timestamp ?? '',
        }
      : null,

    // All metadata fields: direct first, baseUri fallback
    description: direct?.description?.value ?? baseUri?.description?.value ?? null,
    category: direct?.category?.value ?? baseUri?.category?.value ?? null,
    icons: direct?.icon
      ? direct.icon.map(parseImage)
      : baseUri?.icon
        ? baseUri.icon.map(parseImage)
        : null,
    images: parseImages(direct?.images) ?? parseImages(baseUri?.images),
    links: parseLinks(direct?.links) ?? parseLinks(baseUri?.links) ?? null,
    attributes: parseAttributes(direct?.attributes) ?? parseAttributes(baseUri?.attributes) ?? null,
    timestamp: raw.timestamp ?? null,
    blockNumber: raw.block_number ?? null,
    transactionIndex: raw.transaction_index ?? null,
    logIndex: raw.log_index ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address', 'tokenId', 'isBurned', 'isMinted'], undefined, {
    collection: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
    holder: { baseFields: ['address', 'timestamp'] },
  });
}

/** Batch variant of parseNft. */
export function parseNfts(raw: RawNft[]): Nft[];
export function parseNfts<const I extends NftInclude>(raw: RawNft[], include: I): NftResult<I>[];
export function parseNfts(raw: RawNft[], include?: NftInclude): (Nft | PartialNft)[] {
  if (!include) return raw.map((r) => parseNft(r));
  return raw.map((r) => parseNft(r, include));
}
