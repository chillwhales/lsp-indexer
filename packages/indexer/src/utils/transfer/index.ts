import { ExtractParams } from '@/types';
import { LSP7DigitalAsset, LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT, Transfer } from '@chillwhales/sqd-typeorm';
import { generateTokenId } from '..';

export function extract({ block, log }: ExtractParams): Transfer {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;

  switch (log.topics[0]) {
    case LSP7DigitalAsset.events.Transfer.topic: {
      const { operator, from, to, amount, force, data } =
        LSP7DigitalAsset.events.Transfer.decode(log);

      return new Transfer({
        id: log.id,
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
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
        id: log.id,
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
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
  entities,
  unverifiedDigitalAssets,
}: {
  entities: Transfer[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (entity) =>
      new Transfer({
        ...entity,
        digitalAsset: !unverifiedDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: entity.nft
          ? !unverifiedDigitalAssets.has(entity.address)
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
