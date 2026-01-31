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

    // Get newly verified DigitalAsset entities from this batch
    const newDAs = batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities;
    if (newDAs.size === 0) return;

    const newDAsList = [...newDAs.values()] as DigitalAsset[];
    const newDecimalEntities: Decimals[] = [];
    let processedDigitalAssets = 0;

    const batchesCount = Math.ceil(newDAsList.length / BATCH_SIZE);

    // Process in batches of 100 (same as v1)
    for (let index = 0; index < batchesCount; index++) {
      const start = index * BATCH_SIZE;
      const batch = newDAsList.slice(start, start + BATCH_SIZE);

      const results = await aggregate3StaticLatest(
        context,
        batch.map((digitalAsset) => ({
          target: digitalAsset.address,
          allowFailure: true,
          callData: LSP7DigitalAsset.functions.decimals.encode({}),
        })),
      );

      results.forEach((result) => {
        if (result.success && isHex(result.returnData) && result.returnData !== '0x') {
          newDecimalEntities.push(
            new Decimals({
              id: newDAsList[processedDigitalAssets].address,
              address: newDAsList[processedDigitalAssets].address,
              digitalAsset: newDAsList[processedDigitalAssets],
              value: hexToNumber(result.returnData),
            }),
          );
        }

        processedDigitalAssets++;
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
