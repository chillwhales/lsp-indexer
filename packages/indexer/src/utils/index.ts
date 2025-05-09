import { RPC_ENDPOINT } from '@/constants';
import {
  Attribute,
  ContractAsset,
  ContractImage,
  DataChanged,
  DigitalAsset,
  Executed,
  FileAsset,
  FileImage,
  Link,
  LSP3Profile,
  LSP3ProfileUrl,
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
  Verification,
} from '@chillwhales/sqd-typeorm';
import ERC725 from '@erc725/erc725.js';
import LSP3Schema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import {
  AssetMetadata,
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
  'LSP3Profile' in obj &&
  typeof obj.LSP3Profile === 'object' &&
  'name' in obj.LSP3Profile &&
  typeof obj.LSP3Profile.name === 'string' &&
  'description' in obj.LSP3Profile &&
  typeof obj.LSP3Profile.description === 'string' &&
  'links' in obj.LSP3Profile &&
  Array.isArray(obj.LSP3Profile.links) &&
  obj.LSP3Profile.links.every(isLinkMetadata) &&
  'images' in obj.LSP3Profile &&
  Array.isArray(obj.LSP3Profile.images) &&
  obj.LSP3Profile.images.every(isImageMetadata) &&
  'assets' in obj.LSP3Profile &&
  Array.isArray(obj.LSP3Profile.assets) &&
  obj.LSP3Profile.images.every(isAssetMetadata) &&
  'icon' in obj.LSP3Profile &&
  Array.isArray(obj.LSP3Profile.icon) &&
  obj.LSP3Profile.images.every(isImageMetadata);

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

export function createLsp3ProfilePromise(lsp3ProfileUrl: LSP3ProfileUrl) {
  return new Promise<LSP3Profile>(async (resolve) => {
    try {
      const result = await new ERC725(LSP3Schema, lsp3ProfileUrl.address, RPC_ENDPOINT.url, {
        ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
      }).fetchData('LSP3Profile');

      if (
        typeof result.value === 'string' ||
        Array.isArray(result.value) ||
        !isLsp3Profile(result.value)
      )
        throw new Error('Invalid LSP3Profile');

      const lsp3Profile = result.value.LSP3Profile;

      resolve(
        new LSP3Profile({
          id: uuidv4(),
          timestamp: lsp3ProfileUrl.timestamp,
          address: lsp3ProfileUrl.address,
          universalProfile: lsp3ProfileUrl.universalProfile,
          name: lsp3Profile.name,
          description: lsp3Profile.description,
          links: lsp3Profile.links ? lsp3Profile.links.map((link) => new Link(link)) : [],
          tags: lsp3Profile.tags ? lsp3Profile.tags : [],
          avatar: lsp3Profile.avatar
            ? lsp3Profile.avatar.map((avatar) => {
                if (isFileAsset(avatar))
                  if (isVerification(avatar.verification))
                    return new FileAsset({
                      ...avatar,
                      verification: new Verification(avatar.verification),
                    });
                  else return new FileAsset({ ...avatar, verification: null });

                if (isContractAsset(avatar)) return new ContractAsset(avatar);
              })
            : [],
          profileImage: lsp3Profile.profileImage
            ? lsp3Profile.profileImage.map((image) => {
                if (isFileImage(image))
                  if (isVerification(image.verification))
                    return new FileImage({
                      ...image,
                      verification: new Verification(image.verification),
                    });
                  else return new FileImage({ ...image, verification: null });

                if (isContractImage(image)) return new ContractImage(image);
              })
            : [],
          backgroundImage: lsp3Profile.backgroundImage
            ? lsp3Profile.backgroundImage.map((image) => {
                if (isFileImage(image))
                  if (isVerification(image.verification))
                    return new FileImage({
                      ...image,
                      verification: new Verification(image.verification),
                    });
                  else return new FileImage({ ...image, verification: null });

                if (isContractImage(image)) return new ContractImage(image);
              })
            : [],
        }),
      );
    } catch (error) {
      resolve(
        new LSP3Profile({
          id: uuidv4(),
          timestamp: lsp3ProfileUrl.timestamp,
          address: lsp3ProfileUrl.address,
          universalProfile: lsp3ProfileUrl.universalProfile,
          name: '',
          description: '',
          links: [],
          tags: [],
          avatar: [],
          profileImage: [],
          backgroundImage: [],
          decodeError: JSON.stringify(error),
          rawBytes: lsp3ProfileUrl.rawBytes,
        }),
      );
    }
  });
}

export function createLsp4MetadataPromise(lsp4MetadataUrl: LSP4MetadataUrl) {
  return new Promise<LSP4Metadata>(async (resolve) => {
    try {
      const result = await new ERC725(LSP4Schema, lsp4MetadataUrl.address, RPC_ENDPOINT.url, {
        ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
      }).fetchData('LSP4Metadata');

      if (
        typeof result.value === 'string' ||
        Array.isArray(result.value) ||
        !isLsp4Metadata(result.value)
      )
        throw new Error('Invalid LSP3Profile');

      const lsp4Metadata = result.value.LSP4Metadata;

      resolve(
        new LSP4Metadata({
          id: uuidv4(),
          timestamp: lsp4MetadataUrl.timestamp,
          address: lsp4MetadataUrl.address,
          tokenId: lsp4MetadataUrl.tokenId,
          digitalAsset: lsp4MetadataUrl.digitalAsset,
          nft: lsp4MetadataUrl.nft,
          name: lsp4Metadata.name,
          description: lsp4Metadata.description,
          links: lsp4Metadata.links ? lsp4Metadata.links.map((link) => new Link(link)) : [],
          images: lsp4Metadata.icon
            ? lsp4Metadata.icon.map((image) => {
                if (isFileImage(image))
                  if (isVerification(image.verification))
                    return new FileImage({
                      ...image,
                      verification: new Verification(image.verification),
                    });
                  else return new FileImage({ ...image, verification: null });

                if (isContractImage(image)) return new ContractImage(image);
              })
            : [],
          icon: lsp4Metadata.images
            ? lsp4Metadata.images.flatMap((images) =>
                images.map((image) => {
                  if (isFileImage(image))
                    if (isVerification(image.verification))
                      return new FileImage({
                        ...image,
                        verification: new Verification(image.verification),
                      });
                    else return new FileImage({ ...image, verification: null });

                  if (isContractImage(image)) return new ContractImage(image);
                }),
              )
            : [],
          assets: lsp4Metadata.assets
            ? lsp4Metadata.assets.map((avatar) => {
                if (isFileAsset(avatar))
                  if (isVerification(avatar.verification))
                    return new FileAsset({
                      ...avatar,
                      verification: new Verification(avatar.verification),
                    });
                  else return new FileAsset({ ...avatar, verification: null });

                if (isContractAsset(avatar)) return new ContractAsset(avatar);
              })
            : [],
          attributes: lsp4Metadata.attributes
            ? lsp4Metadata.attributes.map(
                (attribute) =>
                  new Attribute({
                    key: attribute.key,
                    value: attribute.value,
                    type: typeof attribute.type,
                  }),
              )
            : [],
        }),
      );
    } catch (error) {
      resolve(
        new LSP4Metadata({
          id: uuidv4(),
          timestamp: lsp4MetadataUrl.timestamp,
          address: lsp4MetadataUrl.address,
          tokenId: lsp4MetadataUrl.tokenId,
          digitalAsset: lsp4MetadataUrl.digitalAsset,
          nft: lsp4MetadataUrl.nft,
          name: '',
          description: '',
          links: [],
          icon: [],
          images: [],
          assets: [],
          attributes: [],
          decodeError: JSON.stringify(error),
          rawBytes: lsp4MetadataUrl.rawBytes,
        }),
      );
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
