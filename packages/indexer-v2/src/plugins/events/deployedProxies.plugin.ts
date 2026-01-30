/**
 * DeployedERC1167Proxies (LSP23) event plugin.
 *
 * Handles the `DeployedERC1167Proxies(address,address,(bytes32,uint256,address,bytes),
 * (uint256,address,bytes,bool,bytes),address,bytes)` event emitted by the LSP23
 * LinkedContractsFactory when new ERC1167 proxy contracts are deployed.
 *
 * Contract-scoped: only processes logs from the LSP23 factory address
 * starting at block 1143651.
 *
 * This event does NOT trigger UP/DA verification — the deployed proxies
 * are recorded as-is. The nested struct fields (PrimaryContractDeploymentInit,
 * SecondaryContractDeploymentInit) are stored as JSONB columns.
 *
 * Port from v1:
 *   - scanner.ts L526-561 (inline extraction, no separate extract/populate)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP23LinkedContractsFactory } from '@chillwhales/abi';
import {
  DeployedERC1167Proxies,
  PrimaryContractDeploymentInit,
  SecondaryContractDeploymentInit,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { LSP23_ADDRESS } from '@/constants';
import { Block, EventPlugin, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DeployedERC1167Proxies';

const DeployedProxiesPlugin: EventPlugin = {
  name: 'deployedProxies',
  topic0: LSP23LinkedContractsFactory.events.DeployedERC1167Proxies.topic,
  contractFilter: { address: LSP23_ADDRESS, fromBlock: 1143651 },
  requiresVerification: [],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const {
      primaryContract,
      secondaryContract,
      primaryContractDeploymentInit,
      secondaryContractDeploymentInit,
      postDeploymentModule,
      postDeploymentModuleCalldata,
    } = LSP23LinkedContractsFactory.events.DeployedERC1167Proxies.decode(log);

    const entity = new DeployedERC1167Proxies({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      primaryContract,
      secondaryContract,
      primaryContractDeploymentInit: new PrimaryContractDeploymentInit(
        primaryContractDeploymentInit,
      ),
      secondaryContractDeploymentInit: new SecondaryContractDeploymentInit(
        secondaryContractDeploymentInit,
      ),
      postDeploymentModule,
      postDeploymentModuleCalldata,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE — No-op (no verification required)
  // ---------------------------------------------------------------------------

  populate(): void {
    // No verification or relational linking needed
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    const entities = ctx.getEntities<DeployedERC1167Proxies>(ENTITY_TYPE);
    if (entities.size === 0) return;

    await store.insert([...entities.values()]);
  },
};

export default DeployedProxiesPlugin;
