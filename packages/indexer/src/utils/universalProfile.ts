import * as Utils from '@/utils';
import { LSP0ERC725Account } from '@chillwhales/abi';
import { Aggregate3StaticReturn } from '@chillwhales/abi/lib/abi/Multicall3';
import { UniversalProfile } from '@chillwhales/typeorm';
import { INTERFACE_ID_LSP0 } from '@lukso/lsp0-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';

const versions = [
  {
    interfaceId: INTERFACE_ID_LSP0,
    callData: LSP0ERC725Account.functions.supportsInterface.encode({
      interfaceId: INTERFACE_ID_LSP0,
    }),
  },
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

  for (const { interfaceId, callData } of versions) {
    if (unverifiedUniversalProfiles.length === 0) continue;

    const promises: Promise<Aggregate3StaticReturn>[] = [];
    let batchIndex = 0;
    const batchSize = 100;
    while (batchIndex * batchSize < unverifiedUniversalProfiles.length) {
      const verifiedCount = batchIndex * batchSize;
      const unverifiedCount = unverifiedUniversalProfiles.length - verifiedCount;
      const currentBatchSize = Math.min(unverifiedCount, batchSize);

      promises.push(
        Utils.Multicall3.aggregate3StaticLatest({
          context,
          calls: unverifiedUniversalProfiles
            .slice(verifiedCount, verifiedCount + currentBatchSize)
            .map((target) => ({
              target,
              allowFailure: true,
              callData,
            })),
        }),
      );

      batchIndex++;
    }

    context.log.info(
      JSON.stringify({
        message: 'Verifing supported standards for Universal Profiles',
        interfaceId,
        unverifiedUniversalProfilesCount: unverifiedUniversalProfiles.length,
        newUniversalProfilesCount: newUniversalProfiles.size,
      }),
    );
    const result = (await Promise.all(promises)).flatMap((array) => array);

    unverifiedUniversalProfiles.forEach((address, index) =>
      result[index].success &&
      isHex(result[index].returnData) &&
      result[index].returnData !== '0x' &&
      hexToBool(result[index].returnData)
        ? newUniversalProfiles.set(
            address,
            new UniversalProfile({
              id: address,
              address,
            }),
          )
        : null,
    );

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
        .map((address) => [
          address,
          knownUniversalProfiles.get(address) || newUniversalProfiles.get(address),
        ]),
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
