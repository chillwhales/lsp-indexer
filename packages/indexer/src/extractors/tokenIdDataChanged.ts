import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, LSP4MetadataUrl, NFT, TokenIdDataChanged } from '@chillwhales/sqd-typeorm';
import { v4 as uuidv4 } from 'uuid';
import { decodeVerifiableUri, generateTokenId } from '../utils';
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
    digitalAsset: new DigitalAsset({ id: address, address }),
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ id: address, address }),
    }),
  });
}

export function extractNft({ log }: ExtractParams): NFT {
  const { address } = log;
  const { tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

  return new NFT({
    id: generateTokenId({ address, tokenId }),
    tokenId,
    digitalAsset: new DigitalAsset({ id: address, address }),
    isMinted: false,
    isBurned: false,
  });
}

export function extractLsp4MetadataUrl({ block, log }: ExtractParams): LSP4MetadataUrl {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue, tokenId } = LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);
  const { value, decodeError } = decodeVerifiableUri(dataValue);
  return new LSP4MetadataUrl({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    digitalAsset: new DigitalAsset({ id: address, address }),
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ id: address, address }),
    }),
    rawBytes: dataValue,
    value,
    decodeError,
  });
}
