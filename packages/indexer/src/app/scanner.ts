import { LSP29DataKeys } from '@/constants';
import { Context, ExtractParams } from '@/types';
import * as Utils from '@/utils';
import {
  ERC725X,
  ERC725Y,
  ListingManager,
  LSP0ERC725Account as LSP0,
  LSP14Ownable2Step as LSP14,
  LSP23LinkedContractsFactory as LSP23,
  LSP26FollowerSystem as LSP26,
  LSP7DigitalAsset as LSP7,
  LSP8IdentifiableDigitalAsset as LSP8,
  PlatformProceedsManager,
  PurchaseManager,
  SellerProceedsManager,
} from '@chillwhales/abi';
import {
  DataChanged,
  DeployedContracts,
  DeployedERC1167Proxies,
  Executed,
  Follow,
  ListingClosed,
  ListingCreated,
  ListingPaused,
  ListingPriceUpdated,
  ListingUnpaused,
  LSP12IssuedAssetsItem,
  LSP12IssuedAssetsLength,
  LSP12IssuedAssetsMap,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetRevisionCount,
  LSP29EncryptedAssetsItem,
  LSP29EncryptedAssetsLength,
  LSP29EncryptedAssetsMap,
  LSP3Profile,
  LSP4CreatorsItem,
  LSP4CreatorsLength,
  LSP4CreatorsMap,
  LSP4Metadata,
  LSP4TokenName,
  LSP4TokenSymbol,
  LSP4TokenType,
  LSP5ReceivedAssetsItem,
  LSP5ReceivedAssetsLength,
  LSP5ReceivedAssetsMap,
  LSP6AllowedCall,
  LSP6AllowedERC725YDataKey,
  LSP6ControllerAllowedCalls,
  LSP6ControllerAllowedERC725YDataKeys,
  LSP6ControllerPermissions,
  LSP6ControllersItem,
  LSP6ControllersLength,
  LSP6Permission,
  LSP8ReferenceContract,
  LSP8TokenIdFormat,
  LSP8TokenMetadataBaseURI,
  NFT,
  OwnershipTransferred,
  PlatformProceedsWithdrawn,
  PrimaryContractDeployment,
  PrimaryContractDeploymentInit,
  PurchaseCompleted,
  SecondaryContractDeployment,
  SecondaryContractDeploymentInit,
  SellerProceedsWithdrawn,
  TokenIdDataChanged,
  TokensWithdrawn,
  Transfer,
  Unfollow,
  UniversalReceiver,
} from '@chillwhales/typeorm';
import { LSP12DataKeys } from '@lukso/lsp12-contracts';
import { LSP3DataKeys } from '@lukso/lsp3-contracts';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { LSP5DataKeys } from '@lukso/lsp5-contracts';
import { LSP6DataKeys } from '@lukso/lsp6-contracts';
import { LSP8DataKeys } from '@lukso/lsp8-contracts';
import { v4 as uuidv4 } from 'uuid';

export function scanLogs(context: Context) {
  const universalProfiles = new Set<string>();
  const digitalAssets = new Set<string>();
  const nfts = new Map<string, NFT>();

  const executedEntities: Executed[] = [];
  const dataChangedEntities: DataChanged[] = [];
  const universalReceiverEntities: UniversalReceiver[] = [];
  const transferEntities: Transfer[] = [];
  const tokenIdDataChangedEntities: TokenIdDataChanged[] = [];
  const followEntities: Follow[] = [];
  const unfollowEntities: Unfollow[] = [];
  const deployedContractsEntities: DeployedContracts[] = [];
  const deployedERC1167ProxiesEntities: DeployedERC1167Proxies[] = [];
  const ownershipTransferredEntities: OwnershipTransferred[] = [];

  // Marketplace extension events
  const listingCreatedEntities: ListingCreated[] = [];
  const listingClosedEntities: ListingClosed[] = [];
  const listingPausedEntities: ListingPaused[] = [];
  const listingUnpausedEntities: ListingUnpaused[] = [];
  const listingPriceUpdatedEntities: ListingPriceUpdated[] = [];
  const tokensWithdrawnEntities: TokensWithdrawn[] = [];
  const purchaseCompletedEntities: PurchaseCompleted[] = [];
  const platformProceedsWithdrawnEntities: PlatformProceedsWithdrawn[] = [];
  const sellerProceedsWithdrawnEntities: SellerProceedsWithdrawn[] = [];

  const lsp3ProfileEntities = new Map<string, LSP3Profile>();

  const lsp4TokenNameEntities = new Map<string, LSP4TokenName>();
  const lsp4TokenSymbolEntities = new Map<string, LSP4TokenSymbol>();
  const lsp4TokenTypeEntities = new Map<string, LSP4TokenType>();
  const lsp4MetadataEntities = new Map<string, LSP4Metadata>();
  const lsp4CreatorsLengthEntities = new Map<string, LSP4CreatorsLength>();
  const lsp4CreatorsItemEntities = new Map<string, LSP4CreatorsItem>();
  const lsp4CreatorsMapEntities = new Map<string, LSP4CreatorsMap>();

  const lsp5ReceivedAssetsLengthEntities = new Map<string, LSP5ReceivedAssetsLength>();
  const lsp5ReceivedAssetsItemEntities = new Map<string, LSP5ReceivedAssetsItem>();
  const lsp5ReceivedAssetsMapEntities = new Map<string, LSP5ReceivedAssetsMap>();

  const lsp6ControllersLengthEntities = new Map<string, LSP6ControllersLength>();
  const lsp6ControllersItemEntities = new Map<string, LSP6ControllersItem>();
  const lsp6ControllerPermissionsEntities = new Map<string, LSP6ControllerPermissions>();
  const lsp6PermissionEntities = new Map<string, LSP6Permission>();
  const lsp6ControllerAllowedCallsEntities = new Map<string, LSP6ControllerAllowedCalls>();
  const lsp6AllowedCallEntities = new Map<string, LSP6AllowedCall>();
  const lsp6ControllerAllowedErc725YDataKeysEntities = new Map<
    string,
    LSP6ControllerAllowedERC725YDataKeys
  >();
  const lsp6AllowedErc725YDataKeyEntities = new Map<string, LSP6AllowedERC725YDataKey>();

  const lsp8TokenIdFormatEntities = new Map<string, LSP8TokenIdFormat>();
  const lsp8ReferenceContractEntities = new Map<string, LSP8ReferenceContract>();
  const lsp8TokenMetadataBaseUriEntities = new Map<string, LSP8TokenMetadataBaseURI>();

  const lsp12IssuedAssetsLengthEntities = new Map<string, LSP12IssuedAssetsLength>();
  const lsp12IssuedAssetsItemEntities = new Map<string, LSP12IssuedAssetsItem>();
  const lsp12IssuedAssetsMapEntities = new Map<string, LSP12IssuedAssetsMap>();

  // LSP29 Encrypted Assets
  const lsp29EncryptedAssetEntities = new Map<string, LSP29EncryptedAsset>();
  const lsp29EncryptedAssetsLengthEntities = new Map<string, LSP29EncryptedAssetsLength>();
  const lsp29EncryptedAssetsItemEntities = new Map<string, LSP29EncryptedAssetsItem>();
  const lsp29EncryptedAssetsMapEntities = new Map<string, LSP29EncryptedAssetsMap>();
  const lsp29EncryptedAssetRevisionCountEntities = new Map<
    string,
    LSP29EncryptedAssetRevisionCount
  >();

  for (const block of context.blocks) {
    const { logs } = block;

    for (const log of logs) {
      const extractParams: ExtractParams = { context, block, log };

      switch (log.topics[0]) {
        case ERC725X.events.Executed.topic: {
          universalProfiles.add(log.address);
          executedEntities.push(Utils.Executed.extract(extractParams));
          break;
        }

        case ERC725Y.events.DataChanged.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          dataChangedEntities.push(Utils.DataChanged.extract(extractParams));

          const { dataKey } = ERC725Y.events.DataChanged.decode(log);
          switch (dataKey) {
            case LSP3DataKeys.LSP3Profile: {
              const lsp3Profile = Utils.DataChanged.LSP3Profile.extract(extractParams);
              lsp3ProfileEntities.set(lsp3Profile.id, lsp3Profile);
              break;
            }

            case LSP4DataKeys.LSP4Metadata: {
              const lsp4Metadata = Utils.DataChanged.LSP4Metadata.extract(extractParams);
              lsp4MetadataEntities.set(lsp4Metadata.id, lsp4Metadata);
              break;
            }

            case LSP4DataKeys.LSP4TokenName: {
              const lsp4TokenName = Utils.DataChanged.LSP4TokenName.extract(extractParams);
              lsp4TokenNameEntities.set(lsp4TokenName.id, lsp4TokenName);
              break;
            }

            case LSP4DataKeys.LSP4TokenSymbol: {
              const lsp4TokenSymbol = Utils.DataChanged.LSP4TokenSymbol.extract(extractParams);
              lsp4TokenSymbolEntities.set(lsp4TokenSymbol.id, lsp4TokenSymbol);
              break;
            }

            case LSP4DataKeys.LSP4TokenType: {
              const lsp4TokenType = Utils.DataChanged.LSP4TokenType.extract(extractParams);
              lsp4TokenTypeEntities.set(lsp4TokenType.id, lsp4TokenType);
              break;
            }

            case LSP4DataKeys['LSP4Creators[]'].length: {
              const lsp4CreatorsLength =
                Utils.DataChanged.LSP4CreatorsLength.extract(extractParams);
              lsp4CreatorsLengthEntities.set(lsp4CreatorsLength.id, lsp4CreatorsLength);
            }

            case LSP5DataKeys['LSP5ReceivedAssets[]'].length: {
              const lsp5ReceivedAssetsLength =
                Utils.DataChanged.LSP5ReceivedAssetsLength.extract(extractParams);
              lsp5ReceivedAssetsLengthEntities.set(
                lsp5ReceivedAssetsLength.id,
                lsp5ReceivedAssetsLength,
              );
            }

            case LSP6DataKeys['AddressPermissions[]'].length: {
              const lsp6ControllersLength =
                Utils.DataChanged.LSP6ControllersLength.extract(extractParams);
              lsp6ControllersLengthEntities.set(lsp6ControllersLength.id, lsp6ControllersLength);
            }

            case LSP8DataKeys.LSP8ReferenceContract: {
              const lsp8ReferenceContract =
                Utils.DataChanged.LSP8ReferenceContract.extract(extractParams);
              lsp8ReferenceContractEntities.set(lsp8ReferenceContract.id, lsp8ReferenceContract);
              break;
            }

            case LSP8DataKeys.LSP8TokenIdFormat: {
              const lsp8TokenIdFormat = Utils.DataChanged.LSP8TokenIdFormat.extract(extractParams);
              lsp8TokenIdFormatEntities.set(lsp8TokenIdFormat.id, lsp8TokenIdFormat);
              break;
            }

            case LSP8DataKeys.LSP8TokenMetadataBaseURI: {
              const lsp8TokenMetadataBaseUri =
                Utils.DataChanged.LSP8TokenMetadataBaseURI.extract(extractParams);
              lsp8TokenMetadataBaseUriEntities.set(
                lsp8TokenMetadataBaseUri.id,
                lsp8TokenMetadataBaseUri,
              );
              break;
            }

            case LSP12DataKeys['LSP12IssuedAssets[]'].length: {
              const lsp12IssuedAssetsLength =
                Utils.DataChanged.LSP12IssuedAssetsLength.extract(extractParams);
              lsp12IssuedAssetsLengthEntities.set(
                lsp12IssuedAssetsLength.id,
                lsp12IssuedAssetsLength,
              );
            }

            default:
              if (dataKey.startsWith(LSP4DataKeys['LSP4Creators[]'].index)) {
                const lsp4CreatorsItem = Utils.DataChanged.LSP4CreatorsItem.extract(extractParams);
                lsp4CreatorsItemEntities.set(lsp4CreatorsItem.id, lsp4CreatorsItem);
                break;
              }

              if (dataKey.startsWith(LSP4DataKeys.LSP4CreatorsMap)) {
                const lsp4CreatorsMap = Utils.DataChanged.LSP4CreatorsMap.extract(extractParams);
                lsp4CreatorsMapEntities.set(lsp4CreatorsMap.id, lsp4CreatorsMap);
                break;
              }

              if (dataKey.startsWith(LSP5DataKeys['LSP5ReceivedAssets[]'].index)) {
                const lsp5ReceivedAssetsItem =
                  Utils.DataChanged.LSP5ReceivedAssetsItem.extract(extractParams);
                lsp5ReceivedAssetsItemEntities.set(
                  lsp5ReceivedAssetsItem.id,
                  lsp5ReceivedAssetsItem,
                );
                break;
              }

              if (dataKey.startsWith(LSP5DataKeys.LSP5ReceivedAssetsMap)) {
                const lsp5ReceivedAssetsMap =
                  Utils.DataChanged.LSP5ReceivedAssetsMap.extract(extractParams);
                lsp5ReceivedAssetsMapEntities.set(lsp5ReceivedAssetsMap.id, lsp5ReceivedAssetsMap);
                break;
              }

              if (dataKey.startsWith(LSP6DataKeys['AddressPermissions[]'].index)) {
                const lsp6ControllersItem =
                  Utils.DataChanged.LSP6ControllersItem.extract(extractParams);
                lsp6ControllersItemEntities.set(lsp6ControllersItem.id, lsp6ControllersItem);
                break;
              }

              if (dataKey.startsWith(LSP6DataKeys['AddressPermissions:Permissions'])) {
                const result = Utils.DataChanged.LSP6ControllerPermissions.extract(extractParams);
                lsp6ControllerPermissionsEntities.set(
                  result.lsp6ControllerPermissions.id,
                  result.lsp6ControllerPermissions,
                );
                result.lsp6PermissionEntities.map((lsp6Permission) =>
                  lsp6PermissionEntities.set(lsp6Permission.id, lsp6Permission),
                );
                break;
              }

              if (dataKey.startsWith(LSP6DataKeys['AddressPermissions:AllowedCalls'])) {
                const result = Utils.DataChanged.LSP6ControllerAllowedCalls.extract(extractParams);
                lsp6ControllerAllowedCallsEntities.set(
                  result.lsp6ControllerAllowedCalls.id,
                  result.lsp6ControllerAllowedCalls,
                );

                const lsp6AllowedCallEntitiesToRemove = [
                  ...lsp6AllowedCallEntities.values(),
                ].filter(
                  (lsp6AllowedCall) =>
                    lsp6AllowedCall.lsp6ControllerAllowedCalls.id ===
                    result.lsp6ControllerAllowedCalls.id,
                );
                lsp6AllowedCallEntitiesToRemove.forEach(({ id }) =>
                  lsp6AllowedCallEntities.delete(id),
                );

                result.lsp6AllowedCallEntities.map((lsp6AllowedCall) =>
                  lsp6AllowedCallEntities.set(lsp6AllowedCall.id, lsp6AllowedCall),
                );

                break;
              }

              if (dataKey.startsWith(LSP6DataKeys['AddressPermissions:AllowedERC725YDataKeys'])) {
                const result =
                  Utils.DataChanged.LSP6ControllerAllowedERC725YDataKeys.extract(extractParams);
                lsp6ControllerAllowedErc725YDataKeysEntities.set(
                  result.lsp6ControllerAllowedErc725YDataKeys.id,
                  result.lsp6ControllerAllowedErc725YDataKeys,
                );

                const lsp6AllowedErc725YDataKeyEntitiesToRemove = [
                  ...lsp6AllowedErc725YDataKeyEntities.values(),
                ].filter(
                  (lsp6AllowedErc725YDataKey) =>
                    lsp6AllowedErc725YDataKey.lsp6ControllerAllowedErc725YDataKeys.id ===
                    result.lsp6ControllerAllowedErc725YDataKeys.id,
                );
                lsp6AllowedErc725YDataKeyEntitiesToRemove.forEach(({ id }) =>
                  lsp6AllowedErc725YDataKeyEntities.delete(id),
                );

                result.lsp6AllowedErc725YDataKeysEntities.map((lsp6AllowedErc725YDataKey) =>
                  lsp6AllowedErc725YDataKeyEntities.set(
                    lsp6AllowedErc725YDataKey.id,
                    lsp6AllowedErc725YDataKey,
                  ),
                );

                break;
              }

              if (dataKey.startsWith(LSP12DataKeys['LSP12IssuedAssets[]'].index)) {
                const lsp12IssuedAssetsItem =
                  Utils.DataChanged.LSP12IssuedAssetsItem.extract(extractParams);
                lsp12IssuedAssetsItemEntities.set(lsp12IssuedAssetsItem.id, lsp12IssuedAssetsItem);
                break;
              }

              if (dataKey.startsWith(LSP12DataKeys.LSP12IssuedAssetsMap)) {
                const lsp12IssuedAssetsMap =
                  Utils.DataChanged.LSP12IssuedAssetsMap.extract(extractParams);
                lsp12IssuedAssetsMapEntities.set(lsp12IssuedAssetsMap.id, lsp12IssuedAssetsMap);
                break;
              }

              // LSP29 Encrypted Assets
              if (dataKey === LSP29DataKeys['LSP29EncryptedAssets[]'].length) {
                const lsp29EncryptedAssetsLength =
                  Utils.DataChanged.LSP29EncryptedAssetsLength.extract(extractParams);
                lsp29EncryptedAssetsLengthEntities.set(
                  lsp29EncryptedAssetsLength.id,
                  lsp29EncryptedAssetsLength,
                );
                break;
              }

              if (dataKey.startsWith(LSP29DataKeys['LSP29EncryptedAssets[]'].index)) {
                const lsp29EncryptedAssetsItem =
                  Utils.DataChanged.LSP29EncryptedAssetsItem.extract(extractParams);
                lsp29EncryptedAssetsItemEntities.set(
                  lsp29EncryptedAssetsItem.id,
                  lsp29EncryptedAssetsItem,
                );

                // Also extract the encrypted asset entity for JSON fetching
                const lsp29EncryptedAsset =
                  Utils.DataChanged.LSP29EncryptedAsset.extract(extractParams);
                lsp29EncryptedAssetEntities.set(lsp29EncryptedAsset.id, lsp29EncryptedAsset);
                break;
              }

              if (dataKey.startsWith(LSP29DataKeys.LSP29EncryptedAssetsMap)) {
                const lsp29EncryptedAssetsMap =
                  Utils.DataChanged.LSP29EncryptedAssetsMap.extract(extractParams);
                lsp29EncryptedAssetsMapEntities.set(
                  lsp29EncryptedAssetsMap.id,
                  lsp29EncryptedAssetsMap,
                );
                break;
              }

              if (dataKey.startsWith(LSP29DataKeys.LSP29EncryptedAssetRevisionCount)) {
                const lsp29EncryptedAssetRevisionCount =
                  Utils.DataChanged.LSP29EncryptedAssetRevisionCount.extract(extractParams);
                lsp29EncryptedAssetRevisionCountEntities.set(
                  lsp29EncryptedAssetRevisionCount.id,
                  lsp29EncryptedAssetRevisionCount,
                );
                break;
              }
          }

          break;
        }

        case LSP0.events.UniversalReceiver.topic: {
          universalProfiles.add(log.address);
          universalReceiverEntities.push(Utils.UniversalReceiver.extract(extractParams));
          break;
        }

        case LSP7.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEntities.push(transferEvent);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8.events.Transfer.topic: {
          const transferEvent = Utils.Transfer.extract(extractParams);
          transferEntities.push(transferEvent);

          const nft = Utils.Transfer.NFT.extract(extractParams);
          if (nft !== null) nfts.set(nft.id, nft);

          digitalAssets.add(transferEvent.address);
          universalProfiles.add(transferEvent.from);
          universalProfiles.add(transferEvent.to);

          break;
        }

        case LSP8.events.TokenIdDataChanged.topic: {
          digitalAssets.add(log.address);
          tokenIdDataChangedEntities.push(Utils.TokenIdDataChanged.extract(extractParams));

          const nft = Utils.TokenIdDataChanged.NFT.extract(extractParams);
          if (!nfts.has(nft.id)) nfts.set(nft.id, nft);

          const { dataKey } = LSP8.events.TokenIdDataChanged.decode(log);
          switch (dataKey) {
            case LSP4DataKeys.LSP4Metadata: {
              const lsp4Metadata = Utils.TokenIdDataChanged.LSP4Metadata.extract(extractParams);
              lsp4MetadataEntities.set(lsp4Metadata.id, lsp4Metadata);
              break;
            }
          }

          break;
        }

        case LSP26.events.Follow.topic: {
          const followEvent = Utils.Follow.extract(extractParams);
          followEntities.push(followEvent);

          universalProfiles.add(followEvent.followerAddress);
          universalProfiles.add(followEvent.followedAddress);
          break;
        }

        case LSP26.events.Unfollow.topic: {
          const unfollowEvent = Utils.Unfollow.extract(extractParams);
          unfollowEntities.push(unfollowEvent);

          universalProfiles.add(unfollowEvent.followerAddress);
          universalProfiles.add(unfollowEvent.unfollowedAddress);
          break;
        }

        case LSP23.events.DeployedContracts.topic: {
          const {
            header: { timestamp, height },
          } = block;
          const { logIndex, transactionIndex, address } = log;
          const {
            primaryContract,
            secondaryContract,
            primaryContractDeployment,
            secondaryContractDeployment,
            postDeploymentModule,
            postDeploymentModuleCalldata,
          } = LSP23.events.DeployedContracts.decode(log);

          deployedContractsEntities.push(
            new DeployedContracts({
              id: uuidv4(),
              timestamp: new Date(timestamp),
              blockNumber: height,
              logIndex,
              transactionIndex,
              address,
              primaryContract,
              secondaryContract,
              primaryContractDeployment: new PrimaryContractDeployment(primaryContractDeployment),
              secondaryContractDeployment: new SecondaryContractDeployment(
                secondaryContractDeployment,
              ),
              postDeploymentModule,
              postDeploymentModuleCalldata,
            }),
          );
          break;
        }

        case LSP23.events.DeployedERC1167Proxies.topic: {
          const {
            header: { timestamp, height },
          } = block;
          const { logIndex, transactionIndex, address } = log;
          const {
            primaryContract,
            secondaryContract,
            primaryContractDeploymentInit,
            secondaryContractDeploymentInit,
            postDeploymentModule,
            postDeploymentModuleCalldata,
          } = LSP23.events.DeployedERC1167Proxies.decode(log);

          deployedERC1167ProxiesEntities.push(
            new DeployedERC1167Proxies({
              id: uuidv4(),
              timestamp: new Date(timestamp),
              blockNumber: height,
              logIndex,
              transactionIndex,
              address,
              primaryContract,
              secondaryContract,
              primaryContractDeploymentInit: new PrimaryContractDeploymentInit(
                primaryContractDeploymentInit,
              ),
              secondaryContractDeploymentInit: new SecondaryContractDeploymentInit(
                secondaryContractDeploymentInit,
              ),
              postDeploymentModule,
              postDeploymentModuleCalldata,
            }),
          );
          break;
        }

        case LSP14.events.OwnershipTransferred.topic: {
          universalProfiles.add(log.address);
          digitalAssets.add(log.address);
          ownershipTransferredEntities.push(Utils.OwnershipTransferred.extract(extractParams));
          break;
        }

        // Marketplace extension events
        case ListingManager.events.ListingCreated.topic: {
          const listingCreatedEvent = Utils.Marketplace.extractListingCreated(extractParams);
          listingCreatedEntities.push(listingCreatedEvent);
          // Track seller as potential UP and token as potential DigitalAsset
          universalProfiles.add(listingCreatedEvent.seller);
          digitalAssets.add(listingCreatedEvent.token);
          break;
        }

        case ListingManager.events.ListingClosed.topic: {
          listingClosedEntities.push(Utils.Marketplace.extractListingClosed(extractParams));
          break;
        }

        case ListingManager.events.ListingPaused.topic: {
          listingPausedEntities.push(Utils.Marketplace.extractListingPaused(extractParams));
          break;
        }

        case ListingManager.events.ListingUnpaused.topic: {
          listingUnpausedEntities.push(Utils.Marketplace.extractListingUnpaused(extractParams));
          break;
        }

        case ListingManager.events.ListingPriceUpdated.topic: {
          listingPriceUpdatedEntities.push(
            Utils.Marketplace.extractListingPriceUpdated(extractParams),
          );
          break;
        }

        case ListingManager.events.TokensWithdrawn.topic: {
          const tokensWithdrawnEvent = Utils.Marketplace.extractTokensWithdrawn(extractParams);
          tokensWithdrawnEntities.push(tokensWithdrawnEvent);
          // Track recipient as potential UP
          universalProfiles.add(tokensWithdrawnEvent.recipient);
          break;
        }

        case PurchaseManager.events.PurchaseCompleted.topic: {
          const purchaseCompletedEvent = Utils.Marketplace.extractPurchaseCompleted(extractParams);
          purchaseCompletedEntities.push(purchaseCompletedEvent);
          // Track buyer/seller as potential UPs and token/paymentToken as potential DigitalAssets
          universalProfiles.add(purchaseCompletedEvent.buyer);
          universalProfiles.add(purchaseCompletedEvent.seller);
          digitalAssets.add(purchaseCompletedEvent.token);
          digitalAssets.add(purchaseCompletedEvent.paymentToken);
          break;
        }

        case PlatformProceedsManager.events.PlatformProceedsWithdrawn.topic: {
          const platformProceedsEvent =
            Utils.Marketplace.extractPlatformProceedsWithdrawn(extractParams);
          platformProceedsWithdrawnEntities.push(platformProceedsEvent);
          // Track recipient as potential UP and paymentToken as potential DigitalAsset
          universalProfiles.add(platformProceedsEvent.recipient);
          digitalAssets.add(platformProceedsEvent.paymentToken);
          break;
        }

        case SellerProceedsManager.events.SellerProceedsWithdrawn.topic: {
          const sellerProceedsEvent =
            Utils.Marketplace.extractSellerProceedsWithdrawn(extractParams);
          sellerProceedsWithdrawnEntities.push(sellerProceedsEvent);
          // Track seller/recipient as potential UPs and paymentToken as potential DigitalAsset
          universalProfiles.add(sellerProceedsEvent.seller);
          universalProfiles.add(sellerProceedsEvent.recipient);
          digitalAssets.add(sellerProceedsEvent.paymentToken);
          break;
        }
      }
    }
  }

  return {
    universalProfiles,
    assets: { digitalAssets, nfts },
    events: {
      executedEntities,
      dataChangedEntities,
      universalReceiverEntities,
      transferEntities,
      tokenIdDataChangedEntities,
      followEntities,
      unfollowEntities,
      deployedContractsEntities,
      deployedERC1167ProxiesEntities,
      ownershipTransferredEntities,
      // Marketplace extension events
      listingCreatedEntities,
      listingClosedEntities,
      listingPausedEntities,
      listingUnpausedEntities,
      listingPriceUpdatedEntities,
      tokensWithdrawnEntities,
      purchaseCompletedEntities,
      platformProceedsWithdrawnEntities,
      sellerProceedsWithdrawnEntities,
    },
    dataKeys: {
      lsp3ProfileEntities,
      lsp4TokenNameEntities,
      lsp4TokenSymbolEntities,
      lsp4TokenTypeEntities,
      lsp4MetadataEntities,
      lsp4CreatorsLengthEntities,
      lsp4CreatorsItemEntities,
      lsp4CreatorsMapEntities,
      lsp5ReceivedAssetsLengthEntities,
      lsp5ReceivedAssetsItemEntities,
      lsp5ReceivedAssetsMapEntities,
      lsp6ControllersLengthEntities,
      lsp6ControllersItemEntities,
      lsp6ControllerPermissionsEntities,
      lsp6PermissionEntities,
      lsp6ControllerAllowedCallsEntities,
      lsp6AllowedCallEntities,
      lsp6ControllerAllowedErc725YDataKeysEntities,
      lsp6AllowedErc725YDataKeyEntities,
      lsp8TokenIdFormatEntities,
      lsp8ReferenceContractEntities,
      lsp8TokenMetadataBaseUriEntities,
      lsp12IssuedAssetsLengthEntities,
      lsp12IssuedAssetsItemEntities,
      lsp12IssuedAssetsMapEntities,
      // LSP29 Encrypted Assets
      lsp29EncryptedAssetEntities,
      lsp29EncryptedAssetsLengthEntities,
      lsp29EncryptedAssetsItemEntities,
      lsp29EncryptedAssetsMapEntities,
      lsp29EncryptedAssetRevisionCountEntities,
    },
  };
}

export function scanTransactions(context: Context) {
  for (const block of context.blocks) {
    const { transactions } = block;

    for (const transaction of transactions) {
      context.log.info(JSON.stringify({ transaction }));
    }
  }
}

export function scanTraces(context: Context) {
  for (const block of context.blocks) {
    const { traces } = block;

    for (const trace of traces) {
      context.log.info(JSON.stringify({ trace }));
    }
  }
}
