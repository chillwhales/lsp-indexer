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
 * The primaryContract address is queued for verification as a UniversalProfile.
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 */
import { LSP23_ADDRESS } from '@/constants';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { LSP23LinkedContractsFactory } from '@/abi';
import {
  DeployedContracts,
  PrimaryContractDeployment,
  SecondaryContractDeployment,
} from '@/model';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DeployedContracts';

const DeployedContractsPlugin: EventPlugin = {
  name: 'deployedContracts',
  topic0: LSP23LinkedContractsFactory.events.DeployedContracts.topic,
  contractFilter: { address: LSP23_ADDRESS, fromBlock: 1143651 },
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // EXTRACT
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
      universalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for universalProfile FK (primaryContract is the deployed UP)
    ctx.queueEnrichment<DeployedContracts>({
      category: EntityCategory.UniversalProfile,
      address: primaryContract,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'universalProfile',
      blockNumber: height,
      transactionIndex,
      logIndex,
      timestamp,
    });
  },
};

export default DeployedContractsPlugin;
