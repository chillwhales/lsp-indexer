import { FieldSelection } from '@/app/processor';
import * as Utils from '@/utils';
import { LSP4MetadataUrl, LSP8TokenMetadataBaseURI, NFT, Transfer } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export async function extractFromUrl({
  context,
  populatedLsp4MetadataUrls,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedLsp4MetadataUrls: LSP4MetadataUrl[];
}) {
  const extractedEntitesPromise: ReturnType<typeof Utils.createLsp4Metadata>[] = [];
  for (const lsp4MetadataUrl of populatedLsp4MetadataUrls) {
    extractedEntitesPromise.push(
      Utils.createLsp4Metadata({
        url: lsp4MetadataUrl.value,
        timestamp: lsp4MetadataUrl.timestamp,
        address: lsp4MetadataUrl.address,
        digitalAsset: lsp4MetadataUrl.digitalAsset,
        tokenId: lsp4MetadataUrl.tokenId,
        nft: lsp4MetadataUrl.nft,
        rawValue: lsp4MetadataUrl.rawValue,
        lsp4MetadataUrl,
      }),
    );
  }
  const extractedEntites = await Promise.all(extractedEntitesPromise);

  const lsp4Metadatas = extractedEntites.map(({ lsp4Metadata }) => lsp4Metadata);
  const lsp4Links = extractedEntites.flatMap(({ lsp4Links }) => lsp4Links);
  const lsp4Assets = extractedEntites.flatMap(({ lsp4Assets }) => lsp4Assets);
  const lsp4Icons = extractedEntites.flatMap(({ lsp4Icons }) => lsp4Icons);
  const lsp4Images = extractedEntites.flatMap(({ lsp4Images }) => lsp4Images);
  const lsp4Attributes = extractedEntites.flatMap(({ lsp4Attributes }) => lsp4Attributes);

  context.log.info(
    JSON.stringify({
      message: 'Saving new LSP4Metadata objects.',
      lsp4MetadatasCount: lsp4Metadatas.length,
      lsp4LinksCount: lsp4Links.length,
      lsp4AssetsCount: lsp4Assets.length,
      lsp4IconsCount: lsp4Icons.length,
      lsp4ImagesCount: lsp4Images.length,
      lsp4AttributesCount: lsp4Attributes.length,
    }),
  );

  return {
    lsp4Metadatas,
    lsp4Links,
    lsp4Assets,
    lsp4Icons,
    lsp4Images,
    lsp4Attributes,
  };
}

export async function extractFromBaseUri({
  context,
  populatedLsp8TokenMetadataBaseUris,
}: {
  context: DataHandlerContext<Store, FieldSelection>;
  populatedLsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
}) {
  const extractedEntitesPromise: ReturnType<typeof Utils.createLsp4Metadata>[] = [];

  const nfts = await context.store.findBy(NFT, {
    address: In(populatedLsp8TokenMetadataBaseUris.map(({ address }) => address)),
  });

  for (const lsp8TokenMetadataBaseUri of populatedLsp8TokenMetadataBaseUris) {
    for (const nft of nfts.filter((nft) => nft.address === lsp8TokenMetadataBaseUri.address)) {
      const { address, tokenId, formattedTokenId, digitalAsset } = nft;

      extractedEntitesPromise.push(
        Utils.createLsp4Metadata({
          url: lsp8TokenMetadataBaseUri.value
            ? lsp8TokenMetadataBaseUri.value.endsWith('/')
              ? `${lsp8TokenMetadataBaseUri.value}${formattedTokenId}`
              : `${lsp8TokenMetadataBaseUri.value}/${formattedTokenId}`
            : null,
          timestamp: lsp8TokenMetadataBaseUri.timestamp,
          address,
          digitalAsset,
          tokenId,
          nft,
        }),
      );
    }
  }

  const extractedEntites = await Promise.all(extractedEntitesPromise);

  const lsp4Metadatas = extractedEntites.map(({ lsp4Metadata }) => lsp4Metadata);
  const lsp4Links = extractedEntites.flatMap(({ lsp4Links }) => lsp4Links);
  const lsp4Assets = extractedEntites.flatMap(({ lsp4Assets }) => lsp4Assets);
  const lsp4Icons = extractedEntites.flatMap(({ lsp4Icons }) => lsp4Icons);
  const lsp4Images = extractedEntites.flatMap(({ lsp4Images }) => lsp4Images);
  const lsp4Attributes = extractedEntites.flatMap(({ lsp4Attributes }) => lsp4Attributes);

  context.log.info(
    JSON.stringify({
      message: 'Saving new LSP4Metadata objects.',
      lsp4MetadatasCount: lsp4Metadatas.length,
      lsp4LinksCount: lsp4Links.length,
      lsp4AssetsCount: lsp4Assets.length,
      lsp4IconsCount: lsp4Icons.length,
      lsp4ImagesCount: lsp4Images.length,
      lsp4AttributesCount: lsp4Attributes.length,
    }),
  );

  return {
    lsp4Metadatas,
    lsp4Links,
    lsp4Assets,
    lsp4Icons,
    lsp4Images,
    lsp4Attributes,
  };
}

export async function extractFromTransfers({
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

  const extractedEntitesPromise: ReturnType<typeof Utils.createLsp4Metadata>[] = [];

  for (const transfer of mintedNfts) {
    const { address, tokenId, nft, digitalAsset } = transfer;

    const latestLsp8TokenIdFormat = lsp8TokenMetadataBaseUris
      .filter((lsp8TokenIdFormat) => lsp8TokenIdFormat.address === address)
      .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];

    const lsp8TokenMetadataBaseUri = latestLsp8TokenIdFormat?.value || null;

    if (!lsp8TokenMetadataBaseUri) continue;

    extractedEntitesPromise.push(
      Utils.createLsp4Metadata({
        url: lsp8TokenMetadataBaseUri.endsWith('/')
          ? `${lsp8TokenMetadataBaseUri}${nft.formattedTokenId}`
          : `${lsp8TokenMetadataBaseUri}/${nft.formattedTokenId}`,
        timestamp: transfer.timestamp,
        address,
        digitalAsset,
        tokenId,
        nft,
      }),
    );
  }

  const extractedEntites = await Promise.all(extractedEntitesPromise);

  const lsp4Metadatas = extractedEntites.map(({ lsp4Metadata }) => lsp4Metadata);
  const lsp4Links = extractedEntites.flatMap(({ lsp4Links }) => lsp4Links);
  const lsp4Assets = extractedEntites.flatMap(({ lsp4Assets }) => lsp4Assets);
  const lsp4Icons = extractedEntites.flatMap(({ lsp4Icons }) => lsp4Icons);
  const lsp4Images = extractedEntites.flatMap(({ lsp4Images }) => lsp4Images);
  const lsp4Attributes = extractedEntites.flatMap(({ lsp4Attributes }) => lsp4Attributes);

  context.log.info(
    JSON.stringify({
      message: 'Saving new LSP4Metadata objects.',
      lsp4MetadatasCount: lsp4Metadatas.length,
      lsp4LinksCount: lsp4Links.length,
      lsp4AssetsCount: lsp4Assets.length,
      lsp4IconsCount: lsp4Icons.length,
      lsp4ImagesCount: lsp4Images.length,
      lsp4AttributesCount: lsp4Attributes.length,
    }),
  );

  return {
    lsp4Metadatas,
    lsp4Links,
    lsp4Assets,
    lsp4Icons,
    lsp4Images,
    lsp4Attributes,
  };
}
