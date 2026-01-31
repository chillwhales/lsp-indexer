/**
 * DeployedContracts (LSP23) event plugin.
 *
 * Handles the `DeployedContracts(address,address,(bytes32,uint256,bytes),
 * (uint256,bytes,bool,bytes),address,bytes)` event emitted by the LSP23
 * LinkedContractsFactory when new contracts are deployed via CREATE.
 *
 * Contract-scoped: only processes logs from the LSP23 factory address
 * starting at block 1143651.
 *
 * This event does NOT trigger UP/DA verification — the deployed contracts
 * are recorded as-is. The nested struct fields (PrimaryContractDeployment,
 * SecondaryContractDeployment) are stored as JSONB columns.
 *
 * Port from v1:
 *   - scanner.ts L491-524 (inline extraction, no separate extract/populate)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP23LinkedContractsFactory } from '@chillwhales/abi';
import {
  DeployedContracts,
  PrimaryContractDeployment,
  SecondaryContractDeployment,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { LSP23_ADDRESS } from '@/constants';
import { insertEntities } from '@/core/persistHelpers';
import { Block, EventPlugin, IBatchContext, Log } from '@/core/types';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DeployedContracts';

const DeployedContractsPlugin: EventPlugin = {
  name: 'deployedContracts',
  topic0: LSP23LinkedContractsFactory.events.DeployedContracts.topic,
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
      primaryContractDeployment,
      secondaryContractDeployment,
      postDeploymentModule,
      postDeploymentModuleCalldata,
    } = LSP23LinkedContractsFactory.events.DeployedContracts.decode(log);

    const entity = new DeployedContracts({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      primaryContract,
      secondaryContract,
      primaryContractDeployment: new PrimaryContractDeployment(primaryContractDeployment),
      secondaryContractDeployment: new SecondaryContractDeployment(secondaryContractDeployment),
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
    await insertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default DeployedContractsPlugin;
