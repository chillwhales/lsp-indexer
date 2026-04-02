/**
 * DataChanged event plugin.
 *
 * Handles the `DataChanged(bytes32,bytes)` event emitted by ERC725Y contracts
 * (both Universal Profiles and Digital Assets).
 *
 * Creates the raw `DataChanged` entity for every DataChanged event
 * (append-only event log).
 *
 * The emitting address is queued for verification as both UniversalProfile
 * and DigitalAsset (contract type cannot be determined at scan time).
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 *
 * Converted from factory function (`createDataChangedPlugin(registry)`) to
 * a plain export. The factory previously captured the PluginRegistry in a
 * closure for DataKey routing during extraction. DataKey routing is now
 * deferred to EntityHandlers (see #103: DataKey handler architecture).
 * As a plain export, this plugin is auto-discovered by PluginRegistry.discover().
 */
import { ERC725Y } from '@/abi';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { DataChanged } from '@/model';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DataChanged';

const DataChangedPlugin: EventPlugin = {
  name: 'dataChanged',
  topic0: ERC725Y.events.DataChanged.topic,
  supportedChains: ['lukso', 'ethereum', 'ethereum-sepolia'],
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

    const entity = new DataChanged({
      id: uuidv4(),
      network: ctx.network,
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      dataKey,
      dataValue,
      universalProfile: null,
      digitalAsset: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for both universalProfile and digitalAsset FKs
    // (contract type unknown at scan time)
    ctx.queueEnrichment<DataChanged>({
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
    ctx.queueEnrichment<DataChanged>({
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
  },
};

export default DataChangedPlugin;
