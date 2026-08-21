import type { Address } from 'viem';

export interface NativeCurrencyConfig {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface PortalConfig {
  readonly dataset: string;
  readonly url: string;
  readonly expectedRealtime: boolean;
}

export interface RpcConfig {
  readonly environmentVariable: string;
  readonly defaultUrl: string;
  readonly batchSize: number;
  readonly batchWaitMs: number;
}

export interface ContractDeployment {
  readonly address: Address;
  readonly fromBlock: number;
}

export interface NetworkContracts {
  readonly lsp23Factory?: ContractDeployment;
  readonly lsp26FollowerSystem?: ContractDeployment;
}

export interface NetworkConfig {
  readonly key: string;
  readonly chainId: number;
  readonly displayName: string;
  readonly nativeCurrency: NativeCurrencyConfig;
  readonly startBlock: number;
  readonly finalityConfirmations: number;
  readonly portal: PortalConfig;
  readonly rpc: RpcConfig;
  readonly multicallAddress: Address;
  readonly ipfsGateway: string;
  readonly contracts: NetworkContracts;
  readonly extensions: readonly string[];
}

function freezeNetworkConfig(config: NetworkConfig): void {
  Object.freeze(config.nativeCurrency);
  Object.freeze(config.portal);
  Object.freeze(config.rpc);
  for (const deployment of Object.values(config.contracts)) {
    Object.freeze(deployment);
  }
  Object.freeze(config.contracts);
  Object.freeze(config.extensions);
  Object.freeze(config);
}

const NETWORK_DEFINITIONS = {
  'lukso-mainnet': {
    key: 'lukso-mainnet',
    chainId: 42,
    displayName: 'LUKSO Mainnet',
    nativeCurrency: {
      name: 'LUKSO',
      symbol: 'LYX',
      decimals: 18,
    },
    startBlock: 0,
    finalityConfirmations: 75,
    portal: {
      dataset: 'lukso-mainnet',
      url: 'https://portal.sqd.dev/datasets/lukso-mainnet',
      expectedRealtime: false,
    },
    rpc: {
      environmentVariable: 'RPC_URL_LUKSO_MAINNET',
      defaultUrl: 'https://rpc.mainnet.lukso.network',
      batchSize: 100,
      batchWaitMs: 20,
    },
    multicallAddress: '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs/',
    contracts: {
      lsp23Factory: {
        address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
        fromBlock: 1_143_651,
      },
      lsp26FollowerSystem: {
        address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
        fromBlock: 3_179_471,
      },
    },
    extensions: ['chillwhales'],
  },
  'ethereum-mainnet': {
    key: 'ethereum-mainnet',
    chainId: 1,
    displayName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    startBlock: 0,
    finalityConfirmations: 12,
    portal: {
      dataset: 'ethereum-mainnet',
      url: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
      expectedRealtime: true,
    },
    rpc: {
      environmentVariable: 'RPC_URL_ETHEREUM_MAINNET',
      defaultUrl: 'https://ethereum-rpc.publicnode.com',
      batchSize: 100,
      batchWaitMs: 20,
    },
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ipfsGateway: 'https://ipfs.io/ipfs/',
    contracts: {
      lsp23Factory: {
        address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
        fromBlock: 20_217_894,
      },
      lsp26FollowerSystem: {
        address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
        fromBlock: 25_505_856,
      },
    },
    extensions: [],
  },
  'ethereum-sepolia': {
    key: 'ethereum-sepolia',
    chainId: 11155111,
    displayName: 'Ethereum Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    startBlock: 0,
    finalityConfirmations: 12,
    portal: {
      dataset: 'ethereum-sepolia',
      url: 'https://portal.sqd.dev/datasets/ethereum-sepolia',
      expectedRealtime: true,
    },
    rpc: {
      environmentVariable: 'RPC_URL_ETHEREUM_SEPOLIA',
      defaultUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
      batchSize: 100,
      batchWaitMs: 20,
    },
    multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ipfsGateway: 'https://ipfs.io/ipfs/',
    contracts: {
      lsp23Factory: {
        address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
        fromBlock: 0,
      },
    },
    extensions: [],
  },
} satisfies Record<string, NetworkConfig>;

for (const network of Object.values(NETWORK_DEFINITIONS)) {
  freezeNetworkConfig(network);
}

export type NetworkKey = keyof typeof NETWORK_DEFINITIONS;

export const NETWORKS: Readonly<Record<NetworkKey, NetworkConfig>> =
  Object.freeze(NETWORK_DEFINITIONS);

const NETWORK_REGISTRY: ReadonlyMap<string, NetworkConfig> = new Map(
  Object.entries(NETWORK_DEFINITIONS),
);

/** Return all configured network keys in stable declaration order. */
export function getNetworkKeys(): string[] {
  return [...NETWORK_REGISTRY.keys()];
}

/** Resolve a network or throw with the supported keys. */
export function getNetworkConfig(key: string): NetworkConfig {
  const network = NETWORK_REGISTRY.get(key);
  if (!network) {
    throw new Error(
      `Unknown INDEXER_NETWORK "${key}". Expected one of: ${getNetworkKeys().join(', ')}`,
    );
  }
  return network;
}

/** Stable Pipes cursor key for a network. */
export function createStreamId(chainId: number): string {
  return `lsp-indexer:v3:eip155:${chainId}`;
}

function isLowercaseAlphanumeric(value: string): boolean {
  if (value.length === 0) return false;

  for (const character of value) {
    const code = character.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isLowercaseLetter = code >= 97 && code <= 122;
    if (!isDigit && !isLowercaseLetter) return false;
  }

  return true;
}

/** Safe PostgreSQL schema name for a configured network. */
export function createNetworkSchema(networkKey: string): string {
  if (!networkKey.split('-').every(isLowercaseAlphanumeric)) {
    throw new Error(`Network key "${networkKey}" is not lowercase kebab case`);
  }
  return `chain_${networkKey.replaceAll('-', '_')}`;
}
