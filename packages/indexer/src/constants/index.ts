import { config as dotenvSetup } from 'dotenv';

dotenvSetup();

const { RPC_URL } = process.env;
if (!RPC_URL) throw new Error('Missing `RPC_URL`');

export const SQD_GATEWAY =
  process.env.SQD_GATEWAY || 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const RPC_ENDPOINT = {
  url: RPC_URL,
  rateLimit: 10,
};
export const FINALITY_CONFIRMATION = 75; // 15 mins to finality
export const MULTICALL_ADDRESS = '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869';
export const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://api.universalprofile.cloud/ipfs/';

export const CHILLWHALES_ADDRESS = '0x86e817172b5c07f7036bf8aa46e2db9063743a83';
export const CHILL_ADDRESS = '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14';
export const ORBS_ADDRESS = '0x4200690033c5Ea89c936d247876f89f40A588b4D';
