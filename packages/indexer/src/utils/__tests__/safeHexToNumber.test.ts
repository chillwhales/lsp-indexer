/**
 * Unit tests for safeHexToNumber.
 *
 * Test cases:
 * - Valid small hex values within MAX_SAFE_INTEGER
 * - Large uint256 hex values that exceed MAX_SAFE_INTEGER
 * - Invalid hex strings (with truncated error messages)
 * - Range validation for specific use cases (decimals, enums)
 * - Null fallback behavior for out-of-range values
 */
import { describe, expect, it } from 'vitest';
import { safeHexToNumber } from '../index';

describe('safeHexToNumber', () => {
  it('should convert small hex values normally', () => {
    expect(safeHexToNumber('0x0')).toBe(0);
    expect(safeHexToNumber('0x1')).toBe(1);
    expect(safeHexToNumber('0xff')).toBe(255);
    expect(safeHexToNumber('0x12c')).toBe(300);
  });

  it('should throw for invalid hex strings with truncated preview', () => {
    expect(() => safeHexToNumber('not-hex')).toThrow('Invalid hex string: not-hex');
    expect(() => safeHexToNumber('')).toThrow('Invalid hex string');
  });

  it('should throw by default for values exceeding MAX_SAFE_INTEGER', () => {
    const largeHex =
      '0x40199112919948150999530646855489913475678763392411540891239760872716362593079661371844790851736955334099987190114898260946599397906766251924983248562978459922793345579860283878275961985255174039292488777802796671451419062064';

    expect(() => safeHexToNumber(largeHex)).toThrow(/Hex value exceeds maximum allowed value/);
  });

  it('should return null for oversized values when fallbackBehavior is null', () => {
    const largeHex = '0x1ffffffffffffffff'; // > MAX_SAFE_INTEGER

    expect(safeHexToNumber(largeHex, { fallbackBehavior: 'null' })).toBe(null);
  });

  it('should respect custom maxValue limits', () => {
    expect(safeHexToNumber('0xff', { maxValue: 255 })).toBe(255);
    expect(() => safeHexToNumber('0x100', { maxValue: 255 })).toThrow(
      'Hex value exceeds maximum allowed value 255',
    );
  });

  it('should return null with maxValue + null fallback combined', () => {
    expect(safeHexToNumber('0x100', { maxValue: 255, fallbackBehavior: 'null' })).toBe(null);
    expect(safeHexToNumber('0xff', { maxValue: 255, fallbackBehavior: 'null' })).toBe(255);
  });

  it('should handle decimals range validation (uint8: 0-255)', () => {
    expect(safeHexToNumber('0x0', { maxValue: 255 })).toBe(0);
    expect(safeHexToNumber('0x12', { maxValue: 255 })).toBe(18);
    expect(safeHexToNumber('0xff', { maxValue: 255 })).toBe(255);
    expect(() => safeHexToNumber('0x100', { maxValue: 255 })).toThrow();
  });

  it('should handle LSP4 token type bounds (0-2)', () => {
    expect(safeHexToNumber('0x0', { maxValue: 2, fallbackBehavior: 'null' })).toBe(0);
    expect(safeHexToNumber('0x1', { maxValue: 2, fallbackBehavior: 'null' })).toBe(1);
    expect(safeHexToNumber('0x2', { maxValue: 2, fallbackBehavior: 'null' })).toBe(2);
    expect(safeHexToNumber('0x3', { maxValue: 2, fallbackBehavior: 'null' })).toBe(null);
  });

  it('should handle LSP8 token ID format bounds (0-104)', () => {
    expect(safeHexToNumber('0x0', { maxValue: 104, fallbackBehavior: 'null' })).toBe(0);
    expect(safeHexToNumber('0x4', { maxValue: 104, fallbackBehavior: 'null' })).toBe(4);
    expect(safeHexToNumber('0x68', { maxValue: 104, fallbackBehavior: 'null' })).toBe(104); // legacy max
    expect(safeHexToNumber('0x69', { maxValue: 104, fallbackBehavior: 'null' })).toBe(null); // 105, out of range
  });

  it('should not crash on the original overflow value', () => {
    const originalCrashHex =
      '0x40199112919948150999530646855489913475678763392411540891239760872716362593079661371844790851736955334099987190114898260946599397906766251924983248562978459922793345579860283878275961985255174039292488777802796671451419062064';

    // With null fallback, returns null instead of crashing
    expect(safeHexToNumber(originalCrashHex, { fallbackBehavior: 'null' })).toBe(null);

    // With enum-style bounds, returns null instead of crashing
    expect(safeHexToNumber(originalCrashHex, { maxValue: 104, fallbackBehavior: 'null' })).toBe(
      null,
    );
  });
});
