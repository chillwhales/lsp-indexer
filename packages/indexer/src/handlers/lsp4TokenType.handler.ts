/**
 * LSP4TokenType entity handler.
 *
 * Subscribes to DataChanged events and creates LSP4TokenType entities
 * for events matching the LSP4TokenType data key. Decodes the token type
 * enum value (0 = TOKEN, 1 = NFT, 2 = COLLECTION) from the data value.
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { decodeTokenType } from '@/utils';
import { LSP4TokenType } from '@chillwhales/typeorm';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { hexToNumber, isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenType';

const LSP4_TOKEN_TYPE_KEY: string = LSP4DataKeys.LSP4TokenType;

const LSP4TokenTypeHandler: EntityHandler = {
  name: 'lsp4TokenType',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities('DataChanged');

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP4_TOKEN_TYPE_KEY) continue;

      // Create entity with decoded value
      const entity = new LSP4TokenType({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        value:
          !isHex(event.dataValue) || event.dataValue === '0x'
            ? null
            : decodeTokenType(hexToNumber(event.dataValue)),
        rawValue: event.dataValue,
        digitalAsset: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for digitalAsset FK
      hctx.batchCtx.queueEnrichment<LSP4TokenType>({
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

export default LSP4TokenTypeHandler;
