import { ExtractParams } from '@/types';
import { generateTokenId } from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT, TokenIdDataChanged } from '@chillwhales/sqd-typeorm';

export function extract({ block, log }: ExtractParams): TokenIdDataChanged {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { tokenId, dataKey, dataValue } =
    LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

  return new TokenIdDataChanged({
    id: log.id,
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    address,
    tokenId,
    dataKey,
    dataValue,
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
    }),
  });
}

export function populate({
  entities,
  unverifiedDigitalAssets,
}: {
  entities: TokenIdDataChanged[];
  unverifiedDigitalAssets: Map<string, DigitalAsset>;
}) {
  return entities.map(
    (entity) =>
      new TokenIdDataChanged({
        ...entity,
        digitalAsset: !unverifiedDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: !unverifiedDigitalAssets.has(entity.address)
          ? new NFT({
              ...entity.nft,
              digitalAsset: new DigitalAsset({ id: entity.address }),
            })
          : entity.nft,
      }),
  );
}

export * as LSP4MetadataUrl from './lsp4MetadataUrl';
export * as NFT from './nft';
