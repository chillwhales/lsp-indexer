const ADDRESS_PATTERN = /^0x[0-9a-f]{40}$/i;
const BYTES32_PATTERN = /^0x[0-9a-f]{64}$/i;
const ID_KIND_PATTERN = /^[a-z][a-z0-9-]*$/;

function assertSafePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
}

function assertSafeNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

function normalizeHex(value: string, pattern: RegExp, name: string): string {
  if (!pattern.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed hexadecimal value of the expected length`);
  }
  return value.toLowerCase();
}

function encodePart(value: string): string {
  return encodeURIComponent(value);
}

/** Normalize an EVM address to the canonical lowercase database representation. */
export function normalizeAddress(value: string): string {
  return normalizeHex(value, ADDRESS_PATTERN, 'address');
}

/** Normalize a block, transaction, topic, or data-key hash. */
export function normalizeBytes32(value: string, name = 'bytes32 value'): string {
  return normalizeHex(value, BYTES32_PATTERN, name);
}

/** Normalize an LSP8 token ID without converting it to a lossy decimal number. */
export function normalizeTokenId(value: string): string {
  return normalizeHex(value, BYTES32_PATTERN, 'token ID');
}

/** Build a stable chain-scoped identifier from an explicit entity kind and natural-key parts. */
export function createDeterministicId(
  kind: string,
  chainId: number,
  parts: readonly string[],
): string {
  if (!ID_KIND_PATTERN.test(kind)) {
    throw new Error('ID kind must be lowercase kebab case');
  }
  assertSafePositiveInteger(chainId, 'chain ID');
  if (parts.length === 0 || parts.some((part) => part.length === 0)) {
    throw new Error('Deterministic IDs require at least one non-empty natural-key part');
  }

  return `eip155:${chainId}:${kind}:${parts.map(encodePart).join(':')}`;
}

/** Deterministic identity for a canonical block fact. */
export function createBlockId(chainId: number, blockNumber: number): string {
  assertSafeNonNegativeInteger(blockNumber, 'block number');
  return createDeterministicId('block', chainId, [String(blockNumber)]);
}

/** Deterministic identity for one raw EVM log position. */
export function createEventId(
  chainId: number,
  blockNumber: number,
  transactionIndex: number,
  logIndex: number,
): string {
  assertSafeNonNegativeInteger(blockNumber, 'block number');
  assertSafeNonNegativeInteger(transactionIndex, 'transaction index');
  assertSafeNonNegativeInteger(logIndex, 'log index');
  return createDeterministicId('log', chainId, [
    String(blockNumber),
    String(transactionIndex),
    String(logIndex),
  ]);
}

/** Deterministic identity for an address-scoped projection. */
export function createAddressId(kind: string, chainId: number, address: string): string {
  return createDeterministicId(kind, chainId, [normalizeAddress(address)]);
}

/** Deterministic identity for an LSP8 token projection. */
export function createTokenEntityId(chainId: number, address: string, tokenId: string): string {
  return createDeterministicId('nft', chainId, [
    normalizeAddress(address),
    normalizeTokenId(tokenId),
  ]);
}

/** Deterministic identity for an ordered or unordered relationship projection. */
export function createRelationshipId(
  kind: string,
  chainId: number,
  addresses: readonly string[],
): string {
  return createDeterministicId(kind, chainId, addresses.map(normalizeAddress));
}

/** Deterministic identity for current ERC725Y data, optionally scoped to a token. */
export function createDataValueId(
  chainId: number,
  address: string,
  dataKey: string,
  tokenId?: string,
): string {
  return createDeterministicId('data-value', chainId, [
    normalizeAddress(address),
    tokenId == null ? 'contract' : normalizeTokenId(tokenId),
    normalizeBytes32(dataKey, 'data key'),
  ]);
}

/** Deterministic identity for one on-chain metadata source revision. */
export function createMetadataRevisionId(
  chainId: number,
  address: string,
  dataKey: string,
  sourceRevision: string,
  tokenId?: string,
): string {
  return createDeterministicId('metadata-revision', chainId, [
    normalizeAddress(address),
    tokenId == null ? 'contract' : normalizeTokenId(tokenId),
    normalizeBytes32(dataKey, 'data key'),
    sourceRevision,
  ]);
}
