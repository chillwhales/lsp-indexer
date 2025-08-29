import { IPFS_GATEWAY } from '@/constants';
import {
  DataChanged,
  DigitalAsset,
  Executed,
  Follow,
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP4TokenTypeEnum,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenIdFormatEnum,
  LSP8TokenMetadataBaseURI,
  NFT,
  OperationType,
  TokenIdDataChanged,
  Transfer,
  Unfollow,
  UniversalProfile,
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import ERC725 from '@erc725/erc725.js';
import { Verification } from '@lukso/lsp2-contracts';
import { FileAsset, ImageMetadata, LSP3ProfileMetadataJSON } from '@lukso/lsp3-contracts';
import { LSP4DigitalAssetMetadataJSON } from '@lukso/lsp4-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import axios, { AxiosError } from 'axios';
import parseDataURL from 'data-urls';
import { v4 as uuidv4 } from 'uuid';
import { bytesToHex, Hex, hexToBytes, hexToNumber, hexToString, isHex, sliceHex } from 'viem';
import * as DataChangedUtils from './dataChanged';
import * as DigitalAssetUtils from './digitalAsset';
import * as ExecutedUtils from './executed';
import * as FollowUtils from './follow';
import * as NFTUtils from './nft';
import * as TokenIdDataChangedUtils from './tokenIdDataChanged';
import * as TransferUtils from './transfer';
import * as UnfollowUtils from './unfollow';
import * as UniversalProfileUtils from './universalProfile';
import * as UniversalReceiverUtils from './universalReceiver';

export function generateTokenId({ address, tokenId }: { address: string; tokenId: string }) {
  return `${address} - ${tokenId}`;
}

export function generateOwnedAssetId({ owner, address }: { owner: string; address: string }) {
  return `${owner} - ${address}`;
}

export function generateOwnedTokenId({
  owner,
  address,
  tokenId,
}: {
  owner: string;
  address: string;
  tokenId: string;
}) {
  return `${owner} - ${address} - ${tokenId}`;
}

export function generateFollowId({
  followerAddress,
  followedAddress,
}: {
  followerAddress: string;
  followedAddress: string;
}) {
  return `${followerAddress} - ${followedAddress}`;
}

export function decodeOperationType(operationType: bigint) {
  return operationType === 0n
    ? OperationType.CALL
    : operationType === 1n
      ? OperationType.CREATE
      : operationType === 2n
        ? OperationType.CREATE2
        : operationType === 3n
          ? OperationType.DELEGATECALL
          : operationType === 4n
            ? OperationType.STATICCALL
            : null;
}

export function decodeTokenType(tokenType: number) {
  return tokenType === 0
    ? LSP4TokenTypeEnum.TOKEN
    : tokenType === 1
      ? LSP4TokenTypeEnum.NFT
      : tokenType === 2
        ? LSP4TokenTypeEnum.COLLECTION
        : null;
}

export function decodeTokenIdFormat(tokenIdFormat: number) {
  return [0, 100].includes(tokenIdFormat)
    ? LSP8TokenIdFormatEnum.NUMBER
    : [1, 101].includes(tokenIdFormat)
      ? LSP8TokenIdFormatEnum.STRING
      : [2, 102].includes(tokenIdFormat)
        ? LSP8TokenIdFormatEnum.ADDRESS
        : [3, 4, 103, 104].includes(tokenIdFormat)
          ? LSP8TokenIdFormatEnum.BYTES32
          : null;
}

export const isVerification = (obj: object): obj is Verification =>
  obj &&
  typeof obj === 'object' &&
  'method' in obj &&
  typeof obj.method === 'string' &&
  'data' in obj &&
  typeof obj.data === 'string';

export const isFileAsset = (obj: object): obj is FileAsset =>
  obj && typeof obj === 'object' && 'url' in obj;

export const isFileImage = (obj: object): obj is ImageMetadata =>
  obj &&
  typeof obj === 'object' &&
  'url' in obj &&
  typeof obj.url === 'string' &&
  'width' in obj &&
  typeof obj.width === 'number' &&
  'height' in obj &&
  typeof obj.height === 'number';

export function decodeVerifiableUri(dataValue: string): {
  value: string | null;
  decodeError: string | null;
} {
  const erc725 = new ERC725([]);

  if (!isHex(dataValue) || dataValue === '0x' || hexToNumber(dataValue) === 0)
    return { value: null, decodeError: null };

  try {
    const decodedMetadataUrl = erc725.decodeValueContent('VerifiableURI', dataValue);

    const url =
      decodedMetadataUrl === null
        ? null
        : typeof decodedMetadataUrl === 'object'
          ? decodedMetadataUrl.url
          : null;

    if (url.match(/[^\x20-\x7E]+/g) !== null)
      return {
        value: null,
        decodeError: 'Url contains invalid characters',
      };

    return {
      value: url,
      decodeError: null,
    };
  } catch (error) {
    return {
      value: null,
      decodeError: error?.toString(),
    };
  }
}

export function isNumeric(value: string) {
  if (typeof value != 'string') return false; // we only process strings!
  return (
    !isNaN(value as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(value))
  ); // ...and ensure strings of whitespace fail
}

export function parseIpfsUrl(url: string) {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  }

  return url;
}

export function isRetryableError(error: AxiosError | string) {
  let retryable = false;

  if (typeof error === 'string') {
    const errorMessage = error.toLowerCase();
    retryable =
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('getaddrinfo enotfound') ||
      errorMessage.includes('socket hang up') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('client network socket disconnected') ||
      errorMessage.includes('tlsv1 alert internal error');
  } else if (error.response) {
    // The request made it to the server, but the server returned an error
    retryable = [500, 502, 503, 504, 429].includes(error.response.status);
  } else if (error.request) {
    // The request was made, but no response was received
    const errorMessage = error.message.toLowerCase();
    retryable =
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('getaddrinfo enotfound') ||
      errorMessage.includes('socket hang up') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('client network socket disconnected') ||
      errorMessage.includes('tlsv1 alert internal error');
  }
  // else if (error instanceof AggregateError) {
  //     //Handle AggregateErrors - usually a promise race/all
  //     retryable = true;
  // }

  return retryable;
}

export async function getDataFromURL<FetchedDataType>(url: string) {
  if (url.startsWith('data:')) {
    const result = parseDataURL(url);
    const mimeType = result.mimeType.toString();

    if (mimeType.startsWith('application/json')) {
      return {
        fetchError: `Error: Invalid mime type. Expected 'application/json'. Got: '${mimeType}'`,
        isRetryable: false,
      };
    }

    try {
      return JSON.parse(Buffer.from(result.body).toString()) as FetchedDataType;
    } catch (error) {
      return {
        fetchError: error.toString(),
        isRetryable: false,
      };
    }
  } else {
    try {
      const result = await axios.get<FetchedDataType>(parseIpfsUrl(url));
      return result.data;
    } catch (error) {
      const isAxiosError = axios.isAxiosError(error);
      return {
        fetchError: isAxiosError ? error.message : error.toString(),
        isRetryable: isRetryableError(isAxiosError ? error : error.toString()),
      };
    }
  }
}

export async function createLsp3Profile(lsp3Profile: LSP3Profile) {
  if (!lsp3Profile.url) {
    return {
      fetchError: 'Error: Missing URL',
      isRetryable: false,
    };
  }

  const data = await getDataFromURL<LSP3ProfileMetadataJSON>(lsp3Profile.url);

  if (typeof data !== 'object')
    return {
      fetchError: 'Error: Invalid data',
      isRetryable: false,
    };
  if ('fetchError' in data) return data;
  if (!data.LSP3Profile)
    return {
      fetchError: 'Error: Invalid LSP3Profile',
      isRetryable: false,
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
      ? avatar.filter(isFileAsset).map(
          ({ url, fileType, verification }) =>
            new LSP3ProfileAsset({
              id: uuidv4(),
              lsp3Profile,
              url: url,
              fileType: fileType,
              ...(isVerification(verification) && {
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
              ...(isVerification(verification) && {
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
              ...(isVerification(verification) && {
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

export async function createLsp4Metadata(lsp4Metadata: LSP4Metadata) {
  if (!lsp4Metadata.url) {
    return {
      fetchError: 'Error: Missing URL',
      isRetryable: false,
    };
  }

  const data = await getDataFromURL<LSP4DigitalAssetMetadataJSON>(lsp4Metadata.url);

  if (typeof data !== 'object')
    return {
      fetchError: 'Error: Invalid data',
      isRetryable: false,
    };
  if ('fetchError' in data) return data;
  if (!data.LSP4Metadata)
    return {
      fetchError: 'Error: Invalid LSP4Metadata',
      isRetryable: false,
    };

  const { name, description, links, images, icon, assets, attributes } = data.LSP4Metadata;

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
          .flatMap((images) =>
            images.filter(isFileImage).map(
              ({ url, width, height, verification }) =>
                new LSP4MetadataImage({
                  id: uuidv4(),
                  lsp4Metadata,
                  url: url,
                  width: width,
                  height: height,
                  ...(isVerification(verification) && {
                    verificationMethod: verification.method,
                    verificationData: verification.data,
                    verificationSource: verification.source,
                  }),
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
              ...(isVerification(verification) && {
                verificationMethod: verification.method,
                verificationData: verification.data,
                verificationSource: verification.source,
              }),
            }),
        )
      : [];

  const lsp4MetadataAssets =
    assets && Array.isArray(assets)
      ? assets.filter(isFileAsset).map(
          ({ url, fileType, verification }) =>
            new LSP4MetadataAsset({
              id: uuidv4(),
              lsp4Metadata,
              url: url,
              fileType: fileType,
              ...(isVerification(verification) && {
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
                ? isNumeric(attribute.score)
                  ? parseInt(attribute.score)
                  : null
                : typeof attribute.score === 'number'
                  ? attribute.score
                  : null
              : null;

          const rarity =
            'rarity' in attribute
              ? typeof attribute.rarity === 'string'
                ? isNumeric(attribute.rarity)
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
    lsp4MetadataLinks,
    lsp4MetadataImages,
    lsp4MetadataIcons,
    lsp4MetadataAssets,
    lsp4MetadataAttributes,
  };
}

export async function getLatestBlockNumber({
  context,
}: {
  context: DataHandlerContext<Store, {}>;
}) {
  return hexToNumber(await context._chain.client.call('eth_blockNumber', []));
}

interface VerifyAllParams {
  context: DataHandlerContext<Store, {}>;
  universalProfiles: Set<string>;
  digitalAssets: Set<string>;
  nfts: Map<string, NFT>;
}

export async function verifyAll({
  context,
  universalProfiles,
  digitalAssets,
  nfts,
}: VerifyAllParams) {
  const [
    { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    { newNfts, validNfts },
  ] = await Promise.all([
    UniversalProfileUtils.verify({
      context,
      universalProfiles,
    }),
    DigitalAssetUtils.verify({
      context,
      digitalAssets,
    }),
    NFTUtils.verify({ context, nfts }),
  ]);

  return {
    universalProfiles: { newUniversalProfiles, validUniversalProfiles, invalidUniversalProfiles },
    digitalAssets: { newDigitalAssets, validDigitalAssets, invalidDigitalAssets },
    nfts: { newNfts, validNfts },
  };
}

interface PopulateAllParams {
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
  newNfts: Map<string, NFT>;
  executedEvents: Executed[];
  dataChangedEvents: DataChanged[];
  universalReceiverEvents: UniversalReceiver[];
  transferEvents: Transfer[];
  tokenIdDataChangedEvents: TokenIdDataChanged[];
  followEvents: Follow[];
  unfollowEvents: Unfollow[];
  lsp3Profiles: LSP3Profile[];
  lsp4Metadatas: LSP4Metadata[];
  lsp4TokenNames: LSP4TokenName[];
  lsp4TokenSymbols: LSP4TokenSymbol[];
  lsp4TokenTypes: LSP4TokenType[];
  lsp8ReferenceContracts: LSP8ReferenceContract[];
  lsp8TokenIdFormats: LSP8TokenIdFormat[];
  lsp8TokenMetadataBaseUris: LSP8TokenMetadataBaseURI[];
}

export function populateAll({
  validUniversalProfiles,
  validDigitalAssets,
  newNfts,
  executedEvents,
  dataChangedEvents,
  universalReceiverEvents,
  transferEvents,
  tokenIdDataChangedEvents,
  followEvents,
  unfollowEvents,
  lsp3Profiles,
  lsp4Metadatas,
  lsp4TokenNames,
  lsp4TokenSymbols,
  lsp4TokenTypes,
  lsp8ReferenceContracts,
  lsp8TokenIdFormats,
  lsp8TokenMetadataBaseUris,
}: PopulateAllParams) {
  const populatedNfts = NFTUtils.populate({ entities: [...newNfts.values()], validDigitalAssets });

  // Events
  /// event Executed(uint256,address,uint256,bytes4);
  const populatedExecutes = ExecutedUtils.populate({
    executedEvents,
    validUniversalProfiles,
  });
  /// event DataChanged(bytes32,bytes);
  const populatedDataChangeds = DataChangedUtils.populate({
    dataChangedEvents,
    validUniversalProfiles,
    validDigitalAssets,
  });
  /// event UniversalReceiver(address,uint256,bytes32,bytes,bytes);
  const populatedUniversalReceivers = UniversalReceiverUtils.populate({
    universalReceiverEvents,
    validUniversalProfiles,
  });
  /// event Transfer(address,address,address,uint256,bool,bytes);
  /// event Transfer(address,address,address,bytes32,bool,bytes);
  const populatedTransfers = TransferUtils.populate({ transferEvents, validDigitalAssets });
  /// event TokenIdDataChanged(bytes32,bytes32,bytes);
  const populatedTokenIdDataChangeds = TokenIdDataChangedUtils.populate({
    tokenIdDataChangedEvents,
    validDigitalAssets,
  });
  /// event Follow(address,address);
  const populatedFollows = FollowUtils.populate({ followEvents, validUniversalProfiles });
  /// event Unfollow(address,address);
  const populatedUnfollows = UnfollowUtils.populate({ unfollowEvents, validUniversalProfiles });

  // DataKeys
  /// LSP3ProfileUrl
  const populatedLsp3Profiles = DataChangedUtils.LSP3Profile.populate({
    lsp3Profiles,
    validUniversalProfiles,
  });
  /// LSP4Metadata
  const populatedLsp4Metadatas_DataChanged = DataChangedUtils.LSP4Metadata.populate({
    lsp4Metadatas: lsp4Metadatas.filter(({ nft }) => nft === null),
    validDigitalAssets,
  });
  const populatedLsp4Metadatas_TokenIdDataChanged = TokenIdDataChangedUtils.LSP4Metadata.populate({
    lsp4Metadatas: lsp4Metadatas.filter(({ nft }) => nft !== null),
    validDigitalAssets,
  });
  const populatedLsp4Metadatas = [
    ...populatedLsp4Metadatas_DataChanged,
    ...populatedLsp4Metadatas_TokenIdDataChanged,
  ];
  /// LSP4TokenName
  const populatedLsp4TokenNames = DataChangedUtils.LSP4TokenName.populate({
    lsp4TokenNames,
    validDigitalAssets,
  });
  /// LSP4TokenSymbol
  const populatedLsp4TokenSymbols = DataChangedUtils.LSP4TokenSymbol.populate({
    lsp4TokenSymbols,
    validDigitalAssets,
  });
  /// LSP4TokenType
  const populatedLsp4TokenTypes = DataChangedUtils.LSP4TokenType.populate({
    lsp4TokenTypes,
    validDigitalAssets,
  });
  /// LSP8ReferenceContract
  const populatedLsp8ReferenceContracts = DataChangedUtils.LSP8ReferenceContract.populate({
    lsp8ReferenceContracts,
    validDigitalAssets,
  });
  /// LSP8TokenIdFormat
  const populatedLsp8TokenIdFormats = DataChangedUtils.LSP8TokenIdFormat.populate({
    lsp8TokenIdFormats,
    validDigitalAssets,
  });

  const populatedLsp8TokenMetadataBaseUris = DataChangedUtils.LSP8TokenMetadataBaseURI.populate({
    lsp8TokenMetadataBaseUris,
    validDigitalAssets,
  });

  return {
    populatedNfts,
    events: {
      populatedExecutes,
      populatedDataChangeds,
      populatedUniversalReceivers,
      populatedTransfers,
      populatedTokenIdDataChangeds,
      populatedFollows,
      populatedUnfollows,
    },
    dataKeys: {
      populatedLsp3Profiles,
      populatedLsp4Metadatas,
      populatedLsp4TokenNames,
      populatedLsp4TokenSymbols,
      populatedLsp4TokenTypes,
      populatedLsp8ReferenceContracts,
      populatedLsp8TokenIdFormats,
      populatedLsp8TokenMetadataBaseUris,
    },
  };
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatTokenId({
  tokenId,
  lsp8TokenIdFormat,
}: {
  tokenId: Hex;
  lsp8TokenIdFormat?: LSP8TokenIdFormatEnum;
}) {
  switch (lsp8TokenIdFormat) {
    case LSP8TokenIdFormatEnum.NUMBER:
      return hexToNumber(tokenId).toString();
    case LSP8TokenIdFormatEnum.STRING:
      return hexToString(bytesToHex(hexToBytes(tokenId).filter((byte) => byte !== 0)));
    case LSP8TokenIdFormatEnum.ADDRESS:
      return sliceHex(tokenId, 12);
    case LSP8TokenIdFormatEnum.BYTES32:
      return tokenId;

    default:
      return tokenId;
  }
}

export * as ChillClaimed from './chillClaimed';
export * as DataChanged from './dataChanged';
export * as DigitalAsset from './digitalAsset';
export * as Executed from './executed';
export * as Follow from './follow';
export * as Multicall3 from './multicall3';
export * as NFT from './nft';
export * as OrbsClaimed from './orbsClaimed';
export * as TokenIdDataChanged from './tokenIdDataChanged';
export * as Transfer from './transfer';
export * as Unfollow from './unfollow';
export * as UniversalProfile from './universalProfile';
export * as UniversalReceiver from './universalReceiver';
