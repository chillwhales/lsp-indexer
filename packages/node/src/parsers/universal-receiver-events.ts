import { resolveTypeIdName } from '@chillwhales/lsp1';
import type {
  PartialUniversalReceiverEvent,
  UniversalReceiverEvent,
  UniversalReceiverEventInclude,
  UniversalReceiverEventResult,
} from '@lsp-indexer/types';
import type { GetUniversalReceiverEventsQuery } from '../graphql/graphql';
import { parseDigitalAsset } from './digital-assets';
import { parseProfile } from './profiles';
import { stripExcluded } from './strip';
import { numericToString } from './utils';

/**
 * Raw Hasura universal_receiver type from the codegen-generated query result.
 *
 * Uses the array element type from `GetUniversalReceiverEventsQuery['universal_receiver']`.
 */
type RawUniversalReceiverEvent = GetUniversalReceiverEventsQuery['universal_receiver'][number];

/** Parse a raw Hasura row into a clean `UniversalReceiverEvent`. */
export function parseUniversalReceiverEvent(raw: RawUniversalReceiverEvent): UniversalReceiverEvent;
export function parseUniversalReceiverEvent<const I extends UniversalReceiverEventInclude>(
  raw: RawUniversalReceiverEvent,
  include: I,
): UniversalReceiverEventResult<I>;
export function parseUniversalReceiverEvent(
  raw: RawUniversalReceiverEvent,
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent;
export function parseUniversalReceiverEvent(
  raw: RawUniversalReceiverEvent,
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent {
  const result: UniversalReceiverEvent = {
    // Base fields (always present)
    address: raw.address,
    from: raw.from,
    typeId: raw.type_id,
    typeIdName: resolveTypeIdName(raw.type_id),

    // Includable scalars
    value: raw.value != null ? BigInt(numericToString(raw.value)) : null,
    receivedData: raw.received_data ?? null,
    returnedValue: raw.returned_value ?? null,
    blockNumber: raw.block_number ?? null,
    timestamp: raw.timestamp != null ? String(raw.timestamp) : null,
    logIndex: raw.log_index ?? null,
    transactionIndex: raw.transaction_index ?? null,

    // Relations — 3 nested relations
    // Sub-includes: when `true`, pass no include to sub-parser (= full result).
    // When it's an object, pass it as sub-include for recursive narrowing.
    // When absent/false, the relation won't be in the result (handled by stripExcluded).
    universalProfile: raw.universalProfile ? parseProfile(raw.universalProfile as any) : null,
    fromProfile: raw.fromProfile ? parseProfile(raw.fromProfile as any) : null,
    fromAsset: raw.fromAsset ? parseDigitalAsset(raw.fromAsset as any) : null,
  };

  if (!include) return result;

  return stripExcluded(result, include, ['address', 'from', 'typeId']);
}

/** Batch variant of parseUniversalReceiverEvent. */
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
): UniversalReceiverEvent[];
export function parseUniversalReceiverEvents<const I extends UniversalReceiverEventInclude>(
  raws: RawUniversalReceiverEvent[],
  include: I,
): UniversalReceiverEventResult<I>[];
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent[];
export function parseUniversalReceiverEvents(
  raws: RawUniversalReceiverEvent[],
  include?: UniversalReceiverEventInclude,
): PartialUniversalReceiverEvent[] {
  return raws.map((raw) => parseUniversalReceiverEvent(raw, include as any));
}
