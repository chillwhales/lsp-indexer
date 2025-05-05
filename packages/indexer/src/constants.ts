const { RPC_URL } = process.env;
if (!RPC_URL) throw new Error('Missing `RPC_URL`');

export const GATEWAY = 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const RPC_ENDPOINT = {
  url: RPC_URL,
  rateLimit: 10,
};
export const FINALITY_CONFIRMATION = 75; // 15 mins to finality
export const MULTICALL_ADDRESS = '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869';
