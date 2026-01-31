import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/typeorm';
import ERC725 from '@erc725/erc725.js';
import { hexToNumber, isHex } from 'viem';

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
      decodedMetadataUrl === null
        ? null
        : typeof decodedMetadataUrl === 'object'
          ? ((decodedMetadataUrl as { url?: string }).url ?? null)
          : null;

    if (url && url.match(/[^\x20-\x7E]+/g) !== null)
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
      decodeError: error?.toString() ?? 'Unknown decode error',
    };
  }
}

export function isNumeric(value: string) {
  if (typeof value !== 'string') return false;
  return !isNaN(value as any) && !isNaN(parseFloat(value));
}

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
 * Format: `"{owner} - {address}"`
 * Port from v1: utils/index.ts generateOwnedAssetId()
 */
export function generateOwnedAssetId({
  owner,
  address,
}: {
  owner: string;
  address: string;
}): string {
  return `${owner} - ${address}`;
}

/**
 * Generate a deterministic OwnedToken entity ID from owner, contract address, and tokenId.
 *
 * Format: `"{owner} - {address} - {tokenId}"`
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
  return `${owner} - ${address} - ${tokenId}`;
}
