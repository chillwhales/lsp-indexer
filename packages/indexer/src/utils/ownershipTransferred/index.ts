import { ExtractParams } from '@/types';
import { LSP14Ownable2Step } from '@chillwhales/abi';
import { DigitalAsset, OwnershipTransferred, UniversalProfile } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): OwnershipTransferred {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { previousOwner, newOwner } = LSP14Ownable2Step.events.OwnershipTransferred.decode(log);

  return new OwnershipTransferred({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
    address,
    previousOwner,
    newOwner,
  });
}

export function populate({
  ownershipTransferredEntities,
  validUniversalProfiles,
  validDigitalAssets,
}: {
  ownershipTransferredEntities: OwnershipTransferred[];
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return ownershipTransferredEntities.map(
    (entity) =>
      new OwnershipTransferred({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
      }),
  );
}
