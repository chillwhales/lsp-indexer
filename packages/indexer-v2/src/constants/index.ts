import { isNumeric } from '@/utils';
import { config as dotenvSetup } from 'dotenv';

dotenvSetup();

export const SQD_GATEWAY =
  process.env.SQD_GATEWAY || 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const RPC_URL = process.env.RPC_URL || 'https://rpc.lukso.sigmacore.io';
export const RPC_RATE_LIMIT = isNumeric(process.env.RPC_RATE_LIMIT!)
  ? parseInt(process.env.RPC_RATE_LIMIT!)
  : 10;
export const FINALITY_CONFIRMATION = isNumeric(process.env.FINALITY_CONFIRMATION!)
  ? parseInt(process.env.FINALITY_CONFIRMATION!)
  : 75;

export const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://api.universalprofile.cloud/ipfs/';
export const FETCH_LIMIT = isNumeric(process.env.FETCH_LIMIT!)
  ? parseInt(process.env.FETCH_LIMIT!)
  : 10_000;
export const FETCH_BATCH_SIZE = isNumeric(process.env.FETCH_BATCH_SIZE!)
  ? parseInt(process.env.FETCH_BATCH_SIZE!)
  : 1_000;
export const FETCH_RETRY_COUNT = isNumeric(process.env.FETCH_RETRY_COUNT!)
  ? parseInt(process.env.FETCH_RETRY_COUNT!)
  : 5;

export const MULTICALL_ADDRESS = '0x144f4290051C2Ad2aCc9D7b6E8cC0dBe36644869';

export const LSP26_ADDRESS = '0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA';
export const LSP23_ADDRESS = '0x2300000A84D25dF63081feAa37ba6b62C4c89a30';

// LSP29 Data Keys
export * from './lsp29';
