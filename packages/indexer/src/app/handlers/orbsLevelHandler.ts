import { ORBS_ADDRESS } from '@/constants';
import { ORB_FACTION_KEY, ORB_LEVEL_KEY } from '@/constants/chillwhales';
import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  OrbCooldownExpiry,
  OrbFaction,
  OrbLevel,
  TokenIdDataChanged,
  Transfer,
} from '@chillwhales/typeorm';
import {
  bytesToNumber,
  getAddress,
  Hex,
  hexToBytes,
  hexToString,
  isAddressEqual,
  sliceBytes,
  zeroAddress,
} from 'viem';

export async function orbsLevelHandler({
  context,
  populatedTransferEntities,
  populatedTokenIdDataChangedEntities,
}: {
  context: Context;
  populatedTransferEntities: Transfer[];
  populatedTokenIdDataChangedEntities: TokenIdDataChanged[];
}) {
  const newOrbLevelEntities = new Map<string, OrbLevel>();
  const newOrbCooldownExpiryEntities = new Map<string, OrbCooldownExpiry>();
  const newOrbFactionEntities = new Map<string, OrbFaction>();

  const orbsMintedTransferEntities = populatedTransferEntities.filter(
    (entity) =>
      isAddressEqual(ORBS_ADDRESS, getAddress(entity.address)) &&
      isAddressEqual(zeroAddress, getAddress(entity.from)),
  );
  if (orbsMintedTransferEntities.length) {
    orbsMintedTransferEntities.forEach(({ address, digitalAsset, tokenId, nft }) => {
      const id = Utils.generateTokenId({ address, tokenId });
      newOrbLevelEntities.set(
        id,
        new OrbLevel({
          id,
          address,
          digitalAsset,
          tokenId,
          nft,
          value: 0,
        }),
      );
    });

    orbsMintedTransferEntities.forEach(({ address, digitalAsset, tokenId, nft }) => {
      const id = Utils.generateTokenId({ address, tokenId });
      newOrbCooldownExpiryEntities.set(
        id,
        new OrbCooldownExpiry({
          id,
          address,
          digitalAsset,
          tokenId,
          nft,
          value: 0,
        }),
      );
    });

    orbsMintedTransferEntities.forEach(({ address, digitalAsset, tokenId, nft }) => {
      const id = Utils.generateTokenId({ address, tokenId });
      newOrbFactionEntities.set(
        id,
        new OrbFaction({
          id,
          address,
          digitalAsset,
          tokenId,
          nft,
          value: 'Neutral',
        }),
      );
    });
  }

  const orbLevelTokenIdDataChangedEntities = populatedTokenIdDataChangedEntities.filter(
    (entity) =>
      isAddressEqual(ORBS_ADDRESS, getAddress(entity.address)) && entity.dataKey === ORB_LEVEL_KEY,
  );
  if (orbLevelTokenIdDataChangedEntities.length) {
    orbLevelTokenIdDataChangedEntities.map(({ address, digitalAsset, tokenId, nft, dataValue }) => {
      const id = Utils.generateTokenId({ address, tokenId });
      newOrbLevelEntities.set(
        id,
        new OrbLevel({
          id,
          address,
          digitalAsset,
          tokenId,
          nft,
          value: bytesToNumber(sliceBytes(hexToBytes(dataValue as Hex), 0, 4)),
        }),
      );
    });

    orbLevelTokenIdDataChangedEntities.map(({ address, digitalAsset, tokenId, nft, dataValue }) => {
      const id = Utils.generateTokenId({ address, tokenId });
      newOrbCooldownExpiryEntities.set(
        id,
        new OrbCooldownExpiry({
          id,
          address,
          digitalAsset,
          tokenId,
          nft,
          value: bytesToNumber(sliceBytes(hexToBytes(dataValue as Hex), 4)),
        }),
      );
    });
  }

  const orbFactionTokenIdDataChangedEntities = populatedTokenIdDataChangedEntities.filter(
    (entity) =>
      isAddressEqual(ORBS_ADDRESS, getAddress(entity.address)) &&
      entity.dataKey === ORB_FACTION_KEY,
  );
  if (orbFactionTokenIdDataChangedEntities.length) {
    orbFactionTokenIdDataChangedEntities.map(
      ({ address, digitalAsset, tokenId, nft, dataValue }) => {
        const id = Utils.generateTokenId({ address, tokenId });
        newOrbFactionEntities.set(
          id,
          new OrbFaction({
            id,
            address,
            digitalAsset,
            tokenId,
            nft,
            value: hexToString(dataValue as Hex),
          }),
        );
      },
    );
  }

  await context.store.upsert([...newOrbLevelEntities.values()]);
  await context.store.upsert([...newOrbCooldownExpiryEntities.values()]);
  await context.store.upsert([...newOrbFactionEntities.values()]);
}
