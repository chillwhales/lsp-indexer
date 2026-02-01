import { BlockData, DataHandlerContext, EvmBatchProcessor, Log } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';

/**
 * Subsquid framework type re-exports.
 *
 * These are thin wrappers around Subsquid's EVM processor types, pinned to our
 * FieldSelection configuration. Exporting them from a central location keeps
 * the codebase decoupled from Subsquid's internal type hierarchy.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FieldSelection {}

export type Processor = EvmBatchProcessor<FieldSelection>;

export type Block = BlockData<FieldSelection>;

export type Context = DataHandlerContext<Store, FieldSelection>;

export type { Log };
