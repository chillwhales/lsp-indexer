import { bytesToHex, hexToBytes, hexToString, isHex, sliceHex } from 'viem';
import { normalizeAddress } from '../db/identity.js';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead';

export const CHILLWHALES_EXTENSION = {
  collectionAddress: '0x86e817172b5c07f7036bf8aa46e2db9063743a83',
  chillAddress: '0x5b8b0e44d4719f8a328470dccd3746bfc73d6b14',
  orbsAddress: '0x4200690033c5ea89c936d247876f89f40a588b4d',
  orbLevelKey: '0x320b2edb97fdba80946ca674d317cb119437f62de6cdc9765386530eee6bba78',
  orbFactionKey: '0xffe90f868aacc849380bc19e2906230e857a2309570013576c67c7b7f26cf1f7',
} as const;

export const INTERFACE_IDS = {
  lsp0: ['0x24871b3d', '0x3e89ad98'],
  lsp7: ['0xc52d6008', '0xb3c4928f', '0xdaa746b7'],
  lsp8: ['0x3a271706', '0xecad9f75', '0x30dc5278'],
} as const;

export const DATA_KEYS = {
  lsp3Profile: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
  lsp4TokenName: '0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1',
  lsp4TokenSymbol: '0x2f0a68ab07768e01943a599e73362a0e17a63a72e94dd2e384d2c1d4db932756',
  lsp4TokenType: '0xe0261fa95db2eb3b5439bd033cda66d56b96f92f243a8228fd87550ed7bdfdb3',
  lsp4Metadata: '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
  lsp4CreatorsLength: '0x114bd03b3a46d48759680d81ebb2b414fda7d030a7105a851867accf1c2352e7',
  lsp4CreatorsIndex: '0x114bd03b3a46d48759680d81ebb2b414',
  lsp4CreatorsMap: '0x6de85eaf5d982b4e5da00000',
  lsp5ReceivedAssetsLength: '0x6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b',
  lsp5ReceivedAssetsIndex: '0x6460ee3c0aac563ccbf76d6e1d07bada',
  lsp5ReceivedAssetsMap: '0x812c4334633eb816c80d0000',
  lsp6ControllersLength: '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3',
  lsp6ControllersIndex: '0xdf30dba06db6a30e65354d9a64c60986',
  lsp6Permissions: '0x4b80742de2bf82acb3630000',
  lsp6AllowedCalls: '0x4b80742de2bf393a64c70000',
  lsp6AllowedDataKeys: '0x4b80742de2bf866c29110000',
  lsp8TokenIdFormat: '0xf675e9361af1c1664c1868cfa3eb97672d6b1a513aa5b81dec34c9ee330e818d',
  lsp8MetadataBaseUri: '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843',
  lsp8ReferenceContract: '0x708e7b881795f2e6b6c2752108c177ec89248458de3bf69d0d43480b3e5034e6',
  lsp12IssuedAssetsLength: '0x7c8c3416d6cda87cd42c71ea1843df28ac4850354f988d55ee2eaa47b6dc05cd',
  lsp12IssuedAssetsIndex: '0x7c8c3416d6cda87cd42c71ea1843df28',
  lsp12IssuedAssetsMap: '0x74ac2555c10b9349e78f0000',
  lsp29EncryptedAssetsLength: '0x1965f98377ddff08e78c93d820cc8de4eeb331e684b7724bce0debb1958386c3',
  lsp29EncryptedAssetsIndex: '0x1965f98377ddff08e78c93d820cc8de4',
  lsp29EncryptedAssetsMap: '0x2b9a7a38a67cedc507c2',
  lsp29EncryptedAssetRevisionCount: '0xb41f63e335c22bded814',
} as const;

/** Return whether a current data-value row controls one or more metadata jobs. */
export function isMetadataControlDataKey(dataKey: string): boolean {
  return (
    dataKey === DATA_KEYS.lsp3Profile ||
    dataKey === DATA_KEYS.lsp4Metadata ||
    dataKey === DATA_KEYS.lsp29EncryptedAssetsLength ||
    dataKey.startsWith(DATA_KEYS.lsp29EncryptedAssetsIndex)
  );
}

export interface RegistryValue {
  interfaceId: string;
  arrayIndex: bigint;
}

/** Return whether an address is a sentinel that must never become a typed projection. */
export function isNullAddress(address: string): boolean {
  return address === ZERO_ADDRESS || address === DEAD_ADDRESS;
}

/** Decode an exact 20-byte ERC725Y value as a normalized address. */
export function decodeAddressValue(value: string): string | null {
  if (!isHex(value) || hexToBytes(value).length !== 20) return null;
  const address = normalizeAddress(value);
  return isNullAddress(address) ? null : address;
}

/** Read the address suffix of a mapping data key. */
export function decodeAddressKey(dataKey: string): string | null {
  if (!isHex(dataKey) || hexToBytes(dataKey).length !== 32) return null;
  const address = normalizeAddress(`0x${dataKey.slice(-40)}`);
  return isNullAddress(address) ? null : address;
}

/** Decode the uint128 suffix of an array data key without losing precision. */
export function decodeArrayIndex(dataKey: string): bigint | null {
  if (!isHex(dataKey) || hexToBytes(dataKey).length !== 32) return null;
  return BigInt(`0x${dataKey.slice(-32)}`);
}

/** Decode an exact uint128 array length without losing precision. */
export function decodeArrayLength(value: string): bigint | null {
  if (value === '0x') return 0n;
  if (!isHex(value) || hexToBytes(value).length !== 16) return null;
  return BigInt(value);
}

/** Decode the interface ID and uint128 index stored by LSP registry map values. */
export function decodeRegistryValue(value: string): RegistryValue | null {
  if (!isHex(value) || hexToBytes(value).length !== 20) return null;
  const arrayIndex = BigInt(`0x${value.slice(-32)}`);
  return { interfaceId: `0x${value.slice(2, 10)}`, arrayIndex };
}

/** Decode a non-negative hexadecimal integer bounded by a caller-supplied maximum. */
export function decodeBoundedInteger(value: string, maximum: number): number | null {
  if (!isHex(value) || value === '0x') return null;
  const decoded = BigInt(value);
  return decoded <= BigInt(maximum) ? Number(decoded) : null;
}

/** Decode an ERC725Y UTF-8 scalar, returning null for empty or malformed data. */
export function decodeUtf8(value: string): string | null {
  if (!isHex(value) || value === '0x') return null;
  try {
    return hexToString(value);
  } catch {
    return null;
  }
}

/** Decode the LSP8 base-URI header used by current and legacy collections. */
export function decodeLsp8BaseUri(value: string): string | null {
  if (!isHex(value) || hexToBytes(value).length < 8) return null;
  const header = value.slice(0, 18);
  if (header !== '0x0000000000000000' && header !== '0x00008019f9b10000') return null;
  return decodeUtf8(sliceHex(value, 8));
}

/** Format an LSP8 bytes32 token ID according to standard and legacy format values. */
export function formatTokenId(tokenId: string, format: number | null): string | null {
  if (!isHex(tokenId) || hexToBytes(tokenId).length !== 32) return null;
  try {
    if (format === 0 || format === 100) return BigInt(tokenId).toString();
    if (format === 1 || format === 101) {
      return hexToString(bytesToHex(hexToBytes(tokenId).filter((byte) => byte !== 0)));
    }
    if (format === 2 || format === 102) return `0x${tokenId.slice(-40)}`;
    if ([3, 4, 103, 104].includes(format ?? -1)) return tokenId;
  } catch {
    return null;
  }
  return null;
}

/** Join an LSP8 base URI with a formatted token ID, preserving one path separator. */
export function deriveTokenUri(
  baseUri: string | null,
  formattedTokenId: string | null,
): string | null {
  if (baseUri == null || formattedTokenId == null) return null;
  return baseUri.endsWith('/') ? `${baseUri}${formattedTokenId}` : `${baseUri}/${formattedTokenId}`;
}

/** Decode an LSP2 CompactBytesArray without accepting trailing or truncated bytes. */
export function decodeCompactBytesArray(value: string): string[] | null {
  if (!isHex(value)) return null;
  const bytes = hexToBytes(value);
  const entries: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 2 > bytes.length) return null;
    const length = (bytes[offset] ?? 0) * 256 + (bytes[offset + 1] ?? 0);
    offset += 2;
    if (offset + length > bytes.length) return null;
    entries.push(bytesToHex(bytes.slice(offset, offset + length)));
    offset += length;
  }
  return entries;
}
