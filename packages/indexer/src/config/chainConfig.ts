// ---------------------------------------------------------------------------
// Chain Configuration Registry
// ---------------------------------------------------------------------------
// Typed, per-chain configuration that replaces hardcoded LUKSO constants.
// Every chain the indexer supports must have an entry in CHAIN_CONFIGS.
// ---------------------------------------------------------------------------

/**
 * Static configuration for a single EVM chain supported by the indexer.
 *
 * All values that were previously scattered across `constants/index.ts` as
 * top-level exports are now grouped per-chain so the indexer can be started
 * with `CHAIN_ID=lukso` or `CHAIN_ID=ethereum`.
 */
export interface ChainConfig {
  /** Unique slug used as the `network` column value, e.g. `'lukso'` */
  id: string;
  /** Human-readable network name stored on entities */
  network: string;
  /** JSON-RPC endpoint */
  rpcUrl: string;
  /** Max RPC requests per second */
  rpcRateLimit: number;
  /** Blocks to wait before considering a block final */
  finalityConfirmation: number;
  /** Subsquid archive gateway URL (optional — testnet has none per D017) */
  gateway?: string;
  /** Multicall3 contract address for batch calls */
  multicallAddress: string;
  /** IPFS gateway base URL */
  ipfsGateway: string;
  /** Well-known contract addresses deployed on this chain */
  contracts: {
    lsp26Address: string;
    lsp23Address: string;
    lsp23FromBlock: number;
    lsp26FromBlock: number;
  };
}

// ---------------------------------------------------------------------------
// Chain definitions
// ---------------------------------------------------------------------------

export const LUKSO_MAINNET: ChainConfig = {
  id: 'lukso',
  network: 'lukso',
  rpcUrl: 'https://rpc.lukso.sigmacore.io',
  rpcRateLimit: 10,
  finalityConfirmation: 75,
  gateway: 'https://v2.archive.subsquid.io/network/lukso-mainnet',
  multicallAddress: '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869',
  ipfsGateway: 'https://api.universalprofile.cloud/ipfs/',
  contracts: {
    lsp26Address: '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA',
    lsp23Address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
    lsp23FromBlock: 0,
    lsp26FromBlock: 0,
  },
};

export const ETHEREUM_MAINNET: ChainConfig = {
  id: 'ethereum',
  network: 'ethereum',
  rpcUrl: 'https://eth.drpc.org',
  rpcRateLimit: 10,
  finalityConfirmation: 12,
  gateway: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
  multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  ipfsGateway: 'https://ipfs.io/ipfs/',
  contracts: {
    lsp26Address: '0x0000000000000000000000000000000000000000',
    // CREATE2 via Nick Factory — same address on every EVM chain
    lsp23Address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
    lsp23FromBlock: 0,
    lsp26FromBlock: 0,
  },
};

export const ETHEREUM_SEPOLIA: ChainConfig = {
  id: 'ethereum-sepolia',
  network: 'ethereum-sepolia',
  rpcUrl: 'https://sepolia.drpc.org',
  rpcRateLimit: 10,
  finalityConfirmation: 12,
  gateway: 'https://v2.archive.subsquid.io/network/ethereum-sepolia',
  multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  ipfsGateway: 'https://ipfs.io/ipfs/',
  contracts: {
    lsp26Address: '0x0000000000000000000000000000000000000000',
    // CREATE2 via Nick Factory — same address on every EVM chain
    lsp23Address: '0x2300000A84D25dF63081feAa37ba6b62C4c89a30',
    lsp23FromBlock: 0,
    lsp26FromBlock: 0,
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All known chain configurations keyed by their `id` slug. */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  lukso: LUKSO_MAINNET,
  ethereum: ETHEREUM_MAINNET,
  'ethereum-sepolia': ETHEREUM_SEPOLIA,
};

/**
 * Look up a chain configuration by its id slug.
 *
 * @param chainId - The chain identifier, e.g. `'lukso'` or `'ethereum'`.
 * @returns The matching {@link ChainConfig}.
 * @throws {Error} If `chainId` is not present in the registry.
 */
export function getChainConfig(chainId: string): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    const available = Object.keys(CHAIN_CONFIGS).join(', ');
    throw new Error(
      `Unknown CHAIN_ID "${chainId}". Available chains: ${available}`,
    );
  }
  return config;
}
