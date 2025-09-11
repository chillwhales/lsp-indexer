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
        id: In([...new Set(filteredTransferEntities.map(({ address }) => address))]),
      })
      .then((entities) => entities.map((entity) => [entity.id, entity])),
  );
  const updatedTotalSupplyEntities = new Map<string, TotalSupply>();

  for (const transferEntity of filteredTransferEntities) {
    const { timestamp, address, digitalAsset, from, to, amount } = transferEntity;
    let entityToUpdate = updatedTotalSupplyEntities.get(address);

    if (!entityToUpdate) {
      const existingTotalSupplyEntity = existingTotalSupplyEntities.get(address);

      if (existingTotalSupplyEntity) {
        entityToUpdate = existingTotalSupplyEntity;
      } else {
        entityToUpdate = new TotalSupply({
          id: address,
          timestamp,
          address,
          digitalAsset,
          value: 0n,
        });
      }
    }

    if (isAddressEqual(zeroAddress, getAddress(from))) {
      updatedTotalSupplyEntities.set(
        entityToUpdate.id,
        new TotalSupply({
          ...entityToUpdate,
          timestamp,
          value: entityToUpdate.value + amount,
        }),
      );
    }
    if (isAddressEqual(zeroAddress, getAddress(to))) {
      updatedTotalSupplyEntities.set(
        entityToUpdate.id,
        new TotalSupply({
          ...entityToUpdate,
          timestamp,
          value: entityToUpdate.value > amount ? entityToUpdate.value - amount : 0n,
        }),
      );
    }
  }

  if (updatedTotalSupplyEntities.size) {
    context.log.info(
      JSON.stringify({
        message: "Saving new & updated 'TotalSupply' entities.",
        TotalSupplyEntitiesCount: updatedTotalSupplyEntities.size,
      }),
    );

    await context.store.upsert([...updatedTotalSupplyEntities.values()]);
  }
}
