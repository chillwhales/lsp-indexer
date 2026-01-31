/**
 * UniversalReceiver (LSP0) event plugin.
 *
 * Handles the `UniversalReceiver(address,uint256,bytes32,bytes,bytes)` event
 * emitted by Universal Profiles when they receive assets or notifications.
 *
 * The emitting address is tracked as a UniversalProfile candidate.
 * During populate, entities from unverified UPs are filtered out and
 * verified UPs are linked via the `universalProfile` relation.
 *
 * Port from v1:
 *   - scanner.ts L423-427 (event matching)
 *   - utils/universalReceiver/index.ts (extract + populate)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP0ERC725Account } from '@chillwhales/abi';
import { UniversalReceiver } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { insertEntities } from '@/core/persistHelpers';
import { populateByUP } from '@/core/populateHelpers';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'UniversalReceiver';

const UniversalReceiverPlugin: EventPlugin = {
  name: 'universalReceiver',
  topic0: LSP0ERC725Account.events.UniversalReceiver.topic,
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { from, value, typeId, receivedData, returnedValue } =
      LSP0ERC725Account.events.UniversalReceiver.decode(log);

    const entity = new UniversalReceiver({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      from,
      value,
      typeId,
      receivedData,
      returnedValue,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // The emitting address is a Universal Profile
    ctx.trackAddress(EntityCategory.UniversalProfile, address);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByUP<UniversalReceiver>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default UniversalReceiverPlugin;
