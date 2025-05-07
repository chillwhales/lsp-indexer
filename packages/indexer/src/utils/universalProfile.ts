import { getLatestBlockNumber, Multicall3Utils } from '@/utils';
import { LSP0ERC725Account } from '@chillwhales/sqd-abi';
import { UniversalProfile } from '@chillwhales/sqd-typeorm';
import { INTERFACE_ID_LSP0 } from '@lukso/lsp0-contracts';
import { DataHandlerContext } from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';
import { hexToBool, isHex } from 'viem';

interface CustomParams {
  context: DataHandlerContext<Store, {}>;
  addressSet: Set<string>;
}

const calldatasByInterfaceId = [
  LSP0ERC725Account.functions.supportsInterface.encode({
    interfaceId: INTERFACE_ID_LSP0,
  }),
];

export async function verify({ context, addressSet }: CustomParams): Promise<{
  verifiedUniversalProfiles: Map<string, UniversalProfile>;
  unverifiedUniversalProfiles: Map<string, UniversalProfile>;
}> {
  const addressArray = [...addressSet];
  const knownUniversalProfiles: Map<string, UniversalProfile> = await context.store
    .findBy(UniversalProfile, { id: In(addressArray) })
    .then((ts) => new Map(ts.map((t) => [t.id, t])));

  if (addressArray.length === knownUniversalProfiles.size)
    return {
      verifiedUniversalProfiles: new Map(),
      unverifiedUniversalProfiles: new Map(),
    };

  const block = {
    height: await getLatestBlockNumber({ context }),
  };

  let unverifiedUniversalProfiles = addressArray.filter(
    (address) => !knownUniversalProfiles.has(address),
  );
  const verifiedUniversalProfiles = new Map<string, UniversalProfile>();

  for (const callData of calldatasByInterfaceId) {
    if (unverifiedUniversalProfiles.length === 0) continue;

    const result = await Multicall3Utils.aggregate3Static({
      context,
      block,
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
        verifiedUniversalProfiles.set(address, new UniversalProfile({ id: address, address }));
    });

    unverifiedUniversalProfiles = unverifiedUniversalProfiles.filter(
      (address) => !verifiedUniversalProfiles.has(address),
    );
  }

  return {
    verifiedUniversalProfiles,
    unverifiedUniversalProfiles: new Map(
      addressArray
        .filter(
          (address) =>
            !knownUniversalProfiles.has(address) && !verifiedUniversalProfiles.has(address),
        )
        .map((address) => [address, new UniversalProfile({ id: address, address })]),
    ),
  };
}
