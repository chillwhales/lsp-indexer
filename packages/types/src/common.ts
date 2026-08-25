import { z } from 'zod';

// ---------------------------------------------------------------------------
// Multi-chain identity and provenance
// ---------------------------------------------------------------------------

/** Stable configured network key (for example `lukso-mainnet`). */
export const NetworkIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase network slug');

/** EIP-155 chain ID represented as a JavaScript safe integer. */
export const ChainIdSchema = z.number().int().positive().safe();

/** Lowercase or checksummed EVM address. Parsers normalize it to lowercase. */
export const AddressSchema = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i, 'Expected a 20-byte EVM address')
  .transform((value) => value.toLowerCase());

/** A canonical 32-byte EVM hash. Parsers normalize it to lowercase. */
export const HashSchema = z
  .string()
  .regex(/^0x[0-9a-f]{64}$/i, 'Expected a 32-byte EVM hash')
  .transform((value) => value.toLowerCase());

/** A lossless hexadecimal byte string. Parsers normalize it to lowercase. */
export const HexSchema = z
  .string()
  .regex(/^0x(?:[0-9a-f]{2})*$/i, 'Expected an even-length hexadecimal byte string')
  .transform((value) => value.toLowerCase());

export const TimestampSchema = z.string().datetime({ offset: true });

export const NetworkRefSchema = z.object({
  network: NetworkIdSchema,
  chainId: ChainIdSchema,
});

/** Network selection required by every v3 package request. */
export const NetworkInputSchema = z.object({
  network: NetworkIdSchema,
});

export const BlockRefSchema = NetworkRefSchema.extend({
  blockNumber: z.number().int().nonnegative().safe(),
  blockHash: HashSchema,
  timestamp: TimestampSchema,
});

export const EventRefSchema = BlockRefSchema.extend({
  transactionHash: HashSchema,
  transactionIndex: z.number().int().nonnegative().safe(),
  logIndex: z.number().int().nonnegative().safe(),
});

/** Provenance shared by mutable v3 read models. */
export const ProjectionRefSchema = NetworkRefSchema.extend({
  lastBlockNumber: z.number().int().nonnegative().safe(),
  lastBlockHash: HashSchema,
  lastTransactionHash: HashSchema.nullable(),
  lastTransactionIndex: z.number().int().nonnegative().safe().nullable(),
  lastLogIndex: z.number().int().nonnegative().safe().nullable(),
});

export const VerificationStatusSchema = z.enum(['unknown', 'verified', 'invalid']);

export const PaginationSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

export const SortDirectionSchema = z.enum(['asc', 'desc']);

export const SortNullsSchema = z.enum(['first', 'last']);

// ---------------------------------------------------------------------------
// Metadata schemas
// ---------------------------------------------------------------------------

export const ImageSchema = z.object({
  url: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  verification: z
    .object({
      method: z.string(),
      data: z.string(),
    })
    .nullable(),
});

export const LinkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

/** Asset file (3D model, media) — has `fileType` but no width/height, unlike images. */
export const AssetSchema = z.object({
  url: z.string(),
  /** MIME type or extension (e.g., "fbx", "model/gltf+json") */
  fileType: z.string(),
  verification: z
    .object({
      method: z.string(),
      data: z.string(),
    })
    .nullable(),
});

export const Lsp4AttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
  /** e.g., "string", "number", "date" */
  type: z.string(),
  /** Numeric score derived from the attribute (chillwhales-specific) */
  score: z.number().nullable().optional().default(null),
  /** Rarity score for this attribute across the collection (chillwhales-specific) */
  rarity: z.number().nullable().optional().default(null),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type SortNulls = z.infer<typeof SortNullsSchema>;
export type NetworkId = z.infer<typeof NetworkIdSchema>;
export type NetworkRef = z.infer<typeof NetworkRefSchema>;
export type NetworkInput = z.infer<typeof NetworkInputSchema>;
export type BlockRef = z.infer<typeof BlockRefSchema>;
export type EventRef = z.infer<typeof EventRefSchema>;
export type ProjectionRef = z.infer<typeof ProjectionRefSchema>;
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type Lsp4Attribute = z.infer<typeof Lsp4AttributeSchema>;
export type Asset = z.infer<typeof AssetSchema>;
