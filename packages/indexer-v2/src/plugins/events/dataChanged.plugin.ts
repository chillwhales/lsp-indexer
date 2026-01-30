/**
 * DataChanged meta-plugin (router).
 *
 * Handles the `DataChanged(bytes32,bytes)` event emitted by ERC725Y contracts
 * (both Universal Profiles and Digital Assets).
 *
 * This plugin has two responsibilities:
 *   1. Creates the raw `DataChanged` entity for every DataChanged event
 *      (append-only event log, same as v1).
 *   2. Routes the decoded `dataKey` to the appropriate DataKeyPlugin via
 *      the PluginRegistry, delegating sub-entity extraction.
 *
 * Because the plugin needs access to the PluginRegistry for dataKey routing,
 * it uses a factory function (`createDataChangedPlugin`) that captures the
 * registry in a closure.
 *
 * Tracked addresses:
 *   - `log.address` → both UniversalProfile and DigitalAsset candidates
 *     (cannot determine contract type at scan time)
 *
 * Port from v1:
 *   - scanner.ts L166-421 (DataChanged case block + dataKey switch/if-else)
 *   - utils/dataChanged/index.ts (extract + populate)
 */
import { v4 as uuidv4 } from 'uuid';

import { ERC725Y } from '@chillwhales/abi';
import { DataChanged } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { insertEntities, populateByUPAndDA } from '@/core/pluginHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  IBatchContext,
  IPluginRegistry,
  Log,
} from '@/core/types';

// Entity type key used in the BatchContext entity bag
const DATA_CHANGED_TYPE = 'DataChanged';

/**
 * Factory function that creates the DataChanged event plugin.
 *
 * The registry is captured in closure so the plugin can route dataKeys
 * to DataKeyPlugins during extraction.
 */
export function createDataChangedPlugin(registry: IPluginRegistry): EventPlugin {
  return {
    name: 'dataChanged',
    topic0: ERC725Y.events.DataChanged.topic,
    requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

    // -------------------------------------------------------------------------
    // Phase 1: EXTRACT
    // -------------------------------------------------------------------------

    extract(log: Log, block: Block, ctx: IBatchContext): void {
      const { timestamp, height } = block.header;
      const { address, logIndex, transactionIndex } = log;
      const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);

      // 1. Always create the raw DataChanged entity (append-only event log)
      const entity = new DataChanged({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
        transactionIndex,
        address,
        dataKey,
        dataValue,
      });

      ctx.addEntity(DATA_CHANGED_TYPE, entity.id, entity);

      // 2. Track emitting address as both UP and DA candidates
      //    (cannot distinguish contract type at scan time)
      ctx.trackAddress(EntityCategory.UniversalProfile, address);
      ctx.trackAddress(EntityCategory.DigitalAsset, address);

      // 3. Route to the matching DataKeyPlugin (if any)
      const dataKeyPlugin = registry.getDataKeyPlugin(dataKey);
      if (dataKeyPlugin) {
        dataKeyPlugin.extract(log, dataKey, dataValue, block, ctx);
      }
    },

    // -------------------------------------------------------------------------
    // Phase 3: POPULATE
    // -------------------------------------------------------------------------

    populate(ctx: IBatchContext): void {
      populateByUPAndDA<DataChanged>(ctx, DATA_CHANGED_TYPE);

      // DataKeyPlugins handle their own populate — they are called
      // by the pipeline via registry.getActivePlugins()
    },

    // -------------------------------------------------------------------------
    // Phase 4: PERSIST
    // -------------------------------------------------------------------------

    async persist(store: Store, ctx: IBatchContext): Promise<void> {
      await insertEntities(store, ctx, DATA_CHANGED_TYPE);

      // DataKeyPlugins handle their own persist — they are called
      // by the pipeline via registry.getActivePlugins()
    },
  };
}

export default createDataChangedPlugin;
