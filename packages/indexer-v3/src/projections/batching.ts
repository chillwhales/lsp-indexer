export const MAX_MULTICALL_BATCH_SIZE = 500;

/** Split a read plan into bounded sequential Multicall requests without reordering calls. */
export function createMulticallBatches<T>(values: readonly T[]): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += MAX_MULTICALL_BATCH_SIZE) {
    batches.push(values.slice(index, index + MAX_MULTICALL_BATCH_SIZE));
  }
  return batches;
}
