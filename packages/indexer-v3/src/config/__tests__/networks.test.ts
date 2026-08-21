import { describe, expect, it } from 'vitest';
import {
  createNetworkSchema,
  createStreamId,
  getNetworkConfig,
  getNetworkKeys,
  NETWORKS,
} from '../networks.js';

describe('network registry', () => {
  it('defines the initial multi-chain catalog in stable order', () => {
    expect(getNetworkKeys()).toEqual(['lukso-mainnet', 'ethereum-mainnet', 'ethereum-sepolia']);
    expect(NETWORKS['lukso-mainnet'].chainId).toBe(42);
    expect(NETWORKS['ethereum-mainnet'].chainId).toBe(1);
    expect(NETWORKS['ethereum-sepolia'].chainId).toBe(11_155_111);
  });

  it('keeps chain IDs, stream IDs, and database schemas independent', () => {
    const networks = getNetworkKeys().map(getNetworkConfig);

    expect(new Set(networks.map((network) => network.chainId)).size).toBe(networks.length);
    expect(new Set(networks.map((network) => createStreamId(network.chainId))).size).toBe(
      networks.length,
    );
    expect(new Set(networks.map((network) => createNetworkSchema(network.key))).size).toBe(
      networks.length,
    );
  });

  it('creates stable EIP-155 cursor keys and safe schema names', () => {
    expect(createStreamId(42)).toBe('lsp-indexer:v3:eip155:42');
    expect(createNetworkSchema('ethereum-sepolia')).toBe('chain_ethereum_sepolia');
  });

  it('represents deployed contract capabilities without zero-address fallbacks', () => {
    expect(NETWORKS['lukso-mainnet'].contracts.lsp23Factory?.fromBlock).toBe(1_143_651);
    expect(NETWORKS['lukso-mainnet'].contracts.lsp26FollowerSystem?.fromBlock).toBe(3_179_471);
    expect(NETWORKS['ethereum-mainnet'].contracts.lsp23Factory?.fromBlock).toBe(20_217_894);
    expect(NETWORKS['ethereum-mainnet'].contracts.lsp26FollowerSystem?.fromBlock).toBe(25_505_856);
    expect(NETWORKS['ethereum-sepolia'].contracts.lsp23Factory).toBeDefined();
    expect(NETWORKS['ethereum-sepolia'].contracts.lsp26FollowerSystem).toBeUndefined();
  });

  it('deeply freezes exported network configurations', () => {
    const network = getNetworkConfig('lukso-mainnet');

    expect(Object.isFrozen(NETWORKS)).toBe(true);
    expect(Object.isFrozen(network)).toBe(true);
    expect(Object.isFrozen(network.nativeCurrency)).toBe(true);
    expect(Object.isFrozen(network.portal)).toBe(true);
    expect(Object.isFrozen(network.rpc)).toBe(true);
    expect(Object.isFrozen(network.contracts)).toBe(true);
    expect(Object.isFrozen(network.contracts.lsp23Factory)).toBe(true);
    expect(Object.isFrozen(network.contracts.lsp26FollowerSystem)).toBe(true);
    expect(Object.isFrozen(network.extensions)).toBe(true);

    expect(Reflect.set(network, 'chainId', 1)).toBe(false);
    expect(Reflect.set(network.rpc, 'defaultUrl', 'https://attacker.invalid')).toBe(false);
    expect(Reflect.set(network.extensions, '0', 'mutated')).toBe(false);
    expect(getNetworkConfig('lukso-mainnet').chainId).toBe(42);
    expect(getNetworkConfig('lukso-mainnet').rpc.defaultUrl).toBe(
      'https://rpc.mainnet.lukso.network',
    );
    expect(getNetworkConfig('lukso-mainnet').extensions).toEqual(['chillwhales']);
  });

  it('rejects unknown networks and unsafe schema keys', () => {
    expect(() => getNetworkConfig('polygon-mainnet')).toThrow(
      'Expected one of: lukso-mainnet, ethereum-mainnet, ethereum-sepolia',
    );
    expect(() => createNetworkSchema('Ethereum Mainnet')).toThrow('lowercase kebab case');
    expect(() => createNetworkSchema('../ethereum')).toThrow('lowercase kebab case');
    expect(() => createNetworkSchema('ethereum--mainnet')).toThrow('lowercase kebab case');
    expect(() => createNetworkSchema('ethereum-')).toThrow('lowercase kebab case');
    expect(() => createNetworkSchema('')).toThrow('lowercase kebab case');
  });
});
