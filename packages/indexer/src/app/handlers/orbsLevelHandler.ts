import { ORBS_ADDRESS } from '@/constants';
import { ORB_FACTION_KEY, ORB_LEVEL_KEY } from '@/constants/chillwhales';
import { Context } from '@/types';
import * as Utils from '@/utils';
import {
  DigitalAsset,
  NFT,
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
  const orbsMintedTransferEntities = populatedTransferEntities.filter(
    (event) =>
      isAddressEqual(ORBS_ADDRESS, getAddress(event.address)) &&
      isAddressEqual(zeroAddress, getAddress(event.from)),
  );
  if (orbsMintedTransferEntities.length) {
    await context.store.insert(
      orbsMintedTransferEntities.map(
        ({ tokenId }) =>
          new OrbLevel({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: 0,
          }),
      ),
    );
    await context.store.insert(
      orbsMintedTransferEntities.map(
        ({ tokenId }) =>
          new OrbCooldownExpiry({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: 0,
          }),
      ),
    );
    await context.store.insert(
      orbsMintedTransferEntities.map(
        ({ tokenId }) =>
          new OrbFaction({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: 'Neutral',
          }),
      ),
    );
  }

  const orbLevelTokenIdDataChangedEntities = populatedTokenIdDataChangedEntities.filter(
    (entity) => entity.address === ORBS_ADDRESS && entity.dataKey === ORB_LEVEL_KEY,
  );
  if (orbLevelTokenIdDataChangedEntities.length) {
    await context.store.upsert(
      orbLevelTokenIdDataChangedEntities.map(
        ({ tokenId, dataValue }) =>
          new OrbLevel({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: bytesToNumber(sliceBytes(hexToBytes(dataValue as Hex), 0, 4)),
          }),
      ),
    );
    await context.store.upsert(
      orbLevelTokenIdDataChangedEntities.map(
        ({ tokenId, dataValue }) =>
          new OrbCooldownExpiry({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: bytesToNumber(sliceBytes(hexToBytes(dataValue as Hex), 4)),
          }),
      ),
    );
  }

  const orbFactionTokenIdDataChangedEntities = populatedTokenIdDataChangedEntities.filter(
    (entity) => entity.address === ORBS_ADDRESS && entity.dataKey === ORB_FACTION_KEY,
  );
  if (orbFactionTokenIdDataChangedEntities.length) {
    await context.store.upsert(
      orbFactionTokenIdDataChangedEntities.map(
        ({ tokenId, dataValue }) =>
          new OrbFaction({
            id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            address: ORBS_ADDRESS,
            digitalAsset: new DigitalAsset({ id: ORBS_ADDRESS }),
            tokenId,
            nft: new NFT({
              id: Utils.generateTokenId({ address: ORBS_ADDRESS, tokenId }),
            }),
            value: hexToString(dataValue as Hex),
          }),
      ),
    );
  }
}
