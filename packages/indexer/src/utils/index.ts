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

// ---------------------------------------------------------------------------
// LSP29 Encrypted Asset type guards
// ---------------------------------------------------------------------------

/**
 * LSP29 File metadata structure.
 */
export interface LSP29FileMetadata {
  type: string | null;
  name: string | null;
  size: number | null;
  lastModified: number | null;
  hash: string | null;
}

/**
 * Type guard for LSP29 File objects.
 * All fields are optional, but object must exist.
 */
export const isLSP29File = (obj: unknown): obj is LSP29FileMetadata =>
  obj !== null && obj !== undefined && typeof obj === 'object';

/**
 * Extract LSP29 file fields with validation.
 */
export function extractLSP29File(file: LSP29FileMetadata): {
  type: string | null;
  name: string | null;
  size: bigint | null;
  lastModified: bigint | null;
  hash: string | null;
} {
  return {
    type: 'type' in file && typeof file.type === 'string' ? file.type : null,
    name: 'name' in file && typeof file.name === 'string' ? file.name : null,
    size: 'size' in file && typeof file.size === 'number' ? BigInt(file.size) : null,
    lastModified:
      'lastModified' in file && typeof file.lastModified === 'number'
        ? BigInt(file.lastModified)
        : null,
    hash: 'hash' in file && typeof file.hash === 'string' ? file.hash : null,
  };
}

/**
 * LSP29 Encryption metadata structure.
 */
export interface LSP29EncryptionMetadata {
  method: string | null;
  ciphertext: string | null;
  dataToEncryptHash: string | null;
  decryptionCode: string | null;
  decryptionParams: Record<string, unknown> | null;
  accessControlConditions: unknown[] | null;
}

/**
 * Type guard for LSP29 Encryption objects.
 */
export const isLSP29Encryption = (obj: unknown): obj is LSP29EncryptionMetadata =>
  obj !== null && obj !== undefined && typeof obj === 'object';

/**
 * Extract LSP29 encryption fields with validation.
 */
export function extractLSP29Encryption(encryption: LSP29EncryptionMetadata): {
  method: string | null;
  ciphertext: string | null;
  dataToEncryptHash: string | null;
  decryptionCode: string | null;
  decryptionParams: string | null;
} {
  return {
    method:
      'method' in encryption && typeof encryption.method === 'string' ? encryption.method : null,
    ciphertext:
      'ciphertext' in encryption && typeof encryption.ciphertext === 'string'
        ? encryption.ciphertext
        : null,
    dataToEncryptHash:
      'dataToEncryptHash' in encryption && typeof encryption.dataToEncryptHash === 'string'
        ? encryption.dataToEncryptHash
        : null,
    decryptionCode:
      'decryptionCode' in encryption && typeof encryption.decryptionCode === 'string'
        ? encryption.decryptionCode
        : null,
    decryptionParams:
      'decryptionParams' in encryption &&
      encryption.decryptionParams &&
      typeof encryption.decryptionParams === 'object'
        ? JSON.stringify(encryption.decryptionParams)
        : null,
  };
}

/**
 * LSP29 Access Control Condition metadata structure.
 */
export interface LSP29ConditionMetadata {
  contractAddress: string | null;
  chain: string | null;
  method: string | null;
  standardContractType: string | null;
  comparator: string | null;
  returnValueTest: { comparator?: string; value?: string } | null;
  parameters: string[] | null;
}

/**
 * Type guard for LSP29 Access Control Condition objects.
 */
export const isLSP29Condition = (obj: unknown): obj is LSP29ConditionMetadata =>
  obj !== null && obj !== undefined && typeof obj === 'object';

/**
 * Extract LSP29 condition fields with validation.
 */
export function extractLSP29Condition(condition: LSP29ConditionMetadata): {
  contractAddress: string | null;
  chain: string | null;
  method: string | null;
  standardContractType: string | null;
  comparator: string | null;
  value: string | null;
  tokenId: string | null;
  followerAddress: string | null;
} {
  const parameters =
    'parameters' in condition && Array.isArray(condition.parameters) ? condition.parameters : null;
  const method =
    'method' in condition && typeof condition.method === 'string' ? condition.method : null;
  const returnValueTest =
    'returnValueTest' in condition &&
    condition.returnValueTest &&
    typeof condition.returnValueTest === 'object'
      ? condition.returnValueTest
      : null;

  return {
    contractAddress:
      'contractAddress' in condition && typeof condition.contractAddress === 'string'
        ? condition.contractAddress
        : null,
    chain: 'chain' in condition && typeof condition.chain === 'string' ? condition.chain : null,
    method,
    standardContractType:
      'standardContractType' in condition && typeof condition.standardContractType === 'string'
        ? condition.standardContractType
        : null,
    comparator:
      ('comparator' in condition && typeof condition.comparator === 'string'
        ? condition.comparator
        : null) ||
      (returnValueTest &&
      'comparator' in returnValueTest &&
      typeof returnValueTest.comparator === 'string'
        ? returnValueTest.comparator
        : null),
    value:
      returnValueTest && 'value' in returnValueTest && typeof returnValueTest.value === 'string'
        ? returnValueTest.value
        : null,
    tokenId:
      parameters && parameters.length > 0
        ? parameters.find(
            (p): p is string => typeof p === 'string' && p.startsWith('0x') && p.length === 66,
          ) || null
        : null,
    followerAddress:
      method === 'isFollowing' && parameters && typeof parameters[0] === 'string'
        ? parameters[0]
        : null,
  };
}

/**
 * LSP29 Chunks metadata structure.
 */
export interface LSP29ChunksMetadata {
  cids: string[] | null;
  iv: string | null;
  totalSize: number | null;
}

/**
 * Type guard for LSP29 Chunks objects.
 */
export const isLSP29Chunks = (obj: unknown): obj is LSP29ChunksMetadata =>
  obj !== null && obj !== undefined && typeof obj === 'object';

/**
 * Extract LSP29 chunks fields with validation.
 */
export function extractLSP29Chunks(chunks: LSP29ChunksMetadata): {
  cids: string[];
  iv: string | null;
  totalSize: bigint | null;
} {
  return {
    cids:
      'cids' in chunks && Array.isArray(chunks.cids)
        ? chunks.cids.filter((c): c is string => typeof c === 'string')
        : [],
    iv: 'iv' in chunks && typeof chunks.iv === 'string' ? chunks.iv : null,
    totalSize:
      'totalSize' in chunks && typeof chunks.totalSize === 'number'
        ? BigInt(chunks.totalSize)
        : null,
  };
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
