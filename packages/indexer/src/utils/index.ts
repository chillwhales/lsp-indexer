import { DEAD_ADDRESS, ZERO_ADDRESS } from '@/constants';
import { BlockPosition } from '@/core/types';
import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/typeorm';
import ERC725 from '@erc725/erc725.js';
import type { Verification } from '@lukso/lsp2-contracts';
import type { FileAsset, ImageMetadata, LinkMetadata } from '@lukso/lsp3-contracts';
import { bytesToHex, Hex, hexToBytes, hexToNumber, hexToString, isHex, sliceHex } from 'viem';

/**
 * Decode an ERC725Y VerifiableURI-encoded data value into a plain URL.
 *
 * Returns `{ value, decodeError }`:
 *   - `value` is the decoded URL string (or null if empty/invalid)
 *   - `decodeError` is an error message (or null if no error)
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
      decodedMetadataUrl !== null &&
      typeof decodedMetadataUrl === 'object' &&
      'url' in decodedMetadataUrl &&
      typeof decodedMetadataUrl.url === 'string'
        ? decodedMetadataUrl.url
        : null;

    if (url !== null && url.match(/[^\x20-\x7E]+/g) !== null)
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
 * Compare two block positions for ordering.
 * Returns negative if `a` is earlier than `b`, positive if later, 0 if equal.
 * Comparison order: blockNumber → transactionIndex → logIndex.
 */
export function compareBlockPosition(a: BlockPosition, b: BlockPosition): number {
  if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
  if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;
  return a.logIndex - b.logIndex;
}

export const isLink = (obj: unknown): obj is LinkMetadata =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === 'object' &&
  'title' in obj &&
  typeof obj.title === 'string' &&
  'url' in obj &&
  typeof obj.url === 'string';

// ---------------------------------------------------------------------------
// LSP4 Attribute type guard and helpers
// ---------------------------------------------------------------------------

/**
 * LSP4 Attribute metadata structure.
 * All fields are optional in the JSON but we validate what we can.
 */
export interface AttributeMetadata {
  key: string;
  value: string;
  type: string | number | null;
  score: string | number | null;
  rarity: string | number | null;
}

/**
 * Type guard for LSP4 Attribute objects.
 * Requires `key` (string) and `value` (string) at minimum.
 * Optional: `type`, `score`, `rarity`.
 */
export const isAttribute = (obj: unknown): obj is AttributeMetadata =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === 'object' &&
  'key' in obj &&
  typeof obj.key === 'string' &&
  'value' in obj &&
  typeof obj.value === 'string';

/**
 * Parse score from attribute. Handles string or number.
 * Returns integer or null.
 */
export function parseAttributeScore(attribute: AttributeMetadata): number | null {
  if (!('score' in attribute) || attribute.score === null) return null;
  if (typeof attribute.score === 'number') return attribute.score;
  if (typeof attribute.score === 'string' && isNumeric(attribute.score)) {
    return parseInt(attribute.score);
  }
  return null;
}

/**
 * Parse rarity from attribute. Handles string or number.
 * Returns float or null.
 */
export function parseAttributeRarity(attribute: AttributeMetadata): number | null {
  if (!('rarity' in attribute) || attribute.rarity === null) return null;
  if (typeof attribute.rarity === 'number') return attribute.rarity;
  if (typeof attribute.rarity === 'string' && isNumeric(attribute.rarity)) {
    return parseFloat(attribute.rarity);
  }
  return null;
}

/**
 * Get attribute type as string. Handles string or number.
 */
export function getAttributeType(attribute: AttributeMetadata): string | null {
  if (!('type' in attribute) || attribute.type === null) return null;
  if (typeof attribute.type === 'string') return attribute.type;
  if (typeof attribute.type === 'number') return attribute.type.toString();
  return null;
}

/**
 * Type guard for LSP2 Verification objects.
 * Checks that object has `method` (string) and `data` (string) properties.
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
 */
export const isFileAsset = (obj: unknown): obj is FileAsset =>
  obj !== null &&
  obj !== undefined &&
  typeof obj === 'object' &&
  'url' in obj &&
  typeof obj.url === 'string' &&
  'fileType' in obj &&
  typeof obj.fileType === 'string' &&
  'verification' in obj &&
  isVerification(obj.verification);

/**
 * Type guard for LSP3 ImageMetadata objects.
 * Checks that object has `url` (string), `width` (number), and `height` (number).
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
  typeof obj.height === 'number' &&
  'verification' in obj &&
  isVerification(obj.verification);

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
 * Returns null on unknown format instead of raw tokenId.
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
