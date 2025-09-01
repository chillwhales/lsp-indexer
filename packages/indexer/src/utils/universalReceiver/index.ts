import { ExtractParams } from '@/types';
import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile, UniversalReceiver } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): UniversalReceiver {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { from, value, typeId, receivedData, returnedValue } =
    LSP0ERC725Account.events.UniversalReceiver.decode(log);

  return new UniversalReceiver({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    from,
    value,
    typeId,
    receivedData,
    returnedValue,
  });
}

export function populate({
  universalReceiverEntities,
  validUniversalProfiles,
}: {
  universalReceiverEntities: UniversalReceiver[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return universalReceiverEntities.map(
    (entity) =>
      new UniversalReceiver({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}
