import { FieldSelection } from '@/app/processor';
import * as Utils from '@/utils';
import { LSP4Metadata, LSP8TokenMetadataBaseURI, NFT, Transfer } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export async function extract({
  context,
  populatedTransferEntities,
  populatedLsp8TokenMetadataBaseUriEntities,
  populatedNfts,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedTransferEntities: Transfer[];
  populatedLsp8TokenMetadataBaseUriEntities: LSP8TokenMetadataBaseURI[];
  populatedNfts: Map<string, NFT>;
}) {
  const lsp4MetadataBaseUriEntities: LSP4Metadata[] = [];
  if (populatedLsp8TokenMetadataBaseUriEntities.length > 0) {
    context.log.info(
      JSON.stringify({
        message: "Extracting 'LSP4Metadata' entities from 'LSP8TokenMetadataBaseURI' data key",
      }),
    );

    const extractedLsp4Metadatas = await extractFromBaseUri({
      context,
      populatedNfts,
      populatedLsp8TokenMetadataBaseUriEntities,
    });

    lsp4MetadataBaseUriEntities.push(...extractedLsp4Metadatas);
  } else if (
    populatedTransferEntities.filter(
      (transferEvent) =>
        isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
    ).length > 0
  ) {
    context.log.info(
      JSON.stringify({
        message:
          "Extracting 'LSP4Metadata' entities from minted NFTs of a Digital Asset that has a valid 'LSP8TokenMetadataBaseURI'",
      }),
    );

    const extractedLsp4Metadatas = await extractFromMints({
      context,
      populatedTransferEntities,
      populatedNfts,
      populatedLsp8TokenMetadataBaseUriEntities,
    });

    lsp4MetadataBaseUriEntities.push(...extractedLsp4Metadatas);
  }

  return [
    ...new Map(
      lsp4MetadataBaseUriEntities
        .sort((a, b) => a.timestamp.valueOf() - b.timestamp.valueOf())
        .map((lsp4MetadataEntity) => [lsp4MetadataEntity.id, lsp4MetadataEntity]),
    ).values(),
  ];
}

export async function extractFromBaseUri({
  context,
  populatedNfts,
  populatedLsp8TokenMetadataBaseUriEntities,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedNfts: Map<string, NFT>;
  populatedLsp8TokenMetadataBaseUriEntities: LSP8TokenMetadataBaseURI[];
}) {
  const nfts = await context.store
    .findBy(NFT, {
      address: In(populatedLsp8TokenMetadataBaseUriEntities.map(({ address }) => address)),
    })
    .then((nfts) => new Map(nfts.map((nft) => [nft.id, nft])));

  for (const nft of nfts.values()) {
    if (populatedNfts.has(nft.id)) {
      nfts.set(nft.id, populatedNfts.get(nft.id));
    }
  }

  const lsp4MetadataEntities: LSP4Metadata[] = [];

  for (const lsp8TokenMetadataBaseUri of populatedLsp8TokenMetadataBaseUriEntities) {
    const { address, value, rawValue, timestamp } = lsp8TokenMetadataBaseUri;
    const filteredNfts = [...nfts.values()].filter((nft) => nft.address === address);

    for (const nft of filteredNfts) {
      const { tokenId, formattedTokenId, digitalAsset } = nft;

      lsp4MetadataEntities.push(
        new LSP4Metadata({
          id: `BaseURI - ${Utils.generateTokenId({ address, tokenId })}`,
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
          retryCount: 0,
        }),
      );
    }
  }

  return lsp4MetadataEntities;
}

export async function extractFromMints({
  context,
  populatedTransferEntities,
  populatedNfts,
  populatedLsp8TokenMetadataBaseUriEntities,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedTransferEntities: Transfer[];
  populatedNfts: Map<string, NFT>;
  populatedLsp8TokenMetadataBaseUriEntities: LSP8TokenMetadataBaseURI[];
}) {
  const mintedNfts = populatedTransferEntities.filter(
    (transferEvent) =>
      isAddressEqual(getAddress(transferEvent.from), zeroAddress) && transferEvent.tokenId,
  );
  const lsp8TokenMetadataBaseUriEntities = [
    ...(await context.store.findBy(LSP8TokenMetadataBaseURI, {
      address: In([...new Set(populatedTransferEntities.map(({ address }) => address))]),
    })),
    ...populatedLsp8TokenMetadataBaseUriEntities,
  ];

  const lsp4MetadataEntities: LSP4Metadata[] = [];

  for (const transfer of mintedNfts) {
    const { address, tokenId, digitalAsset } = transfer;
    const nft = populatedNfts.has(transfer.nft.id)
      ? populatedNfts.get(transfer.nft.id)
      : transfer.nft;

    const latestLsp8TokenMetadataBaseUri = lsp8TokenMetadataBaseUriEntities
      .filter((lsp8TokenMetadataBaseUri) => lsp8TokenMetadataBaseUri.address === address)
      .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];

    if (!latestLsp8TokenMetadataBaseUri) continue;

    const { value, rawValue, timestamp } = latestLsp8TokenMetadataBaseUri;

    lsp4MetadataEntities.push(
      new LSP4Metadata({
        id: `BaseURI - ${Utils.generateTokenId({ address, tokenId })}`,
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
        retryCount: 0,
      }),
    );
  }

  return lsp4MetadataEntities;
}
