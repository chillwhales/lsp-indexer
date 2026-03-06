import type {
  DigitalAsset,
  DigitalAssetInclude,
  DigitalAssetResult,
  PartialDigitalAsset,
  TokenType,
} from '@lsp-indexer/types';
import type { GetDigitalAssetQuery } from '../graphql/graphql';
import { stripExcluded } from './strip';
import { numericToString, parseAttributes, parseImage, parseImages, parseLinks } from './utils';

/** Omits `id` so sub-selections from other domains also satisfy this type. */
type RawDigitalAsset = Omit<GetDigitalAssetQuery['digital_asset'][number], 'id'>;

/** Validate raw tokenType string → `TokenType | null`. */
function mapTokenType(raw: string | null | undefined): TokenType | null {
  if (raw === 'TOKEN' || raw === 'NFT' || raw === 'COLLECTION') return raw;
  return null;
}

/** Parse a raw Hasura row into a clean `DigitalAsset`. */
export function parseDigitalAsset(raw: RawDigitalAsset): DigitalAsset;
export function parseDigitalAsset<const I extends DigitalAssetInclude>(
  raw: RawDigitalAsset,
  include: I,
): DigitalAssetResult<I>;
export function parseDigitalAsset(
  raw: RawDigitalAsset,
  include?: DigitalAssetInclude,
): DigitalAsset | PartialDigitalAsset {
  // Derive standard from presence of decimals field
  // decimals being undefined means the field was not included in the query
  // decimals being null means it was included but not set (→ LSP8)
  // decimals having a value means it was included and set (→ LSP7)
  let standard: DigitalAsset['standard'] = null;
  if (raw.decimals !== undefined) {
    standard = raw.decimals !== null ? 'LSP7' : 'LSP8';
  }

  const lsp4 = raw.lsp4Metadata;

  const result: DigitalAsset = {
    address: raw.address,
    standard,
    name: raw.lsp4TokenName?.value ?? null,
    symbol: raw.lsp4TokenSymbol?.value ?? null,
    tokenType: mapTokenType(raw.lsp4TokenType?.value),
    decimals: raw.decimals?.value ?? null,
    totalSupply:
      raw.totalSupply?.value != null ? BigInt(numericToString(raw.totalSupply.value)) : null,
    description: lsp4?.description?.value ?? null,
    category: lsp4?.category?.value ?? null,
    icons: lsp4?.icon != null ? lsp4.icon.map(parseImage) : null,
    images: parseImages(lsp4?.images),
    links: parseLinks(lsp4?.links),
    attributes: parseAttributes(lsp4?.attributes),
    owner:
      raw.owner != null
        ? {
            address: raw.owner.address,
            timestamp: String(raw.owner.timestamp),
          }
        : null,
    holderCount: raw.ownedAssets_aggregate?.aggregate?.count ?? null,
    creatorCount:
      raw.lsp4CreatorsLength?.value != null ? Number(raw.lsp4CreatorsLength.value) : null,
    referenceContract: raw.lsp8ReferenceContract?.value ?? null,
    tokenIdFormat: raw.lsp8TokenIdFormat?.value ?? null,
    baseUri: raw.lsp8TokenMetadataBaseUri?.value ?? null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address'], { standard: 'decimals' });
}

/** Batch variant of parseDigitalAsset. */
export function parseDigitalAssets(raw: RawDigitalAsset[]): DigitalAsset[];
export function parseDigitalAssets<const I extends DigitalAssetInclude>(
  raw: RawDigitalAsset[],
  include: I,
): DigitalAssetResult<I>[];
export function parseDigitalAssets(
  raw: RawDigitalAsset[],
  include?: DigitalAssetInclude,
): (DigitalAsset | PartialDigitalAsset)[] {
  if (!include) return raw.map((r) => parseDigitalAsset(r));
  return raw.map((r) => parseDigitalAsset(r, include));
}
