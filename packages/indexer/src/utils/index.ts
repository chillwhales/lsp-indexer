import { DEAD_ADDRESS, MAX_CHUNK_ARRAY_LENGTH, MAX_JSON_LENGTH, ZERO_ADDRESS } from '@/constants';
import { BlockPosition } from '@/core/types';
import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/typeorm';
import { isNumeric } from '@chillwhales/utils';
import ERC725 from '@erc725/erc725.js';
import type { Verification } from '@lukso/lsp2-contracts';
import type { FileAsset, ImageMetadata, LinkMetadata } from '@lukso/lsp3-contracts';
import {
  bytesToHex,
  Hex,
  hexToBigInt,
  hexToBool,
  hexToBytes,
  hexToString,
  isHex,
  sliceHex,
} from 'viem';

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

  // Check for empty/zero values without using hexToNumber (which crashes on large values)
  if (!isHex(dataValue) || dataValue === '0x' || BigInt(dataValue) === 0n)
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

/**
 * Safely stringify a value and cap at MAX_JSON_LENGTH.
 * Returns null if the value is nullish, unstringifiable, or the result exceeds the limit.
 * Logs a warning when truncation or stringify failure occurs.
 *
 * @param value - The value to stringify
 * @param fieldName - Optional field name for warning log context
 */
export function safeJsonStringify(value: unknown, fieldName?: string): string | null {
  if (value == null) return null;
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    console.warn(
      `[safeJsonStringify] Field "${fieldName ?? 'unknown'}" failed to stringify, storing null`,
    );
    return null;
  }
  if (json.length > MAX_JSON_LENGTH) {
    console.warn(
      `[safeJsonStringify] Field "${fieldName ?? 'unknown'}" exceeded ${MAX_JSON_LENGTH} chars (${json.length}), storing null`,
    );
    return null;
  }
  return json;
}

/**
 * Cap an array of strings at MAX_CHUNK_ARRAY_LENGTH.
 * Returns null if the array is nullish or empty.
 * Logs a warning when truncation occurs.
 *
 * @param arr - The string array to cap
 */
export function safeChunkArray(arr: string[] | undefined | null): string[] | null {
  if (!arr || arr.length === 0) return null;
  if (arr.length > MAX_CHUNK_ARRAY_LENGTH) {
    console.warn(
      `[safeChunkArray] Array exceeded ${MAX_CHUNK_ARRAY_LENGTH} elements (${arr.length}), truncating`,
    );
    return arr.slice(0, MAX_CHUNK_ARRAY_LENGTH);
  }
  return arr;
}

/**
 * Safely convert a value to BigInt, returning null on failure.
 * Handles string, number, and bigint inputs. Returns null for null/undefined
 * or values that cannot be parsed (e.g., non-numeric strings).
 */
export function safeBigInt(value: unknown): bigint | null {
  if (value == null) return null;
  try {
    return BigInt(value as string | number);
  } catch {
    return null;
  }
}

/**
 * Safely convert a hex value to boolean, returning false on any error.
 *
 * Wraps viem's `hexToBool` which throws on invalid hex (e.g. multi-word ABI-encoded
 * return data). This prevents pipeline crashes on unexpected Multicall3 return formats.
 *
 * @param hex - Hex string to convert
 * @returns boolean value, or false if conversion fails
 */
export function safeHexToBool(hex: Hex): boolean {
  try {
    return hexToBool(hex);
  } catch {
    return false;
  }
}

/**
 * Safely convert hex to number, handling large uint256 values that exceed MAX_SAFE_INTEGER.
 *
 * Default behavior is strict: throws if the value exceeds `maxValue`.
 * Callers can opt into returning `null` instead via `fallbackBehavior: 'null'`.
 *
 * @param hex Hex string to convert (must pass `isHex`)
 * @param options.maxValue Upper bound for the result (default: MAX_SAFE_INTEGER)
 * @param options.fallbackBehavior 'throw' (default) or 'null' when value exceeds maxValue
 * @returns number when the value is in range, null when fallbackBehavior='null' and out of range
 * @throws Error on invalid hex or when value exceeds maxValue (default behavior)
 */
export function safeHexToNumber(
  hex: string,
  options: {
    maxValue?: number;
    fallbackBehavior?: 'throw' | 'null';
  } = {},
): number | null {
  if (!isHex(hex)) {
    const preview = hex.length > 66 ? `${hex.slice(0, 66)}… (${hex.length} chars)` : hex;
    throw new Error(`Invalid hex string: ${preview}`);
  }

  if (hex === '0x') {
    throw new Error('Empty hex value (0x) — callers should filter before conversion');
  }

  const bigIntValue = hexToBigInt(hex);
  const { maxValue = Number.MAX_SAFE_INTEGER, fallbackBehavior = 'throw' } = options;

  if (!Number.isInteger(maxValue) || maxValue < 0 || maxValue > Number.MAX_SAFE_INTEGER) {
    throw new Error(`maxValue must be a safe non-negative integer (got ${maxValue})`);
  }

  const maxBigInt = BigInt(maxValue);

  if (bigIntValue <= maxBigInt) {
    return Number(bigIntValue);
  }

  if (fallbackBehavior === 'null') {
    return null;
  }

  throw new Error(
    `Hex value exceeds maximum allowed value ${maxValue} (got ${hex.length > 66 ? `${hex.slice(0, 66)}…` : hex})`,
  );
}

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
      // Use BigInt to safely handle large numbers that exceed JS safe integer range
      return BigInt(tokenId as Hex).toString();
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
