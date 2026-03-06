/**
 * LSP3Profile entity handler.
 *
 * Subscribes to DataChanged events and creates LSP3Profile entities for events
 * matching the LSP3Profile data key. Decodes the VerifiableURI from the data
 * value to get a metadata URL.
 *
 * The metadata fetch handler (issue #53) will later fetch the URL and populate
 * sub-entities (names, descriptions, images, etc.). This handler only creates
 * the main LSP3Profile entity with `isDataFetched: false`.
 *
 * Note: clearSubEntities logic is deferred to the metadata fetch handler since
 * that handler re-creates the sub-entities.
 *
 * Port from v1:
 *   - plugins/datakeys/lsp3Profile.plugin.ts (extract + populate + persist)
 *   - utils/dataChanged/lsp3Profile.ts (extract logic)
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { decodeVerifiableUri } from '@/utils';
import { DataChanged, LSP3Profile } from '@chillwhales/typeorm';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP3Profile';

const LSP3_DATA_KEY: string = LSP3DataKeys.LSP3Profile;

const LSP3ProfileHandler: EntityHandler = {
  name: 'lsp3Profile',
  listensToBag: ['DataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const events = hctx.batchCtx.getEntities<DataChanged>(triggeredBy);

    for (const event of events.values()) {
      // Filter by data key
      if (event.dataKey !== LSP3_DATA_KEY) continue;

      // Decode VerifiableURI
      const { value: url, decodeError } = decodeVerifiableUri(event.dataValue);

      // Create entity (deterministic id = address)
      const entity = new LSP3Profile({
        id: event.address,
        address: event.address,
        timestamp: event.timestamp,
        url,
        rawValue: event.dataValue,
        decodeError,
        isDataFetched: false,
        retryCount: 0,
        universalProfile: null, // FK initially null
      });

      // Add to BatchContext
      hctx.batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);

      // Queue enrichment for universalProfile FK
      hctx.batchCtx.queueEnrichment<LSP3Profile>({
        category: EntityCategory.UniversalProfile,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'universalProfile',
      });
    }
  },
};

export default LSP3ProfileHandler;
