/**
 * Read-only bidirectional registry for LSP1 UniversalReceiver type IDs.
 *
 * Manages the hex↔name maps for known LSP1 type identifiers. Provides
 * resolution, existence-check, and enumeration functions.
 *
 * Pre-populated from {@link BUILT_IN_TYPE_IDS} at module load time.
 *
 * @module
 */

import { BUILT_IN_TYPE_IDS } from './constants';

// ---------------------------------------------------------------------------
// Internal registry — bidirectional maps (read-only after initialization)
// ---------------------------------------------------------------------------

/** Reverse map: lowercase hex → human-readable name */
const HEX_TO_TYPE_ID_NAME = new Map<string, string>();

/** Forward map: lowercase name → lowercase hex type ID */
const TYPE_ID_NAME_TO_HEX = new Map<string, string>();

// Populate from built-in type IDs at module load time
for (const [name, hex] of BUILT_IN_TYPE_IDS) {
  const lowerHex = hex.toLowerCase();
  HEX_TO_TYPE_ID_NAME.set(lowerHex, name);
  TYPE_ID_NAME_TO_HEX.set(name.toLowerCase(), lowerHex);
}

// ---------------------------------------------------------------------------
// Resolution — lookup type IDs by name or hex
// ---------------------------------------------------------------------------

/**
 * Resolve a raw bytes32 hex LSP1 type ID to its human-readable name.
 *
 * Exact match only (type IDs are always full 32-byte hashes, no prefix matching).
 * Case-insensitive.
 *
 * @param hex - Raw hex type ID (e.g., '0x429ac7a0...')
 * @returns Human-readable name (e.g., 'LSP7Tokens_SenderNotification') or `null` if unknown
 */
export function resolveTypeIdName(hex: string): string | null {
  return HEX_TO_TYPE_ID_NAME.get(hex.toLowerCase()) ?? null;
}

/**
 * Resolve a human-readable LSP1 type ID name to its raw bytes32 hex value.
 *
 * Case-insensitive. Returns `null` for unknown names.
 *
 * @param name - Human-readable type ID name (e.g., 'LSP7Tokens_SenderNotification')
 * @returns Hex type ID (e.g., '0x429ac7a0...') or `null` if unknown
 */
export function resolveTypeIdHex(name: string): string | null {
  return TYPE_ID_NAME_TO_HEX.get(name.toLowerCase()) ?? null;
}

// ---------------------------------------------------------------------------
// Existence checks
// ---------------------------------------------------------------------------

/**
 * Check whether a human-readable type ID name is registered.
 *
 * @param name - Human-readable type ID name
 * @returns `true` if the name is known
 */
export function isKnownTypeIdName(name: string): boolean {
  return TYPE_ID_NAME_TO_HEX.has(name.toLowerCase());
}

/**
 * Check whether a hex type ID is registered.
 *
 * @param hex - Raw hex type ID
 * @returns `true` if the hex type ID is known
 */
export function isKnownTypeIdHex(hex: string): boolean {
  return HEX_TO_TYPE_ID_NAME.has(hex.toLowerCase());
}

// ---------------------------------------------------------------------------
// Enumeration — list all known type IDs
// ---------------------------------------------------------------------------

/**
 * Get all known human-readable type ID names.
 *
 * @returns Array of known type ID names
 */
export function getKnownTypeIdNames(): string[] {
  return [...HEX_TO_TYPE_ID_NAME.values()];
}

/**
 * Get all known hex type IDs.
 *
 * @returns Array of known hex type IDs (lowercase)
 */
export function getKnownTypeIdHexes(): string[] {
  return [...HEX_TO_TYPE_ID_NAME.keys()];
}

/**
 * Get the total number of known type IDs.
 */
export function getTypeIdCount(): number {
  return HEX_TO_TYPE_ID_NAME.size;
}

/**
 * Get all known type IDs as `[hex, name]` pairs.
 *
 * @returns Array of `[hex, name]` tuples
 */
export function getTypeIdEntries(): [hex: string, name: string][] {
  return [...HEX_TO_TYPE_ID_NAME.entries()];
}
