import * as Utils from '@/utils';
import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { Aggregate3StaticReturn } from '@chillwhales/sqd-abi/lib/abi/Multicall3';
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

    const result: Aggregate3StaticReturn = [];
    let batchIndex = 0;
    const batchSize = 500;
    while (batchIndex * batchSize < unverifiedUniversalProfiles.length) {
      const verifiedCount = batchIndex * batchSize;
      const unverifiedCount = unverifiedUniversalProfiles.length - verifiedCount;
      const progress = {
        message: 'Verifing supported standards for Universal Profiles',
        ...LSP0ERC725Account.functions.supportsInterface.decode(callData),
        batchIndex,
        batchSize: Math.min(unverifiedCount, batchSize),
        verifiedCount,
        unverifiedCount,
        totalCount: unverifiedUniversalProfiles.length,
      };

      context.log.info(JSON.stringify(progress));
      result.push(
        ...(await Utils.Multicall3.aggregate3StaticLatest({
          context,
          calls: unverifiedUniversalProfiles
            .slice(verifiedCount, verifiedCount + progress.batchSize)
            .map((target) => ({
              target,
              allowFailure: true,
              callData,
            })),
        })),
      );

      batchIndex++;
      await Utils.timeout(1000);
    }

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
