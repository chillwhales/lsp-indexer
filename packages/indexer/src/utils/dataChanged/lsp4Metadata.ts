import { FieldSelection } from '@/app/processor';
import { ExtractParams } from '@/types';
import * as Utils from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/sqd-abi';
import {
  DigitalAsset,
  LSP4Metadata,
  LSP8TokenMetadataBaseURI,
  NFT,
  Transfer,
} from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export function extract({ block, log }: ExtractParams): LSP4Metadata {
  const { timestamp } = block.header;
  const { address } = log;
  const { dataValue } = LSP8IdentifiableDigitalAsset.events.DataChanged.decode(log);
  const { value, decodeError } = Utils.decodeVerifiableUri(dataValue);

  return new LSP4Metadata({
    id: uuidv4(),
    timestamp: new Date(timestamp),
    address,
    url: value,
    rawValue: dataValue,
    decodeError,
    dataFetched: false,
  });
}

export function populate({
  lsp4Metadatas,
  validDigitalAssets,
}: {
  lsp4Metadatas: LSP4Metadata[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4Metadatas.map(
    (event) =>
      new LSP4Metadata({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}

export async function extractFromBaseUri({
  context,
  populatedLsp8TokenMetadataBaseUris,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedLsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
}) {
  const nfts = await context.store.findBy(NFT, {
    address: In(populatedLsp8TokenMetadataBaseUris.map(({ address }) => address)),
  });

  const lsp4Metadatas: LSP4Metadata[] = [];

  for (const lsp8TokenMetadataBaseUri of populatedLsp8TokenMetadataBaseUris) {
    const { address, value, rawValue, timestamp } = lsp8TokenMetadataBaseUri;
    const filteredNfts = nfts.filter((nft) => nft.address === address);

    for (const nft of filteredNfts) {
      const { tokenId, formattedTokenId, digitalAsset } = nft;

      lsp4Metadatas.push(
        new LSP4Metadata({
          id: uuidv4(),
          timestamp: new Date(timestamp),
          address,
          digitalAsset,
          tokenId,
          nft,
          url: value
            ? value.endsWith('/')
              ? `${value}${formattedTokenId}`
              : `${value}/${formattedTokenId}`
            : null,
          rawValue,
          dataFetched: false,
        }),
      );
    }
  }

  return lsp4Metadatas;
}

export async function extractFromMints({
  context,
  transfers,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  transfers: Transfer[];
}) {
  const mintedNfts = transfers.filter(
    (transferEvent) =>
      isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
  );
  const lsp8TokenMetadataBaseUris = await context.store.findBy(LSP8TokenMetadataBaseURI, {
    address: In([...new Set(transfers.map(({ address }) => address))]),
  });

  const lsp4Metadatas: LSP4Metadata[] = [];

  for (const transfer of mintedNfts) {
    const { address, tokenId, nft, digitalAsset } = transfer;

    const latestLsp8TokenMetadataBaseUri = lsp8TokenMetadataBaseUris
      .filter((lsp8TokenMetadataBaseUri) => lsp8TokenMetadataBaseUri.address === address)
      .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];

    if (!latestLsp8TokenMetadataBaseUri) continue;

    const { value, rawValue, timestamp } = latestLsp8TokenMetadataBaseUri;

    lsp4Metadatas.push(
      new LSP4Metadata({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        address,
        digitalAsset,
        tokenId,
        nft,
        url: value
          ? value.endsWith('/')
            ? `${value}${nft.formattedTokenId}`
            : `${value}/${nft.formattedTokenId}`
          : null,
        rawValue,
        dataFetched: false,
      }),
    );
  }

  return lsp4Metadatas;
}
