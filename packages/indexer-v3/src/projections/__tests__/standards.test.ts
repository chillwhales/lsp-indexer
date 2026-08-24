import { stringToHex, toHex } from 'viem';
import { describe, expect, it } from 'vitest';
import {
  DATA_KEYS,
  decodeAddressKey,
  decodeAddressValue,
  decodeArrayIndex,
  decodeArrayLength,
  decodeCompactBytesArray,
  decodeLsp8BaseUri,
  decodeRegistryValue,
  deriveTokenUri,
  formatTokenId,
  isMetadataControlDataKey,
} from '../standards.js';

const address = '0x0000000000000000000000000000000000000042';

describe('LSP projection value decoders', () => {
  it('decodes addresses, array positions, and registry map values exactly', () => {
    const indexKey = `${DATA_KEYS.lsp4CreatorsIndex}${toHex(7n, { size: 16 }).slice(2)}`;
    const maximumUint128 = (1n << 128n) - 1n;
    const maximumIndexKey = `${DATA_KEYS.lsp4CreatorsIndex}${toHex(maximumUint128, { size: 16 }).slice(2)}`;
    const mapKey = `${DATA_KEYS.lsp4CreatorsMap}${address.slice(2)}`;
    const registryValue = `0x24871b3d${toHex(7n, { size: 16 }).slice(2)}`;
    const maximumRegistryValue = `0x24871b3d${toHex(maximumUint128, { size: 16 }).slice(2)}`;

    expect(decodeAddressValue(address)).toBe(address);
    expect(decodeAddressValue('0x')).toBeNull();
    expect(decodeAddressKey(mapKey)).toBe(address);
    expect(decodeArrayIndex(indexKey)).toBe(7n);
    expect(decodeArrayIndex(maximumIndexKey)).toBe(maximumUint128);
    expect(decodeArrayLength('0x')).toBe(0n);
    expect(decodeArrayLength('0x00')).toBeNull();
    expect(decodeArrayLength(toHex(8n, { size: 16 }))).toBe(8n);
    expect(decodeArrayLength(toHex(maximumUint128, { size: 16 }))).toBe(maximumUint128);
    expect(decodeRegistryValue(registryValue)).toEqual({
      interfaceId: '0x24871b3d',
      arrayIndex: 7n,
    });
    expect(decodeRegistryValue(maximumRegistryValue)?.arrayIndex).toBe(maximumUint128);
    expect(decodeRegistryValue(`${registryValue}00`)).toBeNull();
    expect(isMetadataControlDataKey(DATA_KEYS.lsp3Profile)).toBe(true);
    expect(isMetadataControlDataKey(DATA_KEYS.lsp4Metadata)).toBe(true);
    expect(
      isMetadataControlDataKey(
        `${DATA_KEYS.lsp29EncryptedAssetsIndex}${toHex(7n, { size: 16 }).slice(2)}`,
      ),
    ).toBe(true);
    expect(isMetadataControlDataKey(DATA_KEYS.lsp4TokenName)).toBe(false);
  });

  it('formats current and legacy LSP8 token IDs and derives stable token URIs', () => {
    const numericTokenId = toHex(42n, { size: 32 });
    const stringTokenId = `0x${stringToHex('whale-42').slice(2).padEnd(64, '0')}`;

    expect(formatTokenId(numericTokenId, 0)).toBe('42');
    expect(formatTokenId(numericTokenId, 100)).toBe('42');
    expect(formatTokenId(stringTokenId, 1)).toBe('whale-42');
    expect(formatTokenId(stringTokenId, 101)).toBe('whale-42');
    expect(formatTokenId(numericTokenId, 4)).toBe(numericTokenId);
    expect(formatTokenId(numericTokenId, null)).toBeNull();
    expect(deriveTokenUri('ipfs://collection/', '42')).toBe('ipfs://collection/42');
    expect(deriveTokenUri('ipfs://collection', '42')).toBe('ipfs://collection/42');
  });

  it('decodes LSP8 URI headers and CompactBytesArray values without partial acceptance', () => {
    const uri = stringToHex('ipfs://collection');
    const baseUriValue = `0x0000000000000000${uri.slice(2)}`;
    const first = '0x11223344';
    const second = '0xaabb';
    const compact = `0x0004${first.slice(2)}0002${second.slice(2)}`;

    expect(decodeLsp8BaseUri(baseUriValue)).toBe('ipfs://collection');
    expect(decodeLsp8BaseUri(`0xffffffffffffffff${uri.slice(2)}`)).toBeNull();
    expect(decodeCompactBytesArray(compact)).toEqual([first, second]);
    expect(decodeCompactBytesArray(`${compact}00`)).toBeNull();
  });
});
