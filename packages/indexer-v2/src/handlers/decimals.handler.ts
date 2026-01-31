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
import { Decimals, DigitalAsset } from '@chillwhales/typeorm';
import { hexToNumber, isHex } from 'viem';

import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';

const BATCH_SIZE = 100;

const DecimalsHandler: EntityHandler = {
  name: 'decimals',
  listensTo: [EntityCategory.DigitalAsset],

  async handle(hctx: HandlerContext): Promise<void> {
    const { store, context, batchCtx } = hctx;

    // Get newly verified DigitalAsset entities from this batch.
    // newEntities is typed as Map<string, { id: string }> but the verification
    // system creates DigitalAsset instances for EntityCategory.DigitalAsset.
    const newDAs = batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities;
    if (newDAs.size === 0) return;

    const newDAsList = [...newDAs.values()];
    const newDecimalEntities: Decimals[] = [];

    const batchesCount = Math.ceil(newDAsList.length / BATCH_SIZE);

    // Process in batches of 100 (same as v1)
    for (let index = 0; index < batchesCount; index++) {
      const start = index * BATCH_SIZE;
      const batch = newDAsList.slice(start, start + BATCH_SIZE);

      let results;
      try {
        results = await aggregate3StaticLatest(
          context,
          batch.map((da) => ({
            target: (da as DigitalAsset).address ?? da.id,
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
        const address = (da as DigitalAsset).address ?? da.id;

        if (result.success && isHex(result.returnData) && result.returnData !== '0x') {
          newDecimalEntities.push(
            new Decimals({
              id: address,
              address,
              digitalAsset: da as DigitalAsset,
              value: hexToNumber(result.returnData),
            }),
          );
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
