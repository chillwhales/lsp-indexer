/**
 * DigitalAssetOwner Entity Handler (postVerification).
 *
 * Creates DigitalAssetOwner entities from OwnershipTransferred events
 * where the emitting address is a verified DigitalAsset.
 *
 * Runs in Step 5.5 (post-verification) because it needs verification results
 * to determine if the emitting address is a valid DigitalAsset.
 *
 * Behavior:
 *   - postVerification: true — runs after Step 5 (VERIFY), not Step 3
 *   - Listens to OwnershipTransferred bag
 *   - Reads OwnershipTransferred entities from BatchContext
 *   - Checks if event.address is a verified DigitalAsset
 *   - Creates DigitalAssetOwner with id=event.address, address=newOwner
 *   - Uses Map for deduplication (last-writer-wins)
 *   - Queues enrichment for digitalAsset FK
 */

import { EntityCategory, EntityHandler } from '@/core/types';
import { DigitalAssetOwner } from '@chillwhales/typeorm';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DigitalAssetOwner';

const DigitalAssetOwnerHandler: EntityHandler = {
  name: 'digitalAssetOwner',
  listensToBag: ['OwnershipTransferred'],
  postVerification: true,

  // eslint-disable-next-line @typescript-eslint/require-await
  async handle(hctx, _triggeredBy): Promise<void> {
    const { batchCtx } = hctx;

    // Read OwnershipTransferred entities from the batch
    const events = batchCtx.getEntities('OwnershipTransferred');
    if (events.size === 0) return;

    // Get verified DigitalAssets
    const verifiedDAs = batchCtx.getVerified(EntityCategory.DigitalAsset);

    // Map for deduplication (last-writer-wins)
    const owners = new Map<string, DigitalAssetOwner>();

    for (const event of events.values()) {
      // Check if the emitting address is a verified DigitalAsset
      if (!verifiedDAs.valid.has(event.address)) continue;

      const entity = new DigitalAssetOwner({
        id: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        address: event.newOwner,
        digitalAsset: null, // FK initially null — resolved by enrichment queue
      });

      // Deduplicate by address (last-writer-wins)
      owners.set(event.address, entity);

      // Queue enrichment for digitalAsset FK
      batchCtx.queueEnrichment<DigitalAssetOwner>({
        category: EntityCategory.DigitalAsset,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'digitalAsset',
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp.getTime(),
      });
    }

    // Add all entities to BatchContext
    for (const entity of owners.values()) {
      batchCtx.addEntity(ENTITY_TYPE, entity.id, entity);
    }
  },
};

export default DigitalAssetOwnerHandler;
