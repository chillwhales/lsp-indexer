import type { RuntimeConfig } from '../config/index.js';
import {
  assertConfiguredContracts,
  assertRpcChain,
  createNetworkRpcClient,
  type ConfiguredContractReadiness,
  type RpcReadinessClient,
} from '../rpc/index.js';
import {
  assertPortalReadiness,
  fetchPortalMetadata,
  type PortalReadiness,
} from '../source/index.js';

export interface NetworkReadiness {
  network: string;
  chainId: number;
  streamId: string;
  databaseSchema: string;
  portal: PortalReadiness;
  rpcChainId: number;
  contracts: ConfiguredContractReadiness[];
}

export interface ReadinessDependencies {
  fetchImplementation?: typeof fetch;
  rpc?: RpcReadinessClient;
}

/** Verify Portal and RPC capabilities before handing control to a pipe program. */
export async function verifyNetworkReadiness(
  runtime: RuntimeConfig,
  dependencies: ReadinessDependencies = {},
): Promise<NetworkReadiness> {
  const rpc = dependencies.rpc ?? createNetworkRpcClient(runtime);
  const [portalMetadata, rpcChainId, contracts] = await Promise.all([
    fetchPortalMetadata(runtime.portalUrl, dependencies.fetchImplementation ?? fetch),
    assertRpcChain(rpc, runtime),
    assertConfiguredContracts(rpc, runtime),
  ]);

  return {
    network: runtime.network.key,
    chainId: runtime.network.chainId,
    streamId: runtime.streamId,
    databaseSchema: runtime.databaseSchema,
    portal: assertPortalReadiness(runtime, portalMetadata),
    rpcChainId,
    contracts,
  };
}
