import { ExtractParams } from '@/types';
import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile, UniversalReceiver } from '@chillwhales/sqd-typeorm';

export function extract({ block, log }: ExtractParams): UniversalReceiver {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { from, value, typeId, receivedData, returnedValue } =
    LSP0ERC725Account.events.UniversalReceiver.decode(log);

  return new UniversalReceiver({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    from,
    value,
    typeId,
    receivedData,
    returnedValue,
  });
}

export function populate({
  universalReceiverEvents,
  validUniversalProfiles,
}: {
  universalReceiverEvents: UniversalReceiver[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return universalReceiverEvents.map(
    (entity) =>
      new UniversalReceiver({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
