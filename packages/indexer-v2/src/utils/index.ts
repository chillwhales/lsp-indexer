import { OperationType } from '@chillwhales/typeorm';

export function isNumeric(value: string) {
  if (typeof value != 'string') return false;
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
