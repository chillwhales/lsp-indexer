/**
 * UniversalReceiver (LSP0) event plugin.
 *
 * Handles the `UniversalReceiver(address,uint256,bytes32,bytes,bytes)` event
 * emitted by Universal Profiles when they receive assets or notifications.
 *
 * The emitting address is queued for verification as a UniversalProfile.
 * The from address is queued for verification as both UniversalProfile
 * and DigitalAsset (could be either type).
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 */
import { LSP0ERC725Account } from '@/abi';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { UniversalReceiver } from '@/model';
import { isNullAddress } from '@/utils';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'UniversalReceiver';

const UniversalReceiverPlugin: EventPlugin = {
  name: 'universalReceiver',
  topic0: LSP0ERC725Account.events.UniversalReceiver.topic,
  supportedChains: ['lukso', 'lukso-testnet'],
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { from, value, typeId, receivedData, returnedValue } =
      LSP0ERC725Account.events.UniversalReceiver.decode(log);

    const entity = new UniversalReceiver({
      id: uuidv4(),
      network: ctx.network,
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
      fromProfile: null,
      fromAsset: null,
      universalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for universalProfile FK (emitting address)
    ctx.queueEnrichment<UniversalReceiver>({
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

    // Queue enrichment for from address as both UP and DA
    // Skip null-ish addresses (zero/dead) to avoid wasteful RPC calls
    if (!isNullAddress(from)) {
      ctx.queueEnrichment<UniversalReceiver>({
        category: EntityCategory.UniversalProfile,
        address: from,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'fromProfile',
        blockNumber: height,
        transactionIndex,
        logIndex,
        timestamp,
      });
      ctx.queueEnrichment<UniversalReceiver>({
        category: EntityCategory.DigitalAsset,
        address: from,
        entityType: ENTITY_TYPE,
        entityId: entity.id,
        fkField: 'fromAsset',
        blockNumber: height,
        transactionIndex,
        logIndex,
        timestamp,
      });
    }
  },
};

export default UniversalReceiverPlugin;
