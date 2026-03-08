import { resolveDataKeyName } from '@chillwhales/erc725';
import type {
  PartialTokenIdDataChangedEvent,
  TokenIdDataChangedEvent,
  TokenIdDataChangedEventInclude,
  TokenIdDataChangedEventResult,
} from '@lsp-indexer/types';
import type { GetTokenIdDataChangedEventsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseNft } from './nfts';
import { stripExcluded } from './strip';

/**
 * Raw Hasura token_id_data_changed type from the codegen-generated query result.
 *
 * Uses the array element type from `GetTokenIdDataChangedEventsQuery['token_id_data_changed']`.
 */
type RawTokenIdDataChangedEvent = GetTokenIdDataChangedEventsQuery['token_id_data_changed'][number];

/** Parse a raw Hasura row into a clean domain type. */
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
  return stripExcluded(result, include, ['address', 'dataKey', 'dataValue', 'tokenId'], undefined, {
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
    nft: { baseFields: ['address', 'tokenId', 'isBurned', 'isMinted'] },
  });
}

/** Batch variant of parseTokenIdDataChangedEvent. */
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
