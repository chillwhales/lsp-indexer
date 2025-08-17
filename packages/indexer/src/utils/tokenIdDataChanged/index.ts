import { ExtractParams } from '@/types';
import { generateTokenId } from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT, TokenIdDataChanged } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): TokenIdDataChanged {
  const { timestamp, height } = block.header;
  const { address, logIndex, transactionIndex } = log;
  const { tokenId, dataKey, dataValue } =
    LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

  return new TokenIdDataChanged({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    blockNumber: height,
    logIndex,
    transactionIndex,
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
  tokenIdDataChangedEvents,
  validDigitalAssets,
}: {
  tokenIdDataChangedEvents: TokenIdDataChanged[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return tokenIdDataChangedEvents.map(
    (entity) =>
      new TokenIdDataChanged({
        ...entity,
        digitalAsset: validDigitalAssets.has(entity.address)
          ? new DigitalAsset({ id: entity.address })
          : null,
        nft: validDigitalAssets.has(entity.address)
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
