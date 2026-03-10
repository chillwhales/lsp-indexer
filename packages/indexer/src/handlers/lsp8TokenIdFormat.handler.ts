/**
 * LSP8TokenIdFormat entity handler.
 *
 * Subscribes to DataChanged events and creates LSP8TokenIdFormat entities
 * for events matching the LSP8TokenIdFormat data key. Decodes the token ID
 * encoding format (0 = NUMBER, 1 = STRING, 2 = ADDRESS, 3/4 = BYTES32).
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { decodeTokenIdFormat } from '@/utils';
import { LSP8TokenIdFormat } from '@chillwhales/typeorm';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { hexToNumber, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP8TokenIdFormat';

const LSP8_TOKEN_ID_FORMAT_KEY: string = LSP8DataKeys.LSP8TokenIdFormat;

const LSP8TokenIdFormatHandler: EntityHandler = {
  name: 'lsp8TokenIdFormat',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities('DataChanged');

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP8_TOKEN_ID_FORMAT_KEY) continue;

      // Create entity with decoded value
      const entity = new LSP8TokenIdFormat({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        value:
          !isHex(event.dataValue) || event.dataValue === '0x'
            ? null
            : decodeTokenIdFormat(hexToNumber(event.dataValue)),
        rawValue: event.dataValue,
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<LSP8TokenIdFormat>({
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

export default LSP8TokenIdFormatHandler;
