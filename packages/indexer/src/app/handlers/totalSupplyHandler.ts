import { Context } from '@/types';
import { TotalSupply, Transfer } from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

export async function totalSupplyHandler({
  context,
  populatedTransferEntities,
}: {
  context: Context;
  populatedTransferEntities: Transfer[];
}) {
  const filteredTransferEntities = populatedTransferEntities.filter(
    ({ from, to }) =>
      isAddressEqual(zeroAddress, getAddress(from)) || isAddressEqual(zeroAddress, getAddress(to)),
  );

  const existingTotalSupplyEntities = new Map(
    await context.store
      .findBy(TotalSupply, {
        address: In([...new Set(filteredTransferEntities.map(({ address }) => address))]),
      })
      .then((totalSupplyEntities) =>
        totalSupplyEntities.map((totalSupplyEntity) => [totalSupplyEntity.id, totalSupplyEntity]),
      ),
  );
  const updatedTotalSupplyEntities = new Map<string, TotalSupply>();

  filteredTransferEntities.forEach(({ id, timestamp, address, digitalAsset, from, to, amount }) => {
    const isMinting = isAddressEqual(zeroAddress, getAddress(from));
    const isBurning = isAddressEqual(zeroAddress, getAddress(to));

    if (!isMinting && !isBurning) return;

    if (existingTotalSupplyEntities.has(id) && !updatedTotalSupplyEntities.has(id)) {
      updatedTotalSupplyEntities.set(address, existingTotalSupplyEntities.get(id));
    } else if (!updatedTotalSupplyEntities.has(id)) {
      updatedTotalSupplyEntities.set(
        address,
        new TotalSupply({
          id: address,
          timestamp,
          address,
          digitalAsset,
          value: 0n,
        }),
      );
    }

    const updatedTotalSupplyEntity = updatedTotalSupplyEntities.get(id);

    if (isMinting) {
      updatedTotalSupplyEntities.set(
        address,
        new TotalSupply({
          ...updatedTotalSupplyEntity,
          timestamp,
          value: updatedTotalSupplyEntity.value + amount,
        }),
      );
    }
    if (isBurning) {
      updatedTotalSupplyEntities.set(
        address,
        new TotalSupply({
          ...updatedTotalSupplyEntity,
          timestamp,
          value:
            updatedTotalSupplyEntity.value > amount ? updatedTotalSupplyEntity.value - amount : 0n,
        }),
      );
    }
  });

  await context.store.upsert([...updatedTotalSupplyEntities.values()]);
}
