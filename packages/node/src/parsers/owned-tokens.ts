import type {
  OwnedToken,
  OwnedTokenInclude,
  OwnedTokenResult,
  PartialOwnedToken,
} from '@lsp-indexer/types';
import type { GetOwnedTokenQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseNft } from './nfts';
import { parseOwnedAsset } from './owned-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura owned token type from the codegen-generated query result.
 *
 * This is the shape of a single `owned_token` element returned by both
 * `GetOwnedTokenQuery` and `GetOwnedTokensQuery`. We extract it from the
 * codegen type to keep the parser type-safe against schema changes.
 */
type RawOwnedToken = GetOwnedTokenQuery['owned_token'][number];

/** Parse a raw Hasura row into a clean `OwnedToken`. */
export function parseOwnedToken(raw: RawOwnedToken): OwnedToken;
export function parseOwnedToken<const I extends OwnedTokenInclude>(
  raw: RawOwnedToken,
  include: I,
): OwnedTokenResult<I>;
export function parseOwnedToken(
  raw: RawOwnedToken,
  include?: OwnedTokenInclude,
): OwnedToken | PartialOwnedToken {
  const result: OwnedToken = {
    id: raw.id,
    digitalAssetAddress: raw.address,
    holderAddress: raw.owner,
    tokenId: raw.token_id,
    block: raw.block ?? null,
    timestamp: raw.timestamp ?? null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
    nft: raw.nft ? parseNft(raw.nft) : null,
    ownedAsset: raw.ownedAsset ? parseOwnedAsset(raw.ownedAsset) : null,
    holder: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
  };

  if (!include) return result;
  return stripExcluded(
    result,
    include,
    ['id', 'digitalAssetAddress', 'holderAddress', 'tokenId'],
    undefined,
    {
      digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
      nft: { baseFields: ['address', 'tokenId', 'isBurned', 'isMinted'] },
      ownedAsset: { baseFields: ['id', 'digitalAssetAddress', 'holderAddress'] },
      holder: { baseFields: ['address'] },
    },
  );
}

/** Batch variant of parseOwnedToken. */
export function parseOwnedTokens(raw: RawOwnedToken[]): OwnedToken[];
export function parseOwnedTokens<const I extends OwnedTokenInclude>(
  raw: RawOwnedToken[],
  include: I,
): OwnedTokenResult<I>[];
export function parseOwnedTokens(
  raw: RawOwnedToken[],
  include?: OwnedTokenInclude,
): (OwnedToken | PartialOwnedToken)[] {
  if (!include) return raw.map((r) => parseOwnedToken(r));
  return raw.map((r) => parseOwnedToken(r, include));
}
