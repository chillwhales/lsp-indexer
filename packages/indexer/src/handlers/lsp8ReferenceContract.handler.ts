/**
 * LSP8ReferenceContract entity handler.
 *
 * Subscribes to DataChanged events and creates LSP8ReferenceContract entities
 * for events matching the LSP8ReferenceContract data key. Stores the raw hex
 * reference contract address value.
 */
import { getTypedEntities } from '@/core/entityTypeMap';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { LSP8ReferenceContract } from '@chillwhales/typeorm';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8ReferenceContract';

const LSP8_REFERENCE_CONTRACT_KEY: string = LSP8DataKeys.LSP8ReferenceContract;

const LSP8ReferenceContractHandler: EntityHandler = {
  name: 'lsp8ReferenceContract',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = getTypedEntities(hctx.batchCtx, 'DataChanged');

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP8_REFERENCE_CONTRACT_KEY) continue;

      // Create entity with raw value
      const entity = new LSP8ReferenceContract({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        value: !isHex(event.dataValue) || event.dataValue === '0x' ? null : event.dataValue,
        rawValue: event.dataValue,
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<LSP8ReferenceContract>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'digitalAsset',
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
      });
    }
  },
};

export default LSP8ReferenceContractHandler;
