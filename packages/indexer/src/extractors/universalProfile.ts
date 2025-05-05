import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile } from '@chillwhales/sqd-typeorm';
import { INTERFACE_ID_LSP0 } from '@lukso/lsp0-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';
import { aggregate3Static, getLatestBlockNumber } from '../utils';

interface CustomParams {
  context: DataHandlerContext<Store, {}>;
  addressSet: Set<string>;
}

export async function extractUniversalProfiles({
  context,
  addressSet,
}: CustomParams): Promise<UniversalProfile[]> {
  const addressArray = [...addressSet];
  const knownUniversalProfiles: Map<string, UniversalProfile> = await context.store
    .findBy(UniversalProfile, { id: In(addressArray) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  if (addressArray.length === knownUniversalProfiles.size) return [];

  const block = {
    height: await getLatestBlockNumber({ context }),
  };

  const unverifiedUniversalProfiles = addressArray
    .filter((value) => !knownUniversalProfiles.has(value))
    .map((value) => ({
      target: value,
      allowFailure: true,
      callData: LSP0ERC725Account.functions.supportsInterface.encode({
        interfaceId: INTERFACE_ID_LSP0,
      }),
    }));

  const result = await aggregate3Static({ context, block, calls: unverifiedUniversalProfiles });

  const newUniversalProfiles = unverifiedUniversalProfiles
    .map(({ target }, index) =>
      result[index].success &&
      isHex(result[index].returnData) &&
      hexToBool(result[index].returnData)
        ? new UniversalProfile({ id: target, address: target })
        : null,
    )
    .filter((value) => value !== null);

  return newUniversalProfiles;
}
