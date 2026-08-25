import type { Transformer } from '@subsquid/pipes';
import type { RuntimeConfig } from '../config/index.js';
import { decodeEventBatch, type EventIngestionBatch } from './decode.js';
import { createEventIngestionQuery, type EventIngestionData } from './query.js';

/** Build the query-aware Pipes transform that emits normalized raw event batches. */
export function createEventIngestionOutput(
  runtime: RuntimeConfig,
): Transformer<EventIngestionData, EventIngestionBatch> {
  return createEventIngestionQuery(runtime)
    .build()
    .pipe({
      profiler: { name: 'LSP raw event decode' },
      transform(data): EventIngestionBatch {
        return decodeEventBatch(runtime, data);
      },
    });
}
