import { LSP7DigitalAsset, LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import { DigitalAsset, NFT, Transfer } from '@chillwhales/sqd-typeorm';
import { zeroAddress } from 'viem';
import { generateTokenId } from '../utils';
import { ExtractParams } from './types';

export function extractLsp7Transfer({ block, log }: ExtractParams): Transfer {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
  const { operator, from, to, amount, force, data } = LSP7DigitalAsset.events.Transfer.decode(log);

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
    digitalAsset: new DigitalAsset({ address }),
  });
}

export function extractLsp8Transfer({ block, log }: ExtractParams): Transfer {
  const { timestamp, height } = block.header;
  const { address, logIndex } = log;
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
    digitalAsset: new DigitalAsset({ address }),
    nft: new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ address }),
    }),
  });
}

export function extractTransferNft({ log }: ExtractParams): NFT | null {
  const { address } = log;
  const { from, to, tokenId } = LSP8IdentifiableDigitalAsset.events.Transfer.decode(log);

  if (from === zeroAddress)
    return new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ address }),
      isMinted: true,
      isBurned: false,
    });

  if (to === zeroAddress)
    return new NFT({
      id: generateTokenId({ address, tokenId }),
      tokenId,
      digitalAsset: new DigitalAsset({ address }),
      isMinted: false,
      isBurned: true,
    });

  return null;
}
