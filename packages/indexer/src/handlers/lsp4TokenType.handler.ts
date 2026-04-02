/**
 * LSP4TokenType entity handler.
 *
 * Subscribes to DataChanged events and creates LSP4TokenType entities
 * for events matching the LSP4TokenType data key. Decodes the token type
 * enum value (0 = TOKEN, 1 = NFT, 2 = COLLECTION) from the data value.
 */
import { EntityCategory, EntityHandler } from '@/core/types';
import { LSP4TokenType, LSP4TokenTypeEnum } from '@/model';
import { decodeTokenType, safeHexToNumber } from '@/utils';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { isHex } from 'viem';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4TokenType';

const LSP4_TOKEN_TYPE_KEY: string = LSP4DataKeys.LSP4TokenType;

const LSP4TokenTypeHandler: EntityHandler = {
  name: 'lsp4TokenType',
  supportedChains: ['lukso', 'lukso-testnet'],
  listensToBag: ['DataChanged'],

  handle(hctx, _triggeredBy): void {
    const events = hctx.batchCtx.getEntities('DataChanged');

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP4_TOKEN_TYPE_KEY) continue;

      // Decode token type value (0 = TOKEN, 1 = NFT, 2 = COLLECTION)
      let value: LSP4TokenTypeEnum | null = null;
      if (isHex(event.dataValue) && event.dataValue !== '0x') {
        const typeNumber = safeHexToNumber(event.dataValue, {
          maxValue: 2,
          fallbackBehavior: 'null',
        });
        if (typeNumber !== null) {
          value = decodeTokenType(typeNumber);
        } else {
          hctx.context.log.warn(
            {
              step: 'HANDLE',
              handler: 'lsp4TokenType',
              address: event.address,
              dataValue:
                event.dataValue.length > 66
                  ? `${event.dataValue.slice(0, 66)}… (${event.dataValue.length} chars)`
                  : event.dataValue,
            },
            'Token type value out of range (expected 0-2)',
          );
        }
      }

      // Create entity with decoded value
      const entity = new LSP4TokenType({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        value,
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
        timestamp: event.timestamp.getTime(),
      });
    }
  },
};

export default LSP4TokenTypeHandler;
