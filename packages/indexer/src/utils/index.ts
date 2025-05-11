import { IPFS_GATEWAY } from '@/constants';
import {
  DataChanged,
  DigitalAsset,
  Executed,
  LSP3Asset,
  LSP3BackgroundImage,
  LSP3Link,
  LSP3Profile,
  LSP3ProfileImage,
  LSP3ProfileUrl,
  LSP4Asset,
  LSP4Attribute,
  LSP4Icon,
  LSP4Image,
  LSP4Link,
  LSP4Metadata,
  LSP4MetadataUrl,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP4TokenTypeEnum,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenIdFormatEnum,
  NFT,
  OperationType,
  TokenIdDataChanged,
  Transfer,
  UniversalProfile,
  UniversalReceiver,
} from '@chillwhales/sqd-typeorm';
import ERC725 from '@erc725/erc725.js';
import { Verification } from '@lukso/lsp2-contracts';
import {
  AssetMetadata,
  ContractAsset,
  FileAsset,
  ImageMetadata,
  LinkMetadata,
  LSP3ProfileMetadataJSON,
} from '@lukso/lsp3-contracts';
import { LSP4DigitalAssetMetadataJSON } from '@lukso/lsp4-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';
import { hexToNumber, isHex } from 'viem';
import * as DataChangedUtils from './dataChanged';
import * as DigitalAssetUtils from './digitalAsset';
import * as ExecutedUtils from './executed';
import * as NFTUtils from './nft';
import * as TokenIdDataChangedUtils from './tokenIdDataChanged';
import * as TransferUtils from './transfer';
import * as UniversalProfileUtils from './universalProfile';
import * as UniversalReceiverUtils from './universalReceiver';

export function generateTokenId({ address, tokenId }: { address: string; tokenId: string }) {
  return `${address} - ${tokenId}`;
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

export const isLinkMetadata = (obj: object): obj is LinkMetadata => 'title' in obj && 'url' in obj;

export const isVerification = (obj: object): obj is Verification =>
  'method' in obj &&
  typeof obj.method === 'string' &&
  'data' in obj &&
  typeof obj.data === 'string';

export const isFileAsset = (obj: object): obj is FileAsset => 'url' in obj;

export const isContractAsset = (obj: object): obj is ContractAsset => 'address' in obj;

export const isAssetMetadata = (obj: object): obj is AssetMetadata =>
  isFileAsset(obj) || isContractAsset(obj);

export const isFileImage = (obj: object): obj is ImageMetadata =>
  'url' in obj &&
  typeof obj.url === 'string' &&
  'width' in obj &&
  typeof obj.width === 'number' &&
  'height' in obj &&
  typeof obj.height === 'number';

export const isContractImage = (obj: object): obj is ContractAsset => 'address' in obj;

export const isImageMetadata = (obj: object): obj is ImageMetadata | ContractAsset =>
  isFileImage(obj) || isContractImage(obj);

export const isLsp3Profile = (obj: object): obj is LSP3ProfileMetadataJSON =>
  'LSP3Profile' in obj &&
  typeof obj.LSP3Profile === 'object' &&
  'name' in obj.LSP3Profile &&
  typeof obj.LSP3Profile.name === 'string' &&
  'description' in obj.LSP3Profile &&
  typeof obj.LSP3Profile.description === 'string';

export const isLsp4Metadata = (obj: object): obj is LSP4DigitalAssetMetadataJSON =>
  'LSP4Metadata' in obj &&
  typeof obj.LSP4Metadata === 'object' &&
  'name' in obj.LSP4Metadata &&
  typeof obj.LSP4Metadata.name === 'string' &&
  'description' in obj.LSP4Metadata &&
  typeof obj.LSP4Metadata.description === 'string' &&
  'links' in obj.LSP4Metadata &&
  Array.isArray(obj.LSP4Metadata.links) &&
  obj.LSP4Metadata.links.every(isLinkMetadata) &&
  'images' in obj.LSP4Metadata &&
  Array.isArray(obj.LSP4Metadata.images) &&
  obj.LSP4Metadata.images.every(isImageMetadata) &&
  'assets' in obj.LSP4Metadata &&
  Array.isArray(obj.LSP4Metadata.assets) &&
  obj.LSP4Metadata.images.every(isAssetMetadata) &&
  'icon' in obj.LSP4Metadata &&
  Array.isArray(obj.LSP4Metadata.icon) &&
  obj.LSP4Metadata.images.every(isImageMetadata);

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
      decodeError: error.toString(),
    };
  }
}

export function parseIpfsUrl(url: string) {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', IPFS_GATEWAY);
  }

  return url;
}

export function createLsp3ProfilePromise(lsp3ProfileUrl: LSP3ProfileUrl) {
  return new Promise<{
    lsp3Profile: LSP3Profile;
    lsp3Links: LSP3Link[];
    lsp3Assets: LSP3Asset[];
    lsp3ProfileImages: LSP3ProfileImage[];
    lsp3BackgroundImages: LSP3BackgroundImage[];
  }>(async (resolve) => {
    try {
      const result = await fetch(parseIpfsUrl(lsp3ProfileUrl.value));
      const json = await result.json();

      if (typeof json === 'string' || Array.isArray(json) || !isLsp3Profile(json))
        throw new Error('Invalid LSP3Profile');

      const lsp3Profile = new LSP3Profile({
        id: uuidv4(),
        timestamp: lsp3ProfileUrl.timestamp,
        address: lsp3ProfileUrl.address,
        universalProfile: lsp3ProfileUrl.universalProfile,
        name: json.LSP3Profile.name,
        description: json.LSP3Profile.description,
        tags: json.LSP3Profile.tags ? json.LSP3Profile.tags : [],
        decodeError: null,
        rawBytes: lsp3ProfileUrl.rawBytes,
      });

      const lsp3Links = json.LSP3Profile.links
        ? json.LSP3Profile.links.map(
            ({ title, url }) =>
              new LSP3Link({
                id: uuidv4(),
                lsp3Profile,
                title,
                url,
              }),
          )
        : [];

      const lsp3Assets = json.LSP3Profile.avatar
        ? json.LSP3Profile.avatar.filter(isFileAsset).map(
            ({ url, fileType, verification }) =>
              new LSP3Asset({
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

      const lsp3ProfileImages = json.LSP3Profile.profileImage
        ? json.LSP3Profile.profileImage.filter(isFileImage).map(
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

      const lsp3BackgroundImages = json.LSP3Profile.backgroundImage
        ? json.LSP3Profile.backgroundImage.map(
            ({ url, width, height, verification }) =>
              new LSP3BackgroundImage({
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

      resolve({
        lsp3Profile,
        lsp3Links,
        lsp3Assets,
        lsp3ProfileImages,
        lsp3BackgroundImages,
      });
    } catch (error) {
      const errorString = error.toString();
      resolve({
        lsp3Profile: new LSP3Profile({
          id: uuidv4(),
          timestamp: lsp3ProfileUrl.timestamp,
          address: lsp3ProfileUrl.address,
          universalProfile: lsp3ProfileUrl.universalProfile,
          tags: [],
          decodeError:
            errorString.match(/[^\x20-\x7E]+/g) !== null
              ? 'LSP3Profile contians invalid characters'
              : errorString,
          rawBytes: lsp3ProfileUrl.rawBytes,
        }),
        lsp3Links: [],
        lsp3Assets: [],
        lsp3ProfileImages: [],
        lsp3BackgroundImages: [],
      });
    }
  });
}

export function createLsp4MetadataPromise(lsp4MetadataUrl: LSP4MetadataUrl) {
  return new Promise<{
    lsp4Metadata: LSP4Metadata;
    lsp4Links: LSP4Link[];
    lsp4Assets: LSP4Asset[];
    lsp4Images: LSP4Image[];
    lsp4Icons: LSP4Icon[];
    lsp4Attributes: LSP4Attribute[];
  }>(async (resolve) => {
    try {
      const result = await fetch(parseIpfsUrl(lsp4MetadataUrl.value));
      const json = await result.json();

      if (typeof json === 'string' || Array.isArray(json) || !isLsp4Metadata(json))
        throw new Error('Invalid LSP4Metadata');

      const lsp4Metadata = new LSP4Metadata({
        id: uuidv4(),
        timestamp: lsp4MetadataUrl.timestamp,
        address: lsp4MetadataUrl.address,
        digitalAsset: lsp4MetadataUrl.digitalAsset,
        nft: lsp4MetadataUrl.nft,
        name: json.LSP4Metadata.name,
        description: json.LSP4Metadata.description,
        decodeError: null,
        rawBytes: lsp4MetadataUrl.rawBytes,
      });

      const lsp4Links = json.LSP4Metadata.links
        ? json.LSP4Metadata.links.map(
            ({ title, url }) =>
              new LSP4Link({
                id: uuidv4(),
                lsp4Metadata,
                title,
                url,
              }),
          )
        : [];

      const lsp4Assets = json.LSP4Metadata.assets
        ? json.LSP4Metadata.assets.filter(isFileAsset).map(
            ({ url, fileType, verification }) =>
              new LSP4Asset({
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

      const lsp4Images = json.LSP4Metadata.images
        ? json.LSP4Metadata.images.flatMap((images) =>
            images.filter(isFileImage).map(
              ({ url, width, height, verification }) =>
                new LSP4Image({
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

      const lsp4Icons = json.LSP4Metadata.icon
        ? json.LSP4Metadata.icon.map(
            ({ url, width, height, verification }) =>
              new LSP4Icon({
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

      const lsp4Attributes = json.LSP4Metadata.attributes
        ? json.LSP4Metadata.attributes.map(
            ({ key, value, type }) =>
              new LSP4Attribute({
                id: uuidv4(),
                lsp4Metadata,
                key,
                value,
                type: typeof type,
              }),
          )
        : [];

      resolve({
        lsp4Metadata,
        lsp4Links,
        lsp4Assets,
        lsp4Images,
        lsp4Icons,
        lsp4Attributes,
      });
    } catch (error) {
      const errorString = error.toString();
      resolve({
        lsp4Metadata: new LSP4Metadata({
          id: uuidv4(),
          timestamp: lsp4MetadataUrl.timestamp,
          address: lsp4MetadataUrl.address,
          tokenId: lsp4MetadataUrl.tokenId,
          digitalAsset: lsp4MetadataUrl.digitalAsset,
          nft: lsp4MetadataUrl.nft,
          decodeError:
            errorString.match(/[^\x20-\x7E]+/g) !== null
              ? 'LSP4Metadata contians invalid characters'
              : errorString,
          rawBytes: lsp4MetadataUrl.rawBytes,
        }),

        lsp4Links: [],
        lsp4Assets: [],
        lsp4Images: [],
        lsp4Icons: [],
        lsp4Attributes: [],
      });
    }
  });
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
    verifiedNfts,
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
    verifiedNfts,
  };
}

interface PopulateAllParams {
  validUniversalProfiles: Map<string, UniversalProfile>;
  validDigitalAssets: Map<string, DigitalAsset>;
  verifiedNfts: NFT[];
  executedEvents: Executed[];
  dataChangedEvents: DataChanged[];
  universalReceiverEvents: UniversalReceiver[];
  transferEvents: Transfer[];
  tokenIdDataChangedEvents: TokenIdDataChanged[];
  lsp3ProfileUrls: LSP3ProfileUrl[];
  lsp4MetadataUrls: LSP4MetadataUrl[];
  lsp4TokenNames: LSP4TokenName[];
  lsp4TokenSymbols: LSP4TokenSymbol[];
  lsp4TokenTypes: LSP4TokenType[];
  lsp8ReferenceContracts: LSP8ReferenceContract[];
  lsp8TokenIdFormats: LSP8TokenIdFormat[];
}

export function populateAll({
  validUniversalProfiles,
  validDigitalAssets,
  verifiedNfts,
  executedEvents,
  dataChangedEvents,
  universalReceiverEvents,
  transferEvents,
  tokenIdDataChangedEvents,
  lsp3ProfileUrls,
  lsp4MetadataUrls,
  lsp4TokenNames,
  lsp4TokenSymbols,
  lsp4TokenTypes,
  lsp8ReferenceContracts,
  lsp8TokenIdFormats,
}: PopulateAllParams) {
  const populatedNfts = NFTUtils.populate({ entities: verifiedNfts, validDigitalAssets });

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

  // DataKeys
  /// LSP3ProfileUrl
  const populatedLsp3ProfileUrls = DataChangedUtils.LSP3ProfileUrl.populate({
    lsp3ProfileUrls,
    validUniversalProfiles,
  });
  /// LSP4MetadataUrl
  const populatedLsp4MetadataUrls_DataChanged = DataChangedUtils.LSP4MetadataUrl.populate({
    lsp4MetadataUrls: lsp4MetadataUrls.filter(({ nft }) => nft === null),
    validDigitalAssets,
  });
  const populatedLsp4MetadataUrls_TokenIdDataChanged =
    TokenIdDataChangedUtils.LSP4MetadataUrl.populate({
      lsp4MetadataUrls: lsp4MetadataUrls.filter(({ nft }) => nft !== null),
      validDigitalAssets,
    });
  const populatedLsp4MetadataUrls = [
    ...populatedLsp4MetadataUrls_DataChanged,
    ...populatedLsp4MetadataUrls_TokenIdDataChanged,
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

  return {
    populatedNfts,
    events: {
      populatedExecutes,
      populatedDataChangeds,
      populatedUniversalReceivers,
      populatedTransfers,
      populatedTokenIdDataChangeds,
    },
    dataKeys: {
      populatedLsp3ProfileUrls,
      populatedLsp4MetadataUrls,
      populatedLsp4TokenNames,
      populatedLsp4TokenSymbols,
      populatedLsp4TokenTypes,
      populatedLsp8ReferenceContracts,
      populatedLsp8TokenIdFormats,
    },
  };
}

export * as DataChanged from './dataChanged';
export * as DigitalAsset from './digitalAsset';
export * as Executed from './executed';
export * as Multicall3 from './multicall3';
export * as NFT from './nft';
export * as TokenIdDataChanged from './tokenIdDataChanged';
export * as Transfer from './transfer';
export * as UniversalProfile from './universalProfile';
export * as UniversalReceiver from './universalReceiver';
