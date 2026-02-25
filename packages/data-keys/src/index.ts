/**
 * @lsp-indexer/data-keys — ERC725Y data key registry.
 *
 * A self-contained bidirectional registry between hex ERC725Y data keys and
 * human-readable names. Pre-loaded with all known LUKSO LSP data keys
 * (LSP1–LSP12, LSP17). Zero external dependencies beyond zod for schemas.
 *
 * Consumers can register custom data keys via {@link registerDataKey}:
 *
 * ```ts
 * import { registerDataKey, resolveDataKeyName } from '@lsp-indexer/data-keys';
 *
 * registerDataKey('MyCustomKey', '0xabcd...');
 * resolveDataKeyName('0xabcd...'); // → 'MyCustomKey'
 * ```
 *
 * @module
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Built-in LUKSO LSP data keys — hardcoded name→hex pairs
// ---------------------------------------------------------------------------

/**
 * All built-in LUKSO LSP data key names as a const tuple.
 *
 * Provides TypeScript autocomplete for the {@link DataKeyName} union type.
 * Sorted alphabetically for readability.
 */
export const DATA_KEY_NAMES = [
  'AddressPermissions:AllowedCalls',
  'AddressPermissions:AllowedERC725YDataKeys',
  'AddressPermissions:Permissions',
  'AddressPermissions[].index',
  'AddressPermissions[].length',
  'AddressPermissionsPrefix',
  'LSP10Vaults[].index',
  'LSP10Vaults[].length',
  'LSP10VaultsMap',
  'LSP12IssuedAssets[].index',
  'LSP12IssuedAssets[].length',
  'LSP12IssuedAssetsMap',
  'LSP17ExtensionPrefix',
  'LSP1UniversalReceiverDelegate',
  'LSP1UniversalReceiverDelegatePrefix',
  'LSP3Profile',
  'LSP4Creators[].index',
  'LSP4Creators[].length',
  'LSP4CreatorsMap',
  'LSP4Metadata',
  'LSP4TokenName',
  'LSP4TokenSymbol',
  'LSP4TokenType',
  'LSP5ReceivedAssets[].index',
  'LSP5ReceivedAssets[].length',
  'LSP5ReceivedAssetsMap',
  'LSP8ReferenceContract',
  'LSP8TokenIdFormat',
  'LSP8TokenMetadataBaseURI',
  'SupportedStandards_LSP3',
  'SupportedStandards_LSP4',
  'SupportedStandards_LSP9',
] as const;

/**
 * Built-in name→hex mapping. Each entry is sourced from the official LUKSO
 * `@lukso/lsp*-contracts` packages (LSP1–LSP12, LSP17). Hardcoded here to
 * keep this package dependency-free.
 */
const BUILT_IN_DATA_KEYS: ReadonlyArray<readonly [name: string, hex: string]> = [
  ['AddressPermissions:AllowedCalls', '0x4b80742de2bf393a64c70000'],
  ['AddressPermissions:AllowedERC725YDataKeys', '0x4b80742de2bf866c29110000'],
  ['AddressPermissions:Permissions', '0x4b80742de2bf82acb3630000'],
  ['AddressPermissions[].index', '0xdf30dba06db6a30e65354d9a64c60986'],
  [
    'AddressPermissions[].length',
    '0xdf30dba06db6a30e65354d9a64c609861f089545ca58c6b4dbe31a5f338cb0e3',
  ],
  ['AddressPermissionsPrefix', '0x4b80742de2bf'],
  ['LSP10Vaults[].index', '0x55482936e01da86729a45d2b87a6b1d3'],
  ['LSP10Vaults[].length', '0x55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f06'],
  ['LSP10VaultsMap', '0x192448c3c0f88c7f238c0000'],
  ['LSP12IssuedAssets[].index', '0x7c8c3416d6cda87cd42c71ea1843df28'],
  [
    'LSP12IssuedAssets[].length',
    '0x7c8c3416d6cda87cd42c71ea1843df28ac4850354f988d55ee2eaa47b6dc05cd',
  ],
  ['LSP12IssuedAssetsMap', '0x74ac2555c10b9349e78f0000'],
  ['LSP17ExtensionPrefix', '0xcee78b4094da860110960000'],
  [
    'LSP1UniversalReceiverDelegate',
    '0x0cfc51aec37c55a4d0b1a65c6255c4bf2fbdf6277f3cc0730c45b828b6db8b47',
  ],
  ['LSP1UniversalReceiverDelegatePrefix', '0x0cfc51aec37c55a4d0b10000'],
  ['LSP3Profile', '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5'],
  ['LSP4Creators[].index', '0x114bd03b3a46d48759680d81ebb2b414'],
  ['LSP4Creators[].length', '0x114bd03b3a46d48759680d81ebb2b414fda7d030a7105a851867accf1c2352e7'],
  ['LSP4CreatorsMap', '0x6de85eaf5d982b4e5da00000'],
  ['LSP4Metadata', '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e'],
  ['LSP4TokenName', '0xdeba1e292f8ba88238e10ab3c7f88bd4be4fac56cad5194b6ecceaf653468af1'],
  ['LSP4TokenSymbol', '0x2f0a68ab07768e01943a599e73362a0e17a63a72e94dd2e384d2c1d4db932756'],
  ['LSP4TokenType', '0xe0261fa95db2eb3b5439bd033cda66d56b96f92f243a8228fd87550ed7bdfdb3'],
  ['LSP5ReceivedAssets[].index', '0x6460ee3c0aac563ccbf76d6e1d07bada'],
  [
    'LSP5ReceivedAssets[].length',
    '0x6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b',
  ],
  ['LSP5ReceivedAssetsMap', '0x812c4334633eb816c80d0000'],
  ['LSP8ReferenceContract', '0x708e7b881795f2e6b6c2752108c177ec89248458de3bf69d0d43480b3e5034e6'],
  ['LSP8TokenIdFormat', '0xf675e9361af1c1664c1868cfa3eb97672d6b1a513aa5b81dec34c9ee330e818d'],
  [
    'LSP8TokenMetadataBaseURI',
    '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843',
  ],
  ['SupportedStandards_LSP3', '0xeafec4d89fa9619884b600005ef83ad9559033e6e941db7d7c495acdce616347'],
  ['SupportedStandards_LSP4', '0xeafec4d89fa9619884b60000a4d96624a38f7ac2d8d9a604ecf07c12c77e480c'],
  ['SupportedStandards_LSP9', '0xeafec4d89fa9619884b600007c0334a14085fefa8b51ae5a40895018882bdb90'],
];

// ---------------------------------------------------------------------------
// Internal registry — bidirectional maps
// ---------------------------------------------------------------------------

/** Reverse map: lowercase hex → human-readable name */
const HEX_TO_NAME = new Map<string, string>();

/** Forward map: lowercase name → lowercase hex data key */
const NAME_TO_HEX = new Map<string, string>();

// Populate from built-in data keys at module load time
for (const [name, hex] of BUILT_IN_DATA_KEYS) {
  HEX_TO_NAME.set(hex.toLowerCase(), name);
  NAME_TO_HEX.set(name.toLowerCase(), hex.toLowerCase());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Union type of all built-in LUKSO LSP data key names.
 *
 * Provides autocomplete in TypeScript for filter fields. Custom keys registered
 * via {@link registerDataKey} are accepted at runtime via `(string & {})` widening.
 *
 * @example
 * ```ts
 * const name: DataKeyName = 'LSP3Profile'; // autocomplete works
 * const custom: DataKeyName = 'MyCustomKey'; // also valid (string & {})
 * ```
 */
export type DataKeyName = (typeof DATA_KEY_NAMES)[number] | (string & {});

// ---------------------------------------------------------------------------
// Registration — add custom data keys at runtime
// ---------------------------------------------------------------------------

/**
 * Register a custom ERC725Y data key.
 *
 * Adds a bidirectional mapping between a human-readable name and a hex data key.
 * Both directions (name→hex and hex→name) are registered. Lookups are
 * case-insensitive. If the name or hex already exists, it is overwritten.
 *
 * @param name - Human-readable data key name (e.g., 'MyAppSettings')
 * @param hex - Raw hex data key (e.g., '0xabcd1234...')
 *
 * @example
 * ```ts
 * import { registerDataKey, resolveDataKeyName } from '@lsp-indexer/data-keys';
 *
 * registerDataKey('MyAppSettings', '0xabcd1234...');
 * resolveDataKeyName('0xabcd1234...'); // → 'MyAppSettings'
 * ```
 */
export function registerDataKey(name: string, hex: string): void {
  HEX_TO_NAME.set(hex.toLowerCase(), name);
  NAME_TO_HEX.set(name.toLowerCase(), hex.toLowerCase());
}

/**
 * Register multiple custom ERC725Y data keys at once.
 *
 * Convenience wrapper around {@link registerDataKey} for bulk registration.
 *
 * @param entries - Array of `[name, hex]` tuples or an object mapping names to hex keys
 *
 * @example
 * ```ts
 * import { registerDataKeys } from '@lsp-indexer/data-keys';
 *
 * // Array form
 * registerDataKeys([
 *   ['MyAppSettings', '0xabcd...'],
 *   ['MyAppPermissions', '0x1234...'],
 * ]);
 *
 * // Object form
 * registerDataKeys({
 *   MyAppSettings: '0xabcd...',
 *   MyAppPermissions: '0x1234...',
 * });
 * ```
 */
export function registerDataKeys(
  entries: [name: string, hex: string][] | Record<string, string>,
): void {
  const pairs = Array.isArray(entries) ? entries : Object.entries(entries);
  for (const [name, hex] of pairs) {
    registerDataKey(name, hex);
  }
}

// ---------------------------------------------------------------------------
// Resolution — lookup data keys by name or hex
// ---------------------------------------------------------------------------

/**
 * Resolve a raw hex ERC725Y data key to its human-readable name.
 *
 * Case-insensitive. Returns `null` for unknown keys.
 *
 * @param hex - Raw hex data key (e.g., '0x5ef83ad9...')
 * @returns Human-readable name (e.g., 'LSP3Profile') or `null` if unknown
 */
export function resolveDataKeyName(hex: string): string | null {
  return HEX_TO_NAME.get(hex.toLowerCase()) ?? null;
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
 * @returns `true` if the name is known (built-in or custom-registered)
 */
export function isKnownDataKeyName(name: string): boolean {
  return NAME_TO_HEX.has(name.toLowerCase());
}

/**
 * Check whether a hex data key is registered.
 *
 * @param hex - Raw hex data key
 * @returns `true` if the hex key is known (built-in or custom-registered)
 */
export function isKnownDataKeyHex(hex: string): boolean {
  return HEX_TO_NAME.has(hex.toLowerCase());
}

// ---------------------------------------------------------------------------
// Enumeration — list all known data keys
// ---------------------------------------------------------------------------

/**
 * Get all registered human-readable data key names.
 *
 * Includes both built-in LUKSO LSP names and any custom-registered names.
 *
 * @returns Array of known data key names
 */
export function getKnownDataKeyNames(): string[] {
  return [...HEX_TO_NAME.values()];
}

/**
 * Get all registered hex data keys.
 *
 * @returns Array of known hex data keys (lowercase)
 */
export function getKnownDataKeyHexes(): string[] {
  return [...HEX_TO_NAME.keys()];
}

/**
 * Get the total number of registered data keys.
 */
export function getDataKeyCount(): number {
  return HEX_TO_NAME.size;
}

/**
 * Get all registered data keys as `[hex, name]` pairs.
 *
 * @returns Array of `[hex, name]` tuples
 */
export function getDataKeyEntries(): [hex: string, name: string][] {
  return [...HEX_TO_NAME.entries()];
}

// ---------------------------------------------------------------------------
// Schemas — Zod schemas for validation
// ---------------------------------------------------------------------------

/**
 * Zod enum schema for built-in LUKSO LSP data key names.
 *
 * Provides TypeScript autocomplete for the 32 built-in names. Use this
 * in filter schemas where `dataKeyName` should only accept known names.
 *
 * For runtime validation that also accepts custom-registered keys, use
 * {@link KnownDataKeyNameSchema} instead.
 */
export const DataKeyNameSchema = z.enum(DATA_KEY_NAMES);

/**
 * Schema that validates a string is a known data key name (built-in OR custom-registered).
 *
 * Uses `z.string().refine()` to check against the live registry at parse time.
 * Any keys registered via {@link registerDataKey} before parsing will be accepted.
 */
export const KnownDataKeyNameSchema = z.string().refine((val) => isKnownDataKeyName(val), {
  message: 'Unknown data key name — must be a registered ERC725Y key name',
});

/**
 * Schema that validates a string is a known hex data key.
 */
export const KnownDataKeyHexSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x')
  .refine((val) => isKnownDataKeyHex(val), {
    message: 'Unknown data key hex — must be a registered ERC725Y data key',
  });

/**
 * Schema for a single data key entry — the name↔hex pair.
 */
export const DataKeyEntrySchema = z.object({
  /** Human-readable data key name */
  name: z.string().min(1),
  /** Raw hex data key (must start with 0x) */
  hex: z.string().regex(/^0x[0-9a-fA-F]+$/, 'Must be a valid hex string starting with 0x'),
});

/**
 * Schema for bulk data key registration input.
 */
export const DataKeyEntriesSchema = z.array(DataKeyEntrySchema);

/** A single data key entry (name↔hex pair) */
export type DataKeyEntry = z.infer<typeof DataKeyEntrySchema>;

/** Array of data key entries for bulk registration */
export type DataKeyEntries = z.infer<typeof DataKeyEntriesSchema>;
