/**
 * Decimals Entity Handler (postVerification).
 *
 * Reads the `decimals()` value for newly verified Digital Assets via
 * Multicall3. Runs in Step 5.5 (post-verification) because it needs
 * the list of newly created DigitalAsset entities from the verify phase.
 *
 * Behavior:
 *   - postVerification: true — runs after Step 5 (VERIFY), not Step 3
 *   - Listens to transfer + data-change bag keys as a scheduling hint
 *   - Reads newly verified DAs from batchCtx.getVerified(EntityCategory.DigitalAsset)
 *   - Batches `decimals()` calls via Multicall3.aggregate3Static (100 per batch)
 *   - Creates Decimals entities in BatchContext + queues enrichment for digitalAsset FK
 *   - Handles Multicall3 failures gracefully (some assets may not have decimals)
 */

import { aggregate3StaticLatest } from '@/core/multicall';
import { EntityCategory, EntityHandler } from '@/core/types';
import { safeHexToNumber } from '@/utils';
import { LSP7DigitalAsset } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { Decimals } from '@chillwhales/typeorm';
import { isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Decimals';

// Multicall3 batch size
const BATCH_SIZE = 100;

const DecimalsHandler: EntityHandler = {
  name: 'decimals',
  listensToBag: ['LSP7Transfer', 'LSP8Transfer', 'DataChanged'],
  postVerification: true,

  async handle(hctx, _triggeredBy): Promise<void> {
    const { context, batchCtx } = hctx;

    // Read newly verified Digital Assets from the verification phase
    const newDAs = batchCtx.getVerified(EntityCategory.DigitalAsset).newEntities;
    if (newDAs.size === 0) return;

    const newDAsList = [...newDAs.values()];
    const batchesCount = Math.ceil(newDAsList.length / BATCH_SIZE);

    // Process in batches of 100
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
      } catch (error) {
        // Skip this batch — some assets won't get decimals
        context.log.warn(
          {
            step: 'HANDLE',
            handler: 'decimals',
            batchIndex: index,
            batchSize: batch.length,
            error: error instanceof Error ? error.message : String(error),
          },
          'Multicall3 batch failed for decimals, skipping batch',
        );
        continue;
      }

      results.forEach((result, i) => {
        const da = batch[i];

        if (result.success && isHex(result.returnData) && result.returnData !== '0x') {
          try {
            // decimals() returns uint8 (0-255); throws if out of range or invalid hex
            const decimalsValue = safeHexToNumber(result.returnData, { maxValue: 255 });

            const entity = new Decimals({
              id: da.id,
              address: da.id,
              timestamp: da.timestamp,
              blockNumber: da.blockNumber,
              transactionIndex: da.transactionIndex,
              logIndex: da.logIndex,
              digitalAsset: null, // FK initially null — resolved by enrichment queue
              value: decimalsValue,
            });

            // Add to BatchContext — pipeline persists in Step 5.5 persist phase
            batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

            // Queue enrichment for digitalAsset FK
            batchCtx.queueEnrichment<Decimals>({
              category: EntityCategory.DigitalAsset,
              address: da.id,
              entityType: ENTITY_TYPE,
              entityId: entity.id,
              fkField: 'digitalAsset',
              blockNumber: entity.blockNumber,
              transactionIndex: entity.transactionIndex,
              logIndex: entity.logIndex,
              timestamp: entity.timestamp.getTime(),
            });
          } catch (error) {
            // Skip this result if safeHexToNumber throws (invalid hex or value > 255)
            context.log.warn(
              {
                step: 'HANDLE',
                handler: 'decimals',
                address: da.id,
                returnData: result.returnData,
                error: error instanceof Error ? error.message : String(error),
              },
              'Failed to parse decimals value',
            );
          }
        }
      });
    }
  },
};

export default DecimalsHandler;
