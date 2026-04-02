/**
 * UniversalProfileOwner Entity Handler (postVerification).
 *
 * Creates UniversalProfileOwner entities from OwnershipTransferred events
 * where the emitting address is a verified UniversalProfile.
 *
 * Runs in Step 5.5 (post-verification) because it needs verification results
 * to determine if the emitting address is a valid UniversalProfile.
 *
 * Behavior:
 *   - postVerification: true — runs after Step 5 (VERIFY), not Step 3
 *   - Listens to OwnershipTransferred bag
 *   - Reads OwnershipTransferred entities from BatchContext
 *   - Checks if event.address is a verified UniversalProfile
 *   - Creates UniversalProfileOwner with id=event.address, address=newOwner
 *   - Uses Map for deduplication (last-writer-wins)
 *   - Queues enrichment for universalProfile FK
 */

import { EntityCategory, EntityHandler } from '@/core/types';
import { UniversalProfileOwner } from '@/model';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'UniversalProfileOwner';

const UniversalProfileOwnerHandler: EntityHandler = {
  name: 'universalProfileOwner',
  supportedChains: ['lukso', 'lukso-testnet'],
  listensToBag: ['OwnershipTransferred'],
  postVerification: true,

  handle(hctx, _triggeredBy): void {
    const { batchCtx } = hctx;

    // Read OwnershipTransferred entities from the batch
    const events = batchCtx.getEntities('OwnershipTransferred');
    if (events.size === 0) return;

    // Get verified UniversalProfiles
    const verifiedUPs = batchCtx.getVerified(EntityCategory.UniversalProfile);

    // Map for deduplication (last-writer-wins)
    const owners = new Map<string, UniversalProfileOwner>();

    for (const event of events.values()) {
      // Check if the emitting address is a verified UniversalProfile
      if (!verifiedUPs.valid.has(event.address)) continue;

      const entity = new UniversalProfileOwner({
        id: event.address,
        timestamp: event.timestamp,
        blockNumber: event.blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        address: event.newOwner,
        universalProfile: null, // FK initially null — resolved by enrichment queue
      });

      // Deduplicate by address (last-writer-wins)
      owners.set(event.address, entity);

      // Queue enrichment for universalProfile FK
      batchCtx.queueEnrichment<UniversalProfileOwner>({
        category: EntityCategory.UniversalProfile,
        address: event.address,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'universalProfile',
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

export default UniversalProfileOwnerHandler;
