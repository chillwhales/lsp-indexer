import * as Utils from '@/utils';
import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile } from '@chillwhales/sqd-typeorm';
import { INTERFACE_ID_LSP0 } from '@lukso/lsp0-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';

const calldatasByInterfaceId = [
  LSP0ERC725Account.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP0,
  }),
];

interface VerifyParams {
  context: DataHandlerContext<Store, {}>;
  universalProfiles: Set<string>;
}

export async function verify({ context, universalProfiles }: VerifyParams): Promise<{
  newUniversalProfiles: Map<string, UniversalProfile>;
  validUniversalProfiles: Map<string, UniversalProfile>;
  invalidUniversalProfiles: Map<string, UniversalProfile>;
}> {
  const addressArray = [...universalProfiles];
  const knownUniversalProfiles: Map<string, UniversalProfile> = await context.store
    .findBy(UniversalProfile, { id: In(addressArray) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  if (addressArray.length === knownUniversalProfiles.size)
    return {
      newUniversalProfiles: new Map(),
      validUniversalProfiles: knownUniversalProfiles,
      invalidUniversalProfiles: new Map(),
    };

  let unverifiedUniversalProfiles = addressArray.filter(
    (address) => !knownUniversalProfiles.has(address),
  );
  const newUniversalProfiles = new Map<string, UniversalProfile>();

  for (const callData of calldatasByInterfaceId) {
    if (unverifiedUniversalProfiles.length === 0) continue;

    const result = await Utils.Multicall3.aggregate3StaticLatest({
      context,
      calls: unverifiedUniversalProfiles.map((target) => ({
        target,
        allowFailure: true,
        callData,
      })),
    });

    unverifiedUniversalProfiles.forEach((address, index) => {
      if (
        result[index].success &&
        isHex(result[index].returnData) &&
        hexToBool(result[index].returnData)
      )
        newUniversalProfiles.set(address, new UniversalProfile({ id: address, address }));
    });

    unverifiedUniversalProfiles = unverifiedUniversalProfiles.filter(
      (address) => !newUniversalProfiles.has(address),
    );
  }

  return {
    newUniversalProfiles,
    validUniversalProfiles: new Map(
      addressArray
        .filter(
          (address) => knownUniversalProfiles.has(address) || newUniversalProfiles.has(address),
        )
        .map((address) => [address, new UniversalProfile({ id: address, address })]),
    ),
    invalidUniversalProfiles: new Map(
      addressArray
        .filter(
          (address) => !knownUniversalProfiles.has(address) && !newUniversalProfiles.has(address),
        )
        .map((address) => [address, new UniversalProfile({ id: address, address })]),
    ),
  };
}
