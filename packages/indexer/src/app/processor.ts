import {
  FINALITY_CONFIRMATION,
  LSP23_ADDRESS,
  LSP26_ADDRESS,
  RPC_RATE_LIMIT,
  RPC_URL,
  SQD_GATEWAY,
} from '@/constants';
import { Processor } from '@/types';
import {
  ERC725X,
  ERC725Y,
  LSP0ERC725Account as LSP0,
  LSP14Ownable2Step as LSP14,
  LSP23LinkedContractsFactory as LSP23,
  LSP26FollowerSystem as LSP26,
  LSP7DigitalAsset as LSP7,
  LSP8IdentifiableDigitalAsset as LSP8,
} from '@chillwhales/abi';
import { EvmBatchProcessor } from '@subsquid/evm-processor';

export const processor: Processor = new EvmBatchProcessor()
  .setGateway(SQD_GATEWAY)
  .setRpcEndpoint({
    url: RPC_URL,
    rateLimit: RPC_RATE_LIMIT,
  })
  .setFinalityConfirmation(FINALITY_CONFIRMATION)
  // .addTrace({
  //   type: ['create', 'call'],
  //   transaction: true,
  //   transactionLogs: true,
  //   callSighash: [claimChillSelector, claimChillBatchSelector],
  //   callTo: [CHILL_ADDRESS],
  //   range: { from: 0 },
  // })
  // .addTransaction({
  //   to: [CHILL_ADDRESS],
  //   sighash: [claimChillSelector, claimChillBatchSelector],
  //   range: { from: 0 },
  // })
  .addLog({
    topic0: [
      ERC725X.events.Executed.topic,
      ERC725Y.events.DataChanged.topic,
      LSP0.events.UniversalReceiver.topic,
      LSP7.events.Transfer.topic,
      LSP8.events.Transfer.topic,
      LSP8.events.TokenIdDataChanged.topic,
      LSP14.events.OwnershipTransferred.topic,
    ],
  })
  .addLog({
    address: [LSP26_ADDRESS],
    range: { from: 3179471 },
    topic0: [LSP26.events.Follow.topic, LSP26.events.Unfollow.topic],
  })
  .addLog({
    address: [LSP23_ADDRESS],
    range: { from: 1143651 },
    topic0: [LSP23.events.DeployedContracts.topic, LSP23.events.DeployedERC1167Proxies.topic],
  });
