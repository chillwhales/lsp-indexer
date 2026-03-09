/**
 * Executed (ERC725X) event plugin.
 *
 * Handles the `Executed(uint256,address,uint256,bytes4)` event emitted
 * by Universal Profiles when they execute operations via ERC725X.
 *
 * The emitting address is queued for verification as a UniversalProfile.
 * The target address is queued for verification as both UniversalProfile
 * and DigitalAsset (could be either type).
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 */
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { decodeOperationType, isNullAddress } from '@/utils';
import { ERC725X } from '@chillwhales/abi';
import { Executed } from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'Executed';

const ExecutedPlugin: EventPlugin = {
  name: 'executed',
  topic0: ERC725X.events.Executed.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
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
      targetProfile: null,
      targetAsset: null,
      universalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for universalProfile FK (emitting address)
    ctx.queueEnrichment<Executed>({
      category: EntityCategory.UniversalProfile,
      address,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'universalProfile',
      blockNumber: 0,
      transactionIndex: 0,
      logIndex: 0,
    });

    // Queue enrichment for target address as both UP and DA
    // Skip null-ish addresses (zero/dead) to avoid wasteful RPC calls
    if (!isNullAddress(target)) {
      ctx.queueEnrichment<Executed>({
        category: EntityCategory.UniversalProfile,
        address: target,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'targetProfile',
        blockNumber: 0,
        transactionIndex: 0,
        logIndex: 0,
      });
      ctx.queueEnrichment<Executed>({
        category: EntityCategory.DigitalAsset,
        address: target,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'targetAsset',
        blockNumber: 0,
        transactionIndex: 0,
        logIndex: 0,
      });
    }
  },
};

export default ExecutedPlugin;
