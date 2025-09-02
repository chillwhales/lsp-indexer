import { ExtractParams } from '@/types';
import { LSP7DigitalAsset, LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { DigitalAsset, NFT, Transfer } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { generateTokenId } from '..';

export function extract({ block, log }: ExtractParams): Transfer {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;

  switch (log.topics[0]) {
    case LSP7DigitalAsset.events.Transfer.topic: {
      const { operator, from, to, amount, force, data } =
        LSP7DigitalAsset.events.Transfer.decode(log);

      return new Transfer({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
        transactionIndex,
        address,
        operator,
        from,
        to,
        amount,
        force,
        data,
      });
    }

    case LSP8IdentifiableDigitalAsset.events.Transfer.topic: {
      const { operator, from, to, tokenId, force, data } =
        LSP8IdentifiableDigitalAsset.events.Transfer.decode(log);

      return new Transfer({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
        transactionIndex,
        address,
        operator,
        from,
        to,
        amount: 1n,
        tokenId,
        force,
        data,
        nft: new NFT({
          id: generateTokenId({ address, tokenId }),
          tokenId,
          address,
        }),
      });
    }

    default:
      return null;
  }
}

export function populate({
  transferEntities,
  validDigitalAssets,
}: {
  transferEntities: Transfer[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return transferEntities.map(
    (entity) =>
      new Transfer({
        ...entity,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: entity.nft
          ? validDigitalAssets.has(entity.address)
            ? new NFT({
                ...entity.nft,
                digitalAsset: new DigitalAsset({ id: entity.address }),
              })
            : entity.nft
          : null,
      }),
  );
}

export * as NFT from './nft';
export * as OwnedAsset from './ownedAsset';
export * as OwnedToken from './ownedToken';
