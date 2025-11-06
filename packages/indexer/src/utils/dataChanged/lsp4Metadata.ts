import { Context, ExtractParams } from '@/types';
import * as Utils from '@/utils';
import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import {
  DigitalAsset,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
} from '@chillwhales/typeorm';
import { LSP4DigitalAssetMetadataJSON } from '@lukso/lsp4-contracts';
import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP4Metadata {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = LSP8IdentifiableDigitalAsset.events.DataChanged.decode(log);
  const { value: url, decodeError } = Utils.decodeVerifiableUri(dataValue);

  return new LSP4Metadata({
    id: address,
    address,
    timestamp,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    retryCount: 0,
  });
}

export function populate({
  lsp4MetadataEntities,
  validDigitalAssets,
}: {
  lsp4MetadataEntities: LSP4Metadata[];
  validDigitalAssets: Map<string, DigitalAsset>;
}) {
  return lsp4MetadataEntities.map(
    (event) =>
      new LSP4Metadata({
        ...event,
        digitalAsset: validDigitalAssets.has(event.address)
          ? new DigitalAsset({ id: event.address })
          : null,
      }),
  );
}

export async function extractSubEntities(lsp4Metadata: LSP4Metadata) {
  if (!lsp4Metadata.url)
    return {
      fetchErrorMessage: 'Error: Missing URL',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const data = await Utils.getDataFromURL<
    LSP4DigitalAssetMetadataJSON & { LSP4Metadata: { category?: string } }
  >(lsp4Metadata.url);

  if (typeof data !== 'object')
    return {
      fetchErrorMessage: 'Error: Invalid data',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };
  if ('fetchErrorMessage' in data) return data;
  if (!data.LSP4Metadata)
    return {
      fetchErrorMessage: 'Error: Invalid LSP4Metadata',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const { name, description, category, links, images, icon, assets, attributes } =
    data.LSP4Metadata;

  const lsp4MetadataName = new LSP4MetadataName({
    id: uuidv4(),
    lsp4Metadata,
    value: name,
  });

  const lsp4MetadataDescription = new LSP4MetadataDescription({
    id: uuidv4(),
    lsp4Metadata,
    value: description,
  });

  const lsp4MetadataCategory = new LSP4MetadataCategory({
    id: uuidv4(),
    lsp4Metadata,
    value: category,
  });

  const lsp4MetadataLinks =
    links && Array.isArray(links)
      ? links.map(
          ({ title, url }) =>
            new LSP4MetadataLink({
              id: uuidv4(),
              lsp4Metadata,
              title,
              url,
            }),
        )
      : [];

  const lsp4MetadataImages =
    images && Array.isArray(images)
      ? images
          .filter((images) => Array.isArray(images))
          .flatMap((images, index) =>
            images.filter(Utils.isFileImage).map(
              ({ url, width, height, verification }) =>
                new LSP4MetadataImage({
                  id: uuidv4(),
                  lsp4Metadata,
                  url: url,
                  width: width,
                  height: height,
                  ...(Utils.isVerification(verification) && {
                    verificationMethod: verification.method,
                    verificationData: verification.data,
                    verificationSource: verification.source,
                  }),
                  imageIndex: index,
                }),
            ),
          )
      : [];

  const lsp4MetadataIcons =
    icon && Array.isArray(icon)
      ? icon.map(
          ({ url, width, height, verification }) =>
            new LSP4MetadataIcon({
              id: uuidv4(),
              lsp4Metadata,
              url: url,
              width: width,
              height: height,
              ...(Utils.isVerification(verification) && {
                verificationMethod: verification.method,
                verificationData: verification.data,
                verificationSource: verification.source,
              }),
            }),
        )
      : [];

  const lsp4MetadataAssets =
    assets && Array.isArray(assets)
      ? assets.filter(Utils.isFileAsset).map(
          ({ url, fileType, verification }) =>
            new LSP4MetadataAsset({
              id: uuidv4(),
              lsp4Metadata,
              url: url,
              fileType: fileType,
              ...(Utils.isVerification(verification) && {
                verificationMethod: verification.method,
                verificationData: verification.data,
                verificationSource: verification.source,
              }),
            }),
        )
      : [];

  const lsp4MetadataAttributes =
    attributes && Array.isArray(attributes)
      ? attributes.map((attribute) => {
          const { key, value, type } = attribute;

          const score =
            'score' in attribute
              ? typeof attribute.score === 'string'
                ? Utils.isNumeric(attribute.score)
                  ? parseInt(attribute.score)
                  : null
                : typeof attribute.score === 'number'
                  ? attribute.score
                  : null
              : null;

          const rarity =
            'rarity' in attribute
              ? typeof attribute.rarity === 'string'
                ? Utils.isNumeric(attribute.rarity)
                  ? parseFloat(attribute.rarity)
                  : null
                : typeof attribute.rarity === 'number'
                  ? attribute.rarity
                  : null
              : null;

          return new LSP4MetadataAttribute({
            id: uuidv4(),
            lsp4Metadata,
            key,
            value,
            type: type?.toString(),
            score,
            rarity,
          });
        })
      : [];

  return {
    lsp4MetadataName,
    lsp4MetadataDescription,
    lsp4MetadataCategory,
    lsp4MetadataLinks,
    lsp4MetadataImages,
    lsp4MetadataIcons,
    lsp4MetadataAssets,
    lsp4MetadataAttributes,
  };
}
export async function clearSubEntities({
  context,
  lsp4MetadataEntites,
}: {
  context: Context;
  lsp4MetadataEntites: LSP4Metadata[];
}) {
  const entitiesFilter = {
    lsp4Metadata: {
      id: In(lsp4MetadataEntites.map(({ id }) => id)),
    },
  };
  const [
    existingLsp4MetadataAssets,
    existingLsp4MetadataAttributes,
    existingLsp4MetadataDescriptions,
    existingLsp4MetadataIcons,
    existingLsp4MetadataImages,
    existingLsp4MetadataLinks,
    existingLsp4MetadataNames,
    existingLsp4MetadataCategory,
  ] = await Promise.all([
    context.store.findBy(LSP4MetadataAsset, entitiesFilter),
    context.store.findBy(LSP4MetadataAttribute, entitiesFilter),
    context.store.findBy(LSP4MetadataDescription, entitiesFilter),
    context.store.findBy(LSP4MetadataIcon, entitiesFilter),
    context.store.findBy(LSP4MetadataImage, entitiesFilter),
    context.store.findBy(LSP4MetadataLink, entitiesFilter),
    context.store.findBy(LSP4MetadataName, entitiesFilter),
    context.store.findBy(LSP4MetadataCategory, entitiesFilter),
  ]);

  await Promise.all([
    context.store.remove(existingLsp4MetadataAssets),
    context.store.remove(existingLsp4MetadataAttributes),
    context.store.remove(existingLsp4MetadataDescriptions),
    context.store.remove(existingLsp4MetadataIcons),
    context.store.remove(existingLsp4MetadataImages),
    context.store.remove(existingLsp4MetadataLinks),
    context.store.remove(existingLsp4MetadataNames),
    context.store.remove(existingLsp4MetadataCategory),
  ]);
}
