/**
 * LSP4TokenName entity handler.
 *
 * Subscribes to DataChanged events and creates LSP4TokenName entities
 * for events matching the LSP4TokenName data key. Decodes the hex-encoded
 * token name string from the data value.
 */
import { EntityCategory, EntityHandler } from '@/core/types';
import { LSP4TokenName } from '@chillwhales/typeorm';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { hexToString, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenName';

const LSP4_TOKEN_NAME_KEY: string = LSP4DataKeys.LSP4TokenName;

const LSP4TokenNameHandler: EntityHandler = {
  name: 'lsp4TokenName',
  listensToBag: ['DataChanged'],

  handle(hctx, _triggeredBy): void {
    const events = hctx.batchCtx.getEntities('DataChanged');

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP4_TOKEN_NAME_KEY) continue;

      // Create entity with decoded value
      const entity = new LSP4TokenName({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        value:
          !isHex(event.dataValue) || event.dataValue === '0x' ? null : hexToString(event.dataValue),
        rawValue: event.dataValue,
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<LSP4TokenName>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'digitalAsset',
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        timestamp: event.timestamp.getTime(),
      });
    }
  },
};

export default LSP4TokenNameHandler;
