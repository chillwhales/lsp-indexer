import { Context, ExtractParams } from '@/types';
import * as Utils from '@/utils';
import { ERC725Y } from '@chillwhales/abi';
import {
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { LSP3ProfileMetadataJSON } from '@lukso/lsp3-contracts';
import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export function extract({ block, log }: ExtractParams): LSP3Profile {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value: url, decodeError } = Utils.decodeVerifiableUri(dataValue);

  return new LSP3Profile({
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
  lsp3ProfileEntities,
  validUniversalProfiles,
}: {
  lsp3ProfileEntities: LSP3Profile[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp3ProfileEntities.map(
    (entity) =>
      new LSP3Profile({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}

export async function extractSubEntities(lsp3Profile: LSP3Profile) {
  if (!lsp3Profile.url)
    return {
      fetchErrorMessage: 'Error: Missing URL',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const data = await Utils.getDataFromURL<LSP3ProfileMetadataJSON>(lsp3Profile.url);

  if (typeof data !== 'object')
    return {
      fetchErrorMessage: 'Error: Invalid data',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };
  if ('fetchErrorMessage' in data) return data;
  if (!data.LSP3Profile)
    return {
      fetchErrorMessage: 'Error: Invalid LSP3Profile',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const { name, description, tags, links, avatar, profileImage, backgroundImage } =
    data.LSP3Profile;

  const lsp3ProfileName = new LSP3ProfileName({
    id: uuidv4(),
    lsp3Profile,
    value: name,
  });

  const lsp3ProfileDescription = new LSP3ProfileDescription({
    id: uuidv4(),
    lsp3Profile,
    value: description,
  });

  const lsp3ProfileTags =
    tags && Array.isArray(tags)
      ? tags.map(
          (tag) =>
            new LSP3ProfileTag({
              id: uuidv4(),
              lsp3Profile,
              value: tag,
            }),
        )
      : [];

  const lsp3ProfileLinks =
    links && Array.isArray(links)
      ? links.map(
          ({ title, url }) =>
            new LSP3ProfileLink({
              id: uuidv4(),
              lsp3Profile,
              title,
              url,
            }),
        )
      : [];

  const lsp3ProfileAssets =
    avatar && Array.isArray(avatar)
      ? avatar.filter(Utils.isFileAsset).map(
          ({ url, fileType, verification }) =>
            new LSP3ProfileAsset({
              id: uuidv4(),
              lsp3Profile,
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

  const lsp3ProfileImages =
    profileImage && Array.isArray(profileImage)
      ? profileImage.map(
          ({ url, width, height, verification }) =>
            new LSP3ProfileImage({
              id: uuidv4(),
              lsp3Profile,
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

  const lsp3ProfileBackgroundImages =
    backgroundImage && Array.isArray(backgroundImage)
      ? backgroundImage.map(
          ({ url, width, height, verification }) =>
            new LSP3ProfileBackgroundImage({
              id: uuidv4(),
              lsp3Profile,
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

  return {
    lsp3ProfileName,
    lsp3ProfileDescription,
    lsp3ProfileTags,
    lsp3ProfileLinks,
    lsp3ProfileAssets,
    lsp3ProfileImages,
    lsp3ProfileBackgroundImages,
  };
}

export async function clearSubEntities({
  context,
  lsp3ProfileEntites,
}: {
  context: Context;
  lsp3ProfileEntites: LSP3Profile[];
}) {
  const entitiesFilter = {
    lsp3Profile: {
      id: In(lsp3ProfileEntites.map(({ id }) => id)),
    },
  };
  const [
    existingLsp3ProfileAsset,
    existingLsp3ProfileBackgroundImage,
    existingLsp3ProfileDescription,
    existingLsp3ProfileImage,
    existingLsp3ProfileLink,
    existingLsp3ProfileName,
    existingLsp3ProfileTag,
  ] = await Promise.all([
    context.store.findBy(LSP3ProfileAsset, entitiesFilter),
    context.store.findBy(LSP3ProfileBackgroundImage, entitiesFilter),
    context.store.findBy(LSP3ProfileDescription, entitiesFilter),
    context.store.findBy(LSP3ProfileImage, entitiesFilter),
    context.store.findBy(LSP3ProfileLink, entitiesFilter),
    context.store.findBy(LSP3ProfileName, entitiesFilter),
    context.store.findBy(LSP3ProfileTag, entitiesFilter),
  ]);

  await Promise.all([
    context.store.remove(existingLsp3ProfileAsset),
    context.store.remove(existingLsp3ProfileBackgroundImage),
    context.store.remove(existingLsp3ProfileDescription),
    context.store.remove(existingLsp3ProfileImage),
    context.store.remove(existingLsp3ProfileLink),
    context.store.remove(existingLsp3ProfileName),
    context.store.remove(existingLsp3ProfileTag),
  ]);
}
