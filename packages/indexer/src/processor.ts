import { FINALITY_CONFIRMATION, GATEWAY, RPC_ENDPOINT } from '@/constants';
import {
  ERC725X,
  ERC725Y,
  LSP0ERC725Account,
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
} from '@chillwhales/sqd-abi';
import { EvmBatchProcessor } from '@subsquid/evm-processor';

export const processor = new EvmBatchProcessor()
  .setGateway(GATEWAY)
  .setRpcEndpoint(RPC_ENDPOINT)
  .setFinalityConfirmation(FINALITY_CONFIRMATION)
  // .setFields({
  //   trace: {
  //     createResultAddress: true,
  //   },
  // })
  // .addTrace({
  //   type: ['create'],
  //   transaction: true,
  // })
  .addLog({
    topic0: [
      ERC725X.events.Executed.topic,
      ERC725Y.events.DataChanged.topic,
      LSP0ERC725Account.events.UniversalReceiver.topic,
      LSP0ERC725Account.events.OwnershipTransferred.topic,
      LSP7DigitalAsset.events.Transfer.topic,
      LSP8IdentifiableDigitalAsset.events.Transfer.topic,
      LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic,
    ],
  });
