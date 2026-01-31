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
import { insertEntities } from '@/core/persistHelpers';
import { populateByUP } from '@/core/populateHelpers';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { decodeOperationType } from '@/utils';
import { ERC725X } from '@chillwhales/abi';
import { Executed } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';

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
    populateByUP<Executed>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default ExecutedPlugin;
