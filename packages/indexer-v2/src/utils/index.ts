import { DEAD_ADDRESS, ZERO_ADDRESS } from '@/constants';
import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/typeorm';
import ERC725 from '@erc725/erc725.js';
import type { Verification } from '@lukso/lsp2-contracts';
import type { FileAsset, ImageMetadata } from '@lukso/lsp3-contracts';
import { bytesToHex, Hex, hexToBytes, hexToNumber, hexToString, isHex, sliceHex } from 'viem';

/**
 * Decode an ERC725Y VerifiableURI-encoded data value into a plain URL.
 *
 * Returns `{ value, decodeError }`:
 *   - `value` is the decoded URL string (or null if empty/invalid)
 *   - `decodeError` is an error message (or null if no error)
 *
 * Port from v1: utils/index.ts decodeVerifiableUri()
 */
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
      (decodedMetadataUrl !== null &&
        typeof decodedMetadataUrl === 'object' &&
        'url' in decodedMetadataUrl &&
        decodedMetadataUrl.url) ??
      null;

    if (url && url.match(/[^\x20-\x7E]+/g) !== null)
      return {
        value: null,
        decodeError: 'Url contains invalid characters',
      };

    return {
      value: url,
      decodeError: null,
    };
  } catch (error: unknown) {
    return {
      value: null,
      decodeError: error instanceof Error ? error.message : 'Unknown decode error',
    };
  }
}

export function isNumeric(value: string): boolean {
  if (typeof value !== 'string') return false;
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

/**
 * Check if an address is a null-ish address (zero or dead).
 *
 * These addresses cannot be Universal Profiles or Digital Assets, so they
 * should be filtered out before queueing enrichment requests to avoid
 * wasteful supportsInterface() RPC calls.
 *
 * @param address - The address to check (any casing)
 * @returns true if the address is zero or dead, false otherwise
 */
export function isNullAddress(address: string): boolean {
  const lower = address.toLowerCase();
  return lower === ZERO_ADDRESS.toLowerCase() || lower === DEAD_ADDRESS.toLowerCase();
}

/**
 * Type guard for LSP2 Verification objects.
 * Checks that object has `method` (string) and `data` (string) properties.
 *
 * Port from v1: utils/index.ts isVerification()
 */
export const isVerification = (obj: unknown): obj is Verification =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === 'object' &&
  'method' in obj &&
  typeof obj.method === 'string' &&
  'data' in obj &&
  typeof obj.data === 'string';

/**
 * Type guard for LSP3 FileAsset objects.
 * Checks that object has a `url` property.
 *
 * Port from v1: utils/index.ts isFileAsset()
 */
export const isFileAsset = (obj: unknown): obj is FileAsset =>
  obj !== null && obj !== undefined && typeof obj === 'object' && 'url' in obj;

/**
 * Type guard for LSP3 ImageMetadata objects.
 * Checks that object has `url` (string), `width` (number), and `height` (number).
 *
 * Port from v1: utils/index.ts isFileImage()
 */
export const isFileImage = (obj: unknown): obj is ImageMetadata =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === 'object' &&
  'url' in obj &&
  typeof obj.url === 'string' &&
  'width' in obj &&
  typeof obj.width === 'number' &&
  'height' in obj &&
  typeof obj.height === 'number';

/**
 * Generate a deterministic NFT entity ID from contract address and tokenId.
 *
 * Format: `"{address} - {tokenId}"`
 */
export function generateTokenId({
  address,
  tokenId,
}: {
  address: string;
  tokenId: string;
}): string {
  return `${address} - ${tokenId}`;
}

/**
 * Generate a deterministic Follow entity ID from follower and followed addresses.
 *
 * Format: `"{followerAddress} - {followedAddress}"`
 */
export function generateFollowId({
  followerAddress,
  followedAddress,
}: {
  followerAddress: string;
  followedAddress: string;
}): string {
  return `${followerAddress} - ${followedAddress}`;
}

/**
 * Map LSP4 token type integer to the LSP4TokenTypeEnum.
 *
 * 0 = TOKEN, 1 = NFT, 2 = COLLECTION.
 *
 * Port from v1: utils/index.ts decodeTokenType()
 */
export function decodeTokenType(tokenType: number): LSP4TokenTypeEnum | null {
  return tokenType === 0
    ? LSP4TokenTypeEnum.TOKEN
    : tokenType === 1
      ? LSP4TokenTypeEnum.NFT
      : tokenType === 2
        ? LSP4TokenTypeEnum.COLLECTION
        : null;
}

/**
 * Map LSP8 token ID format integer to the LSP8TokenIdFormatEnum.
 *
 * Standard values: 0=NUMBER, 1=STRING, 2=ADDRESS, 3/4=BYTES32.
 * Legacy values (100+) map to the same enums.
 *
 * Port from v1: utils/index.ts decodeTokenIdFormat()
 */
export function decodeTokenIdFormat(tokenIdFormat: number): LSP8TokenIdFormatEnum | null {
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

/**
 * Map ERC725X operation type integer to the OperationType enum.
 *
 * @see https://docs.lukso.tech/standards/lsp-background/erc725/#erc725x
 */
export function decodeOperationType(operationType: bigint): OperationType | null {
  switch (operationType) {
    case 0n:
      return OperationType.CALL;
    case 1n:
      return OperationType.CREATE;
    case 2n:
      return OperationType.CREATE2;
    case 3n:
      return OperationType.DELEGATECALL;
    case 4n:
      return OperationType.STATICCALL;
    default:
      return null;
  }
}

/**
 * Generate a deterministic OwnedAsset entity ID from owner and contract address.
 *
 * Format: `"{owner}:{address}"`
 * Port from v1: utils/index.ts generateOwnedAssetId()
 */
export function generateOwnedAssetId({
  owner,
  address,
}: {
  owner: string;
  address: string;
}): string {
  return `${owner}:${address}`;
}

/**
 * Generate a deterministic OwnedToken entity ID from owner, contract address, and tokenId.
 *
 * Format: `"{owner}:{address}:{tokenId}"`
 * Port from v1: utils/index.ts generateOwnedTokenId()
 */
export function generateOwnedTokenId({
  owner,
  address,
  tokenId,
}: {
  owner: string;
  address: string;
  tokenId: string;
}): string {
  return `${owner}:${address}:${tokenId}`;
}

/**
 * Format a raw LSP8 tokenId bytes32 value according to the token ID format.
 *
 * Used by FormattedTokenId handler to decode tokenId based on the LSP8TokenIdFormat
 * data key for the contract.
 *
 * @param tokenId          - Raw bytes32 tokenId hex string
 * @param lsp8TokenIdFormat - The decoded token ID format enum (NUMBER, STRING, ADDRESS, BYTES32)
 * @returns Formatted tokenId string, or null if format is unknown/unsupported
 *
 * Port from v1: utils/index.ts formatTokenId()
 * V2 change: returns null on unknown format instead of raw tokenId
 */
export function formatTokenId({
  tokenId,
  lsp8TokenIdFormat,
}: {
  tokenId: string;
  lsp8TokenIdFormat?: LSP8TokenIdFormatEnum | null;
}): string | null {
  switch (lsp8TokenIdFormat) {
    case LSP8TokenIdFormatEnum.NUMBER:
      return hexToNumber(tokenId as Hex).toString();
    case LSP8TokenIdFormatEnum.STRING:
      return hexToString(bytesToHex(hexToBytes(tokenId as Hex).filter((byte) => byte !== 0)));
    case LSP8TokenIdFormatEnum.ADDRESS:
      return sliceHex(tokenId as Hex, 12);
    case LSP8TokenIdFormatEnum.BYTES32:
      return tokenId;
    default:
      return null;
  }
}
