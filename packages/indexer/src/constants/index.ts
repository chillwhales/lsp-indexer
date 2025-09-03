import { isNumeric } from '@/utils';
import { config as dotenvSetup } from 'dotenv';

dotenvSetup();

export const SQD_GATEWAY =
  process.env.SQD_GATEWAY || 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const RPC_URL = process.env.RPC_URL || 'https://rpc.lukso.sigmacore.io';
export const RPC_RATE_LIMIT = isNumeric(process.env.RPC_RATE_LIMIT)
  ? parseInt(process.env.RPC_RATE_LIMIT)
  : 10;
export const FINALITY_CONFIRMATION = isNumeric(process.env.FINALITY_CONFIRMATION)
  ? parseInt(process.env.FINALITY_CONFIRMATION)
  : 75; // 15 mins to finality

export const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://api.universalprofile.cloud/ipfs/';
export const FETCH_LIMIT = isNumeric(process.env.FETCH_LIMIT)
  ? parseInt(process.env.FETCH_LIMIT)
  : 10_000;
export const FETCH_BATCH_SIZE = isNumeric(process.env.FETCH_BATCH_SIZE)
  ? parseInt(process.env.FETCH_BATCH_SIZE)
  : 1_000;
export const FETCH_RETRY_COUNT = isNumeric(process.env.FETCH_RETRY_COUNT)
  ? parseInt(process.env.FETCH_RETRY_COUNT)
  : 5;

export const MULTICALL_ADDRESS = '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869';

export const CHILLWHALES_ADDRESS = '0x86e817172b5c07f7036bf8aa46e2db9063743a83';
export const CHILL_ADDRESS = '0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14';
export const ORBS_ADDRESS = '0x4200690033c5Ea89c936d247876f89f40A588b4D';
