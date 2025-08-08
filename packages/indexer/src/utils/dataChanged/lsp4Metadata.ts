import { FieldSelection } from '@/app/processor';
import * as Utils from '@/utils';
import {
  DigitalAsset,
  LSP4MetadataUrl,
  LSP8TokenMetadataBaseURI,
  Transfer,
} from '@chillwhales/sqd-typeorm';
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

  const digitalAssets = await context.store
    .findBy(DigitalAsset, {
      address: In(populatedLsp8TokenMetadataBaseUris.map(({ address }) => address)),
    })
    .then((result) => new Map(result.map((digitalAsset) => [digitalAsset.address, digitalAsset])));

  for (const lsp8TokenMetadataBaseUri of populatedLsp8TokenMetadataBaseUris) {
    const digitalAsset = digitalAssets.get(lsp8TokenMetadataBaseUri.address);

    if (!digitalAsset || !Array.isArray(digitalAsset.nfts)) continue;

    const { address, nfts } = digitalAsset;

    for (const nft of nfts) {
      const { tokenId, formattedTokenId } = nft;

      extractedEntitesPromise.push(
        Utils.createLsp4Metadata({
          url: lsp8TokenMetadataBaseUri.value.endsWith('/')
            ? `${lsp8TokenMetadataBaseUri.value}${formattedTokenId}`
            : `${lsp8TokenMetadataBaseUri.value}/${formattedTokenId}`,
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
  const digitalAssets = await context.store
    .findBy(DigitalAsset, {
      address: In([...new Set(mintedNfts.map(({ address }) => address))]),
    })
    .then((result) => new Map(result.map((digitalAsset) => [digitalAsset.address, digitalAsset])));

  const extractedEntitesPromise: ReturnType<typeof Utils.createLsp4Metadata>[] = [];

  for (const transfer of transfers) {
    const digitalAsset = digitalAssets.get(transfer.address);

    if (!digitalAsset) continue;

    const lsp8TokenMetadataBaseUri =
      digitalAsset.lsp8TokenMetadataBaseUri.length > 0
        ? digitalAsset.lsp8TokenMetadataBaseUri.sort(
            (a, b) => b.timestamp.valueOf() - a.timestamp.valueOf(),
          )[0].value || null
        : null;

    if (!lsp8TokenMetadataBaseUri) continue;

    const { address } = digitalAsset;
    const { tokenId, nft } = transfer;

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
