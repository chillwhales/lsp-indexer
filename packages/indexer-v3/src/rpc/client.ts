import {
  createPublicClient,
  defineChain,
  http,
  type Address,
  type PublicClient,
  type Transport,
} from 'viem';
import type { ContractDeployment, NetworkContracts, RuntimeConfig } from '../config/index.js';

export type NetworkRpcClient = PublicClient<Transport>;

export type RpcChainReader = Pick<NetworkRpcClient, 'getChainId'>;

export type RpcReadinessClient = Pick<NetworkRpcClient, 'getChainId' | 'getCode'>;

export interface ConfiguredContractReadiness {
  name: keyof NetworkContracts;
  address: Address;
  fromBlock: number;
}

/** Create a block-capable RPC client for the configured EVM network. */
export function createNetworkRpcClient(runtime: RuntimeConfig): NetworkRpcClient {
  const chain = defineChain({
    id: runtime.network.chainId,
    name: runtime.network.displayName,
    nativeCurrency: runtime.network.nativeCurrency,
    rpcUrls: {
      default: { http: [runtime.rpcUrl] },
    },
  });

  return createPublicClient({
    chain,
    transport: http(runtime.rpcUrl, {
      batch: {
        batchSize: runtime.network.rpc.batchSize,
        wait: runtime.network.rpc.batchWaitMs,
      },
      retryCount: 3,
      timeout: 20_000,
    }),
  });
}

/** Fail before indexing if the RPC endpoint belongs to another network. */
export async function assertRpcChain(rpc: RpcChainReader, runtime: RuntimeConfig): Promise<number> {
  const actualChainId = await rpc.getChainId();
  if (actualChainId !== runtime.network.chainId) {
    throw new Error(
      `RPC chain mismatch: expected ${runtime.network.chainId}, received ${actualChainId}`,
    );
  }
  return actualChainId;
}

/** Fail before indexing if a configured well-known contract is absent from the selected chain. */
export async function assertConfiguredContracts(
  rpc: RpcReadinessClient,
  runtime: RuntimeConfig,
): Promise<ConfiguredContractReadiness[]> {
  const deployments: [keyof NetworkContracts, ContractDeployment | undefined][] = [
    ['lsp23Factory', runtime.network.contracts.lsp23Factory],
    ['lsp26FollowerSystem', runtime.network.contracts.lsp26FollowerSystem],
  ];

  const [multicallCode, contracts] = await Promise.all([
    rpc.getCode({ address: runtime.network.multicallAddress }),
    Promise.all(
      deployments.map(
        async ([name, deployment]): Promise<ConfiguredContractReadiness | undefined> => {
          if (!deployment) return undefined;

          const code = await rpc.getCode({ address: deployment.address });
          if (!code || code === '0x') {
            throw new Error(
              `Configured ${name} contract ${deployment.address} has no code on ${runtime.network.key}`,
            );
          }

          return {
            name,
            address: deployment.address,
            fromBlock: deployment.fromBlock,
          };
        },
      ),
    ),
  ]);

  if (!multicallCode || multicallCode === '0x') {
    throw new Error(
      `Configured Multicall3 contract ${runtime.network.multicallAddress} has no code on ${runtime.network.key}`,
    );
  }

  return contracts.filter((contract): contract is ConfiguredContractReadiness => contract != null);
}
