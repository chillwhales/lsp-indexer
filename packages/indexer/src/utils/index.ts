import { IPFS_GATEWAY } from '@/constants';
import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/typeorm';
import ERC725 from '@erc725/erc725.js';
import { Verification } from '@lukso/lsp2-contracts';
import { FileAsset, ImageMetadata } from '@lukso/lsp3-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import axios, { AxiosError } from 'axios';
import parseDataURL from 'data-urls';
import { bytesToHex, Hex, hexToBytes, hexToNumber, hexToString, isHex, sliceHex } from 'viem';

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export function isRetryableError(error: AxiosError | string) {
  let retryable = false;

  if (!error) return true;

  if (typeof error !== 'string' && error.status) {
    // The request made it to the server, but the server returned an error
    retryable = [408, 429, 500, 502, 503, 504].includes(error.status);
  } else {
    // The request was made, but no response was received
    const errorMessage =
      typeof error === 'string' ? error.toLowerCase() : error.message.toLowerCase();
    retryable =
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('getaddrinfo enotfound') ||
      errorMessage.includes('socket hang up') ||
      errorMessage.includes('aborted') ||
      errorMessage.includes('client network socket disconnected') ||
      errorMessage.includes('tlsv1 alert internal error') ||
      errorMessage.includes('aggregateerror');
  }

  return retryable;
}

export async function getDataFromURL<FetchedDataType>(url: string) {
  if (url.startsWith('data:')) {
    const result = parseDataURL(url);
    const mimeType = result.mimeType.toString();

    if (!mimeType.startsWith('application/json')) {
      return {
        fetchErrorMessage: `Error: Invalid mime type. Expected 'application/json'. Got: '${mimeType}'`,
        fetchErrorCode: null,
        fetchErrorStatus: null,
      };
    }

    try {
      return JSON.parse(Buffer.from(result.body).toString()) as FetchedDataType;
    } catch (error) {
      return {
        fetchErrorMessage: error.toString(),
        fetchErrorCode: null,
        fetchErrorStatus: null,
      };
    }
  } else {
    try {
      const result = await axios.get<FetchedDataType>(parseIpfsUrl(url));
      return result.data;
    } catch (error) {
      return axios.isAxiosError(error)
        ? {
            fetchErrorMessage: error.message,
            fetchErrorCode: error.code,
            fetchErrorStatus: error.status,
          }
        : {
            fetchErrorMessage: JSON.stringify(error),
            fetchErrorCode: null,
            fetchErrorStatus: null,
          };
    }
  }
}

export async function getLatestBlockNumber({
  context,
}: {
  context: DataHandlerContext<Store, {}>;
}) {
  return hexToNumber(await context._chain.client.call('eth_blockNumber', []));
}

export * as ChillClaimed from './chillClaimed';
export * as DataChanged from './dataChanged';
export * as DigitalAsset from './digitalAsset';
export { populateEntities } from './entityPopulation';
export { verifyEntities } from './entityVerification';
export * as Executed from './executed';
export * as Follow from './follow';
export * as LSP4MetadataBaseURI from './lsp4MetadataBaseUri';
export * as Multicall3 from './multicall3';
export * as NFT from './nft';
export * as OrbsClaimed from './orbsClaimed';
export * as OwnershipTransferred from './ownershipTransferred';
export * as TokenIdDataChanged from './tokenIdDataChanged';
export * as Transfer from './transfer';
export * as Unfollow from './unfollow';
export * as UniversalProfile from './universalProfile';
export * as UniversalReceiver from './universalReceiver';
