/**
 * Decimals Entity Handler
 *
 * Reads the `decimals()` value for newly discovered Digital Assets via
 * Multicall3. When new Digital Assets are verified during the batch,
 * this handler calls `decimals()` on each one using the Multicall3 contract
 * for efficient batched RPC calls. The result is stored as a `Decimals`
 * entity linked to the Digital Asset.
 *
 * Behavior:
 *   - Listens to EntityCategory.DigitalAsset creation events
 *   - Batches `decimals()` calls via Multicall3.aggregate3Static (100 per batch)
 *   - Creates `Decimals` entities for assets that return a valid decimals value
 *   - Inserts new Decimals entities into the store (append-only)
 *   - Handles Multicall3 failures gracefully (some assets may not have decimals)
 *
 * Port from v1: packages/indexer/src/app/handlers/decimalsHandler.ts
 */

import { LSP7DigitalAsset } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { Decimals, DigitalAsset } from '@chillwhales/typeorm';
import { hexToNumber, isHex } from 'viem';

import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, EntityEvent, EntityHandler, HandlerContext } from '@/core/types';

const BATCH_SIZE = 100;

const DecimalsHandler: EntityHandler = {
  name: 'decimals',
  listensTo: [EntityCategory.DigitalAsset],
  events: [EntityEvent.Create],

  async handle(
    hctx: HandlerContext,
    triggeredBy: EntityCategory,
    _event: EntityEvent,
  ): Promise<void> {
    const { store, context, batchCtx } = hctx;

    // Get newly verified entities from the triggering category
    const newDAs = batchCtx.getVerified(triggeredBy).newEntities;
    if (newDAs.size === 0) return;

    const newDAsList = [...newDAs.values()];
    const newDecimalEntities: Decimals[] = [];

    const batchesCount = Math.ceil(newDAsList.length / BATCH_SIZE);

    // Process in batches of 100 (same as v1)
    for (let index = 0; index < batchesCount; index++) {
      const start = index * BATCH_SIZE;
      const batch = newDAsList.slice(start, start + BATCH_SIZE);

      let results: Aggregate3StaticReturn | undefined;
      try {
        results = await aggregate3StaticLatest(
          context,
          batch.map((da) => ({
            target: da.id,
            allowFailure: true,
            callData: LSP7DigitalAsset.functions.decimals.encode({}),
          })),
        );
      } catch {
        // Skip this batch — some assets won't get decimals
        continue;
      }

      results.forEach((result, i) => {
        const da = batch[i];

        if (result.success && isHex(result.returnData) && result.returnData !== '0x') {
          try {
            newDecimalEntities.push(
              new Decimals({
                id: da.id,
                address: da.id,
                digitalAsset: da as DigitalAsset,
                value: hexToNumber(result.returnData),
              }),
            );
          } catch (error) {
            // Skip this result if hexToNumber throws (e.g., value out of range)
            context.log.warn(
              JSON.stringify({
                message: 'Failed to parse decimals value',
                address: da.id,
                error: error instanceof Error ? error.message : String(error),
              }),
            );
          }
        }
      });
    }

    if (newDecimalEntities.length > 0) {
      context.log.info(
        JSON.stringify({
          message: "Inserting new 'Decimals' entities.",
          DecimalsEntitiesCount: newDecimalEntities.length,
        }),
      );

      await store.insert(newDecimalEntities);
    }
  },
};

export default DecimalsHandler;
