import { resolveDataKeyName } from '@chillwhales/erc725';
import type {
  DataChangedEvent,
  DataChangedEventInclude,
  DataChangedEventResult,
  PartialDataChangedEvent,
} from '@lsp-indexer/types';
import type { GetDataChangedEventsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';

/**
 * Raw Hasura data_changed type from the codegen-generated query result.
 *
 * Uses the array element type from `GetDataChangedEventsQuery['data_changed']`.
 */
type RawDataChangedEvent = GetDataChangedEventsQuery['data_changed'][number];

/** Parse a raw Hasura row into a clean `DataChangedEvent`. */
export function parseDataChangedEvent(raw: RawDataChangedEvent): DataChangedEvent;
export function parseDataChangedEvent<const I extends DataChangedEventInclude>(
  raw: RawDataChangedEvent,
  include: I,
): DataChangedEventResult<I>;
export function parseDataChangedEvent(
  raw: RawDataChangedEvent,
  include?: DataChangedEventInclude,
): DataChangedEvent | PartialDataChangedEvent;
export function parseDataChangedEvent(
  raw: RawDataChangedEvent,
  include?: DataChangedEventInclude,
): DataChangedEvent | PartialDataChangedEvent {
  const result: DataChangedEvent = {
    // Base fields (always present)
    address: raw.address,
    dataKey: raw.data_key,
    dataValue: raw.data_value,
    dataKeyName: resolveDataKeyName(raw.data_key),

    // Includable scalars
    blockNumber: raw.block_number ?? null,
    timestamp: raw.timestamp ?? null,
    logIndex: raw.log_index ?? null,
    transactionIndex: raw.transaction_index ?? null,

    // Relations — delegate to existing parsers
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile) : null,
    digitalAsset: raw.digitalAsset ? parseDigitalAsset(raw.digitalAsset) : null,
  };

  if (!include) return result;
  return stripExcluded(result, include, ['address', 'dataKey', 'dataValue'], undefined, {
    universalProfile: { baseFields: ['address'] },
    digitalAsset: { baseFields: ['address'], derivedFields: { standard: 'decimals' } },
  });
}

/** Batch variant of parseDataChangedEvent. */
export function parseDataChangedEvents(raw: RawDataChangedEvent[]): DataChangedEvent[];
export function parseDataChangedEvents<const I extends DataChangedEventInclude>(
  raw: RawDataChangedEvent[],
  include: I,
): DataChangedEventResult<I>[];
export function parseDataChangedEvents(
  raw: RawDataChangedEvent[],
  include?: DataChangedEventInclude,
): (DataChangedEvent | PartialDataChangedEvent)[] {
  if (include) return raw.map((r) => parseDataChangedEvent(r, include));
  return raw.map((r) => parseDataChangedEvent(r));
}
