import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT, TokenIdDataChanged } from '@chillwhales/sqd-typeorm';
import { generateTokenId } from '../utils';
import { ExtractParams } from './types';

export function extractTokenIdDataChanged({ block, log }: ExtractParams): TokenIdDataChanged {
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
    digitalAsset: new DigitalAsset({ address }),
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ address }),
    }),
  });
}

export function extractTokenIdDataChangedNft({ log }: ExtractParams): NFT {
  const { address } = log;
  const { tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

  return new NFT({
    id: generateTokenId({ address, tokenId }),
    tokenId,
    digitalAsset: new DigitalAsset({ address }),
    isMinted: false,
    isBurned: false,
  });
}
