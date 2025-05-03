const { RPC_URL } = process.env;
if (!RPC_URL) throw new Error('Missing `RPC_URL`');

export const gateway = 'https://v2.archive.subsquid.io/network/lukso-mainnet';
export const rpcEndpoint = {
  url: RPC_URL,
  rateLimit: 10,
};
export const finalityConfirmation = 75; // 15 mins to finality
