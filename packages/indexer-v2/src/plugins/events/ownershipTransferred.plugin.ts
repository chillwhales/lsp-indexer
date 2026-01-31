/**
 * OwnershipTransferred (LSP14) event plugin.
 *
 * Handles the `OwnershipTransferred(address,address)` event emitted by
 * Universal Profiles and Digital Assets when ownership changes.
 *
 * The emitting address is tracked as BOTH a UniversalProfile and DigitalAsset
 * candidate (either type can emit this event).
 *
 * The `handle()` phase upserts `UniversalProfileOwner` and `DigitalAssetOwner`
 * records to track the current owner of each contract.
 *
 * Port from v1:
 *   - scanner.ts L563-568 (event matching)
 *   - utils/ownershipTransferred/index.ts (extract + populate)
 *   - handlers/ownershipTransferredHandler.ts (owner record upsert)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP14Ownable2Step } from '@chillwhales/abi';
import {
  DigitalAssetOwner,
  OwnershipTransferred,
  UniversalProfileOwner,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { insertEntities } from '@/core/persistHelpers';
import { populateByUPAndDA } from '@/core/populateHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  HandlerContext,
  IBatchContext,
  Log,
} from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'OwnershipTransferred';

const OwnershipTransferredPlugin: EventPlugin = {
  name: 'ownershipTransferred',
  topic0: LSP14Ownable2Step.events.OwnershipTransferred.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { previousOwner, newOwner } = LSP14Ownable2Step.events.OwnershipTransferred.decode(log);

    const entity = new OwnershipTransferred({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      previousOwner,
      newOwner,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // The emitting address could be either a UP or a DA
    ctx.trackAddress(EntityCategory.UniversalProfile, address);
    ctx.trackAddress(EntityCategory.DigitalAsset, address);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByUPAndDA<OwnershipTransferred>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE — Update owner records
  // ---------------------------------------------------------------------------

  async handle(hctx: HandlerContext): Promise<void> {
    const entities = hctx.batchCtx.getEntities<OwnershipTransferred>(ENTITY_TYPE);
    if (entities.size === 0) return;

    const upOwners = new Map<string, UniversalProfileOwner>();
    const daOwners = new Map<string, DigitalAssetOwner>();

    for (const entity of entities.values()) {
      if (entity.universalProfile) {
        upOwners.set(
          entity.address,
          new UniversalProfileOwner({
            id: entity.address,
            timestamp: entity.timestamp,
            address: entity.newOwner,
            universalProfile: entity.universalProfile,
          }),
        );
      }
      if (entity.digitalAsset) {
        daOwners.set(
          entity.address,
          new DigitalAssetOwner({
            id: entity.address,
            timestamp: entity.timestamp,
            address: entity.newOwner,
            digitalAsset: entity.digitalAsset,
          }),
        );
      }
    }

    if (upOwners.size > 0) {
      await hctx.store.upsert([...upOwners.values()]);
    }
    if (daOwners.size > 0) {
      await hctx.store.upsert([...daOwners.values()]);
    }
  },
};

export default OwnershipTransferredPlugin;
