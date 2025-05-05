import { Multicall3 } from '@chillwhales/sqd-abi';
import { LSP4TokenTypeEnum, LSP8TokenIdFormatEnum, OperationType } from '@chillwhales/sqd-typeorm';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { hexToNumber } from 'viem';
import { MULTICALL_ADDRESS } from './constants';

export function generateTokenId({ address, tokenId }: { address: string; tokenId: string }) {
  return `${address} - ${tokenId}`;
}

export function decodeOperationType(operationType: bigint) {
  return operationType === 0n
    ? OperationType.CALL
    : operationType === 1n
      ? OperationType.CREATE
      : operationType === 2n
        ? OperationType.CREATE2
        : operationType === 3n
          ? OperationType.DELEGATECALL
          : operationType === 4n
            ? OperationType.STATICCALL
            : null;
}

export function decodeTokenType(tokenType: number) {
  return tokenType === 0
    ? LSP4TokenTypeEnum.TOKEN
    : tokenType === 1
      ? LSP4TokenTypeEnum.NFT
      : tokenType === 2
        ? LSP4TokenTypeEnum.COLLECTION
        : null;
}

export function decodeTokenIdFormat(tokenIdFormat: number) {
  return [0, 100].includes(tokenIdFormat)
    ? LSP8TokenIdFormatEnum.NUMBER
    : [1, 101].includes(tokenIdFormat)
      ? LSP8TokenIdFormatEnum.STRING
      : [2, 102].includes(tokenIdFormat)
        ? LSP8TokenIdFormatEnum.ADDRESS
        : [3, 4, 103, 104].includes(tokenIdFormat)
          ? LSP8TokenIdFormatEnum.BYTES32
          : null;
}

export async function getLatestBlockNumber({
  context,
}: {
  context: DataHandlerContext<Store, {}>;
}) {
  return hexToNumber(await context._chain.client.call('eth_blockNumber', []));
}

export async function aggregate3Static({
  context,
  calls,
  block,
}: {
  context: DataHandlerContext<Store, {}>;
  block?: { height: number };
} & Multicall3.Aggregate3StaticParams): Promise<Multicall3.Aggregate3StaticReturn> {
  if (!block)
    block = {
      height: await getLatestBlockNumber({ context }),
    };

  const contract = new Multicall3.Contract(context, block, MULTICALL_ADDRESS);
  const result = await contract.aggregate3Static(calls);

  return result;
}
