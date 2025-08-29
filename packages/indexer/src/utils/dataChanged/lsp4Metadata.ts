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
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = LSP8IdentifiableDigitalAsset.events.DataChanged.decode(log);
  const { value: url, decodeError } = Utils.decodeVerifiableUri(dataValue);

  return new LSP4Metadata({
    id: uuidv4(),
    timestamp,
    address,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    isRetryable: false,
    retryCount: 0,
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
  populatedNfts,
  populatedLsp8TokenMetadataBaseUris,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedNfts: Map<string, NFT>;
  populatedLsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
}) {
  const nfts = await context.store
    .findBy(NFT, {
      address: In(populatedLsp8TokenMetadataBaseUris.map(({ address }) => address)),
    })
    .then((nfts) => new Map(nfts.map((nft) => [nft.id, nft])));

  for (const nft of nfts.values()) {
    if (populatedNfts.has(nft.id)) {
      nfts.set(nft.id, populatedNfts.get(nft.id));
    }
  }

  const lsp4Metadatas: LSP4Metadata[] = [];

  for (const lsp8TokenMetadataBaseUri of populatedLsp8TokenMetadataBaseUris) {
    const { address, value, rawValue, timestamp } = lsp8TokenMetadataBaseUri;
    const filteredNfts = [...nfts.values()].filter((nft) => nft.address === address);

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
          isDataFetched: false,
          isRetryable: false,
          retryCount: 0,
        }),
      );
    }
  }

  return lsp4Metadatas;
}

export async function extractFromMints({
  context,
  populatedTransfers,
  populatedNfts,
  populatedLsp8TokenMetadataBaseUris,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedTransfers: Transfer[];
  populatedNfts: Map<string, NFT>;
  populatedLsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
}) {
  const mintedNfts = populatedTransfers.filter(
    (transferEvent) =>
      isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
  );
  const lsp8TokenMetadataBaseUris = [
    ...(await context.store.findBy(LSP8TokenMetadataBaseURI, {
      address: In([...new Set(populatedTransfers.map(({ address }) => address))]),
    })),
    ...populatedLsp8TokenMetadataBaseUris,
  ];

  const lsp4Metadatas: LSP4Metadata[] = [];

  for (const transfer of mintedNfts) {
    const { address, tokenId, digitalAsset } = transfer;
    const nft = populatedNfts.has(transfer.nft.id)
      ? populatedNfts.get(transfer.nft.id)
      : transfer.nft;

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
        isDataFetched: false,
        isRetryable: false,
        retryCount: 0,
      }),
    );
  }

  return lsp4Metadatas;
}
