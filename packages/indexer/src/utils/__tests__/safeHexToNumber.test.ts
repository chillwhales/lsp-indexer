/**
 * Unit tests for safeHexToNumber and safeHexToEnum functions.
 *
 * Test cases:
 * - Valid small hex values within MAX_SAFE_INTEGER
 * - Large uint256 hex values that exceed MAX_SAFE_INTEGER
 * - Invalid hex strings
 * - Range validation for specific use cases (decimals)
 * - Enum masking behavior
 */
import { describe, expect, it } from 'vitest';
import { safeHexToEnum, safeHexToNumber } from '../index';

describe('safeHexToNumber', () => {
  it('should convert small hex values normally', () => {
    expect(safeHexToNumber('0x0')).toBe(0);
    expect(safeHexToNumber('0x1')).toBe(1);
    expect(safeHexToNumber('0xff')).toBe(255);
    expect(safeHexToNumber('0x12c')).toBe(300);
  });

  it('should throw for invalid hex strings', () => {
    expect(() => safeHexToNumber('not-hex')).toThrow('Invalid hex string');
    expect(() => safeHexToNumber('0xGG')).toThrow('Invalid hex string');
    expect(() => safeHexToNumber('')).toThrow('Invalid hex string');
  });

  it('should throw by default for values exceeding MAX_SAFE_INTEGER', () => {
    // This is the large value from the original error that caused the crash
    const largeHex =
      '0x40199112919948150999530646855489913475678763392411540891239760872716362593079661371844790851736955334099987190114898260946599397906766251924983248562978459922793345579860283878275961985255174039292488777802796671451419062064';

    expect(() => safeHexToNumber(largeHex)).toThrow(/Value.*exceeds maximum allowed value/);
  });

  it('should return null for oversized values when fallbackBehavior is null', () => {
    const largeHex = '0x1ffffffffffffffff'; // > MAX_SAFE_INTEGER

    expect(safeHexToNumber(largeHex, { fallbackBehavior: 'null' })).toBe(null);
  });

  it('should mask to lower 32 bits when fallbackBehavior is mask', () => {
    const largeHex = '0x1ffffffffffffffff'; // > MAX_SAFE_INTEGER

    const result = safeHexToNumber(largeHex, { fallbackBehavior: 'mask' });
    expect(result).toBe(Number(BigInt(largeHex) & 0xffffffffn));
  });

  it('should respect custom maxValue limits', () => {
    expect(() => safeHexToNumber('0x100', { maxValue: 255 })).toThrow(
      'Value 256 exceeds maximum allowed value 255',
    );
    expect(safeHexToNumber('0xff', { maxValue: 255 })).toBe(255);
  });

  it('should handle decimals range validation (0-255)', () => {
    expect(safeHexToNumber('0x0', { maxValue: 255 })).toBe(0);
    expect(safeHexToNumber('0xff', { maxValue: 255 })).toBe(255);
    expect(() => safeHexToNumber('0x100', { maxValue: 255 })).toThrow();
  });
});

describe('safeHexToEnum', () => {
  it('should convert small enum values normally', () => {
    expect(safeHexToEnum('0x0')).toBe(0); // LSP token format/type enum values
    expect(safeHexToEnum('0x1')).toBe(1);
    expect(safeHexToEnum('0x2')).toBe(2);
    expect(safeHexToEnum('0x3')).toBe(3);
  });

  it('should use masking for large values to extract enum from lower bits', () => {
    // Large value that has meaningful enum in lower bits
    const largeHexWithLowerBits = '0x1234567890abcdef0000000000000002'; // Lower 32 bits = 2

    const result = safeHexToEnum(largeHexWithLowerBits);
    expect(result).toBe(2); // Should extract the lower bits
  });

  it('should handle the original crash case without throwing', () => {
    const originalCrashHex =
      '0x40199112919948150999530646855489913475678763392411540891239760872716362593079661371844790851736955334099987190114898260946599397906766251924983248562978459922793345579860283878275961985255174039292488777802796671451419062064';

    // Should not throw, should return some value from lower bits
    expect(() => safeHexToEnum(originalCrashHex)).not.toThrow();

    const result = safeHexToEnum(originalCrashHex);
    expect(typeof result).toBe('number');
  });
});
