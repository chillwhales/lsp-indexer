/**
 * Read-only bidirectional registry for ERC725Y data keys.
 *
 * Manages the hex↔name maps and prefix key index. Provides resolution,
 * existence-check, and enumeration functions.
 *
 * Pre-populated from {@link BUILT_IN_DATA_KEYS} at module load time.
 *
 * @module
 */

import { BUILT_IN_DATA_KEYS } from './constants';

// ---------------------------------------------------------------------------
// Internal registry — bidirectional maps (read-only after initialization)
// ---------------------------------------------------------------------------

/** Reverse map: lowercase hex → human-readable name */
const HEX_TO_NAME = new Map<string, string>();

/** Forward map: lowercase name → lowercase hex data key */
const NAME_TO_HEX = new Map<string, string>();

/** Prefix keys (shorter than 66 chars) sorted longest-first for greedy matching */
const PREFIX_KEYS: Array<{ hex: string; name: string }> = [];

// Populate from built-in data keys at module load time
for (const [name, hex] of BUILT_IN_DATA_KEYS) {
  const lowerHex = hex.toLowerCase();
  HEX_TO_NAME.set(lowerHex, name);
  NAME_TO_HEX.set(name.toLowerCase(), lowerHex);
  if (lowerHex.length < 66) {
    PREFIX_KEYS.push({ hex: lowerHex, name });
  }
}

// Sort longest-first so the most specific prefix matches first
PREFIX_KEYS.sort((a, b) => b.hex.length - a.hex.length);

// ---------------------------------------------------------------------------
// Resolution — lookup data keys by name or hex
// ---------------------------------------------------------------------------

/**
 * Resolve a raw hex ERC725Y data key to its human-readable name.
 *
 * First tries an exact match against the registry. If no exact match is found,
 * checks whether the hex starts with any known prefix key (e.g., array index
 * keys like `AddressPermissions[].index` are 16-byte prefixes, but the stored
 * data key has the full 32 bytes with the index appended).
 *
 * Prefix matching is greedy — the longest matching prefix wins.
 * Case-insensitive.
 *
 * @param hex - Raw hex data key (e.g., '0x5ef83ad9...' or '0xdf30dba0...00000001')
 * @returns Human-readable name (e.g., 'LSP3Profile', 'AddressPermissions[].index') or `null` if unknown
 */
export function resolveDataKeyName(hex: string): string | null {
  const lower = hex.toLowerCase();

  // Exact match (full 32-byte keys and prefix keys registered directly)
  const exact = HEX_TO_NAME.get(lower);
  if (exact != null) return exact;

  // Prefix match — check if the hex starts with any known prefix key
  // PREFIX_KEYS is sorted longest-first for greedy matching
  for (const prefix of PREFIX_KEYS) {
    if (lower.startsWith(prefix.hex)) {
      return prefix.name;
    }
  }

  return null;
}

/**
 * Resolve a human-readable ERC725Y data key name to its raw hex value.
 *
 * Case-insensitive. Returns `null` for unknown names.
 *
 * @param name - Human-readable data key name (e.g., 'LSP3Profile')
 * @returns Hex data key (e.g., '0x5ef83ad9...') or `null` if unknown
 */
export function resolveDataKeyHex(name: string): string | null {
  return NAME_TO_HEX.get(name.toLowerCase()) ?? null;
}

// ---------------------------------------------------------------------------
// Existence checks
// ---------------------------------------------------------------------------

/**
 * Check whether a human-readable data key name is registered.
 *
 * @param name - Human-readable data key name
 * @returns `true` if the name is known
 */
export function isKnownDataKeyName(name: string): boolean {
  return NAME_TO_HEX.has(name.toLowerCase());
}

/**
 * Check whether a hex data key is registered.
 *
 * @param hex - Raw hex data key
 * @returns `true` if the hex key is known
 */
export function isKnownDataKeyHex(hex: string): boolean {
  return HEX_TO_NAME.has(hex.toLowerCase());
}

// ---------------------------------------------------------------------------
// Enumeration — list all known data keys
// ---------------------------------------------------------------------------

/**
 * Get all known human-readable data key names.
 *
 * @returns Array of known data key names
 */
export function getKnownDataKeyNames(): string[] {
  return [...HEX_TO_NAME.values()];
}

/**
 * Get all known hex data keys.
 *
 * @returns Array of known hex data keys (lowercase)
 */
export function getKnownDataKeyHexes(): string[] {
  return [...HEX_TO_NAME.keys()];
}

/**
 * Get the total number of known data keys.
 */
export function getDataKeyCount(): number {
  return HEX_TO_NAME.size;
}

/**
 * Get all known data keys as `[hex, name]` pairs.
 *
 * @returns Array of `[hex, name]` tuples
 */
export function getDataKeyEntries(): [hex: string, name: string][] {
  return [...HEX_TO_NAME.entries()];
}
