import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
} from '@lsp-indexer/types';
import type { GetTokenIdDataChangedEventsQuery } from '../graphql/graphql';
import { resolveDataKeyName } from './data-key-resolver';
import { parseDigitalAsset } from './digital-assets';
import { parseNft } from './nfts';
import { stripExcluded } from './strip';

/**
 * Raw Hasura token_id_data_changed type from the codegen-generated query result.
 *
 * Uses the array element type from `GetTokenIdDataChangedEventsQuery['token_id_data_changed']`.
 */
type RawTokenIdDataChangedEvent = GetTokenIdDataChangedEventsQuery['token_id_data_changed'][number];

/**
 * Transform a raw Hasura token_id_data_changed response into a clean
 * `TokenIdDataChangedEvent` type.
 *
 * Very similar to `parseDataChangedEvent` with key differences:
 * 1. Has `tokenId` as additional base field (from `raw.token_id`)
 * 2. Has `nft` relation instead of `universalProfile`
 * 3. NFT is parsed via the full `parseNft` from the nfts domain (same as owned-tokens)
 *
 * Handles all field mappings:
 * - `data_key` → `dataKey`
 * - `data_value` → `dataValue`
 * - `token_id` → `tokenId`
 * - `block_number` → `blockNumber`
 * - `log_index` → `logIndex`
 * - `transaction_index` → `transactionIndex`
 * - `digitalAsset` → parsed via `parseDigitalAsset`
 * - `nft` → parsed via `parseNft` (full Nft type with baseUri fallback)
 * - `dataKeyName` is derived via `resolveDataKeyName` (NOT from Hasura)
 *
 * **Conditional include narrowing:**
 * When `include` is provided, `stripExcluded` removes fields not in the include map.
 * Digital asset and NFT sub-includes are recursively stripped via nestedConfig.
 *
 * @param raw - A single token_id_data_changed from the Hasura GraphQL response
 * @param include - Optional include config; when provided, excluded fields are stripped
 * @returns A clean, camelCase `TokenIdDataChangedEvent`
 */
export function parseTokenIdDataChangedEvent(
  raw: RawTokenIdDataChangedEvent,
): TokenIdDataChangedEvent;
export function parseTokenIdDataChangedEvent<const I extends TokenIdDataChangedEventInclude>(
  raw: RawTokenIdDataChangedEvent,
  include: I,
): TokenIdDataChangedEventResult<I>;
export function parseTokenIdDataChangedEvent(
  raw: RawTokenIdDataChangedEvent,
  include?: TokenIdDataChangedEventInclude,
): TokenIdDataChangedEvent | PartialTokenIdDataChangedEvent;
export function parseTokenIdDataChangedEvent(
  raw: RawTokenIdDataChangedEvent,
  include?: TokenIdDataChangedEventInclude,
): TokenIdDataChangedEvent | PartialTokenIdDataChangedEvent {
  const result: TokenIdDataChangedEvent = {
    // Base fields (always present)
    address: raw.address,
    dataKey: raw.data_key,
    dataValue: raw.data_value,
    tokenId: raw.token_id,
    dataKeyName: resolveDataKeyName(raw.data_key),

    // Includable scalars
    blockNumber: raw.block_number ?? null,
    timestamp: raw.timestamp ?? null,
    logIndex: raw.log_index ?? null,
    transactionIndex: raw.transaction_index ?? null,

    // Relations
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
    nft: raw.nft ? parseNft(raw.nft) : null,
  };

  if (!include) return result;
  return stripExcluded(
    result,
    include,
    ['address', 'dataKey', 'dataValue', 'tokenId', 'dataKeyName'],
    undefined,
    {
      digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
      nft: { baseFields: ['address', 'tokenId', 'isBurned', 'isMinted'] },
    },
  );
}

/**
 * Transform an array of raw Hasura token_id_data_changed responses into clean
 * `TokenIdDataChangedEvent[]`.
 *
 * Convenience wrapper around `parseTokenIdDataChangedEvent` for batch results.
 *
 * @param raw - Array of token_id_data_changed from the Hasura GraphQL response
 * @param include - Optional include config; forwarded to each parser call
 * @returns Array of clean, camelCase `TokenIdDataChangedEvent` objects
 */
export function parseTokenIdDataChangedEvents(
  raw: RawTokenIdDataChangedEvent[],
): TokenIdDataChangedEvent[];
export function parseTokenIdDataChangedEvents<const I extends TokenIdDataChangedEventInclude>(
  raw: RawTokenIdDataChangedEvent[],
  include: I,
): TokenIdDataChangedEventResult<I>[];
export function parseTokenIdDataChangedEvents(
  raw: RawTokenIdDataChangedEvent[],
  include?: TokenIdDataChangedEventInclude,
): (TokenIdDataChangedEvent | PartialTokenIdDataChangedEvent)[] {
  if (include) return raw.map((r) => parseTokenIdDataChangedEvent(r, include));
  return raw.map((r) => parseTokenIdDataChangedEvent(r));
}
