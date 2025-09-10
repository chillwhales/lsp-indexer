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
    if (existingTotalSupplyEntities.has(id) && !updatedTotalSupplyEntities.has(id)) {
      const existingTotalSupplyEntity = existingTotalSupplyEntities.get(id);

      if (isAddressEqual(zeroAddress, getAddress(from))) {
        updatedTotalSupplyEntities.set(
          address,
          new TotalSupply({
            ...existingTotalSupplyEntity,
            timestamp,
            value: existingTotalSupplyEntity.value + amount,
          }),
        );
      }
      if (isAddressEqual(zeroAddress, getAddress(to))) {
        updatedTotalSupplyEntities.set(
          address,
          new TotalSupply({
            ...existingTotalSupplyEntity,
            timestamp,
            value:
              existingTotalSupplyEntity.value > amount
                ? existingTotalSupplyEntity.value - amount
                : 0n,
          }),
        );
      }
    } else if (updatedTotalSupplyEntities.has(id)) {
      const updatedTotalSupplyEntity = updatedTotalSupplyEntities.get(id);

      if (isAddressEqual(zeroAddress, getAddress(from))) {
        updatedTotalSupplyEntities.set(
          address,
          new TotalSupply({
            ...updatedTotalSupplyEntity,
            timestamp,
            value: updatedTotalSupplyEntity.value + amount,
          }),
        );
      }
      if (isAddressEqual(zeroAddress, getAddress(to))) {
        updatedTotalSupplyEntities.set(
          address,
          new TotalSupply({
            ...updatedTotalSupplyEntity,
            timestamp,
            value:
              updatedTotalSupplyEntity.value > amount
                ? updatedTotalSupplyEntity.value - amount
                : 0n,
          }),
        );
      }
    } else {
      if (isAddressEqual(zeroAddress, getAddress(from))) {
        updatedTotalSupplyEntities.set(
          address,
          new TotalSupply({
            id: address,
            timestamp,
            address,
            digitalAsset,
            value: amount,
          }),
        );
      }
      if (isAddressEqual(zeroAddress, getAddress(to))) {
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
    }
  });

  await context.store.upsert([...updatedTotalSupplyEntities.values()]);
}
