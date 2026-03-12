import type {
  OwnedAsset,
  OwnedAssetInclude,
  OwnedAssetResult,
  PartialOwnedAsset,
} from '@lsp-indexer/types';
import type { GetOwnedAssetQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura owned asset type from the codegen-generated query result.
 *
 * This is the shape of a single `owned_asset` element returned by both
 * `GetOwnedAssetQuery` and `GetOwnedAssetsQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawOwnedAsset = GetOwnedAssetQuery['owned_asset'][number];

/** Parse a raw Hasura row into a clean `OwnedAsset`. */
export function parseOwnedAsset(raw: RawOwnedAsset): OwnedAsset;
export function parseOwnedAsset<const I extends OwnedAssetInclude>(
  raw: RawOwnedAsset,
  include: I,
): OwnedAssetResult<I>;
export function parseOwnedAsset(
  raw: RawOwnedAsset,
  include?: OwnedAssetInclude,
): OwnedAsset | PartialOwnedAsset {
  const result: OwnedAsset = {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    balance: raw.balance != null ? BigInt(raw.balance) : null,
    blockNumber: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    transactionIndex: raw.transaction_index ?? null,
    logIndex: raw.log_index ?? null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
    holder: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
    tokenIdCount: raw.tokenIds_aggregate?.aggregate?.count ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['id', 'digitalAssetAddress', 'holderAddress'], undefined, {
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
    holder: { baseFields: ['address'] },
  });
}

/** Batch variant of parseOwnedAsset. */
export function parseOwnedAssets(raw: RawOwnedAsset[]): OwnedAsset[];
export function parseOwnedAssets<const I extends OwnedAssetInclude>(
  raw: RawOwnedAsset[],
  include: I,
): OwnedAssetResult<I>[];
export function parseOwnedAssets(
  raw: RawOwnedAsset[],
  include?: OwnedAssetInclude,
): (OwnedAsset | PartialOwnedAsset)[] {
  if (!include) return raw.map((r) => parseOwnedAsset(r));
  return raw.map((r) => parseOwnedAsset(r, include));
}
