/**
 * OwnershipTransferred (LSP14) event plugin.
 *
 * Handles the `OwnershipTransferred(address,address)` event emitted by
 * Universal Profiles and Digital Assets when ownership changes.
 *
 * The emitting address is queued for verification as both UniversalProfile
 * and DigitalAsset (either type can emit this event).
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 *
 * UniversalProfileOwner and DigitalAssetOwner updates will be implemented
 * as EntityHandlers in future issues (see #105: Transfer-derived entity handlers).
 */
import { LSP14Ownable2Step } from '@/abi';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { OwnershipTransferred } from '@/model';
import { isNullAddress } from '@/utils';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'OwnershipTransferred';

const OwnershipTransferredPlugin: EventPlugin = {
  name: 'ownershipTransferred',
  topic0: LSP14Ownable2Step.events.OwnershipTransferred.topic,
  supportedChains: ['lukso', 'ethereum', 'ethereum-sepolia'],
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { previousOwner, newOwner } = LSP14Ownable2Step.events.OwnershipTransferred.decode(log);

    const entity = new OwnershipTransferred({
      id: uuidv4(),
      network: ctx.network,
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      previousOwner,
      newOwner,
      previousOwnerProfile: null,
      newOwnerProfile: null,
      universalProfile: null,
      digitalAsset: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for both universalProfile and digitalAsset FKs
    // (either type can emit this event)
    ctx.queueEnrichment<OwnershipTransferred>({
      category: EntityCategory.UniversalProfile,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'universalProfile',
      blockNumber: height,
      transactionIndex,
      logIndex,
      timestamp,
    });
    ctx.queueEnrichment<OwnershipTransferred>({
      category: EntityCategory.DigitalAsset,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'digitalAsset',
      blockNumber: height,
      transactionIndex,
      logIndex,
      timestamp,
    });

    // Queue enrichment for previousOwner and newOwner UniversalProfile FKs
    // Skip null-ish addresses (zero/dead) to avoid wasteful RPC calls
    if (!isNullAddress(previousOwner)) {
      ctx.queueEnrichment<OwnershipTransferred>({
        category: EntityCategory.UniversalProfile,
        address: previousOwner,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'previousOwnerProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
        timestamp,
      });
    }
    if (!isNullAddress(newOwner)) {
      ctx.queueEnrichment<OwnershipTransferred>({
        category: EntityCategory.UniversalProfile,
        address: newOwner,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'newOwnerProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
        timestamp,
      });
    }
  },
};

export default OwnershipTransferredPlugin;
