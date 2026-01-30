/**
 * Executed (ERC725X) event plugin.
 *
 * Handles the `Executed(uint256,address,uint256,bytes4)` event emitted
 * by Universal Profiles when they execute operations via ERC725X.
 *
 * The emitting address is tracked as a UniversalProfile candidate.
 * During populate, entities from unverified UPs are filtered out and
 * verified UPs are linked via the `universalProfile` relation.
 *
 * Port from v1:
 *   - scanner.ts L160-163 (event matching)
 *   - utils/executed/index.ts (extract + populate)
 */
import { v4 as uuidv4 } from 'uuid';

import { ERC725X } from '@chillwhales/abi';
import { Executed, UniversalProfile } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { decodeOperationType } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Executed';

const ExecutedPlugin: EventPlugin = {
  name: 'executed',
  topic0: ERC725X.events.Executed.topic,
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { operationType, value, target, selector } = ERC725X.events.Executed.decode(log);

    const entity = new Executed({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      decodedOperationType: decodeOperationType(operationType),
      operationType,
      value,
      target,
      selector,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // The emitting address is a Universal Profile
    ctx.trackAddress(EntityCategory.UniversalProfile, address);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    const entities = ctx.getEntities<Executed>(ENTITY_TYPE);

    for (const [id, entity] of entities) {
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.address)) {
        // Link to the verified Universal Profile
        entity.universalProfile = new UniversalProfile({ id: entity.address });
      } else {
        // Emitting address is not a verified UP — remove the entity
        ctx.removeEntity(ENTITY_TYPE, id);
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    const entities = ctx.getEntities<Executed>(ENTITY_TYPE);
    if (entities.size === 0) return;

    await store.insert([...entities.values()]);
  },
};

export default ExecutedPlugin;
