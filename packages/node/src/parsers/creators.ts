import type { Creator, CreatorInclude, CreatorResult, PartialCreator } from '@lsp-indexer/types';
import type { GetCreatorsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/** Omits `id` so sub-selections from other domains also satisfy this type. */
type RawCreator = Omit<GetCreatorsQuery['lsp4_creator'][number], '__typename'>;

/** Parse a raw Hasura row into a clean `Creator`. */
export function parseCreator(raw: RawCreator): Creator;
export function parseCreator<const I extends CreatorInclude>(
  raw: RawCreator,
  include: I,
): CreatorResult<I>;
export function parseCreator(raw: RawCreator, include?: CreatorInclude): Creator | PartialCreator;
export function parseCreator(raw: RawCreator, include?: CreatorInclude): Creator | PartialCreator {
  const result: Creator = {
    creatorAddress: raw.creator_address,
    digitalAssetAddress: raw.address,
    arrayIndex: raw.array_index != null ? Number(raw.array_index) : null,
    interfaceId: raw.interface_id ?? null,
    timestamp: raw.timestamp != null ? String(raw.timestamp) : null,
    creatorProfile: raw.creatorProfile
      ? parseProfile(raw.creatorProfile as Parameters<typeof parseProfile>[0])
      : null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['creatorAddress', 'digitalAssetAddress'], undefined, {
    creatorProfile: { baseFields: ['address'] },
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
  });
}

/** Batch variant of parseCreator. */
export function parseCreators(raw: RawCreator[]): Creator[];
export function parseCreators<const I extends CreatorInclude>(
  raw: RawCreator[],
  include: I,
): CreatorResult<I>[];
export function parseCreators(
  raw: RawCreator[],
  include?: CreatorInclude,
): (Creator | PartialCreator)[] {
  if (include) return raw.map((r) => parseCreator(r, include));
  return raw.map((r) => parseCreator(r));
}
