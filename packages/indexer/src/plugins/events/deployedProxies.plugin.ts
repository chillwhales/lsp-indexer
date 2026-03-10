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
 * The primaryContract address is queued for verification as a UniversalProfile.
 * FK resolution happens in the enrichment phase (Step 6 of pipeline).
 */
import { LSP23_ADDRESS } from '@/constants';
import { Block, EntityCategory, EventPlugin, IBatchContext, Log } from '@/core/types';
import { LSP23LinkedContractsFactory } from '@chillwhales/abi';
import {
  DeployedERC1167Proxies,
  PrimaryContractDeploymentInit,
  SecondaryContractDeploymentInit,
} from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'DeployedERC1167Proxies';

const DeployedProxiesPlugin: EventPlugin = {
  name: 'deployedProxies',
  topic0: LSP23LinkedContractsFactory.events.DeployedERC1167Proxies.topic,
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
      universalProfile: null,
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Queue enrichment for universalProfile FK (primaryContract is the deployed UP)
    ctx.queueEnrichment<DeployedERC1167Proxies>({
      category: EntityCategory.UniversalProfile,
      address: primaryContract,
      entityType: ENTITY_TYPE,
      entityId: entity.id,
      fkField: 'universalProfile',
      blockNumber: height,
      transactionIndex,
      logIndex,
    });
  },
};

export default DeployedProxiesPlugin;
