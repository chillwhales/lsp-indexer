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
  LSP0ERC725Account,
  LSP23LinkedContractsFactory,
  LSP26FollowerSystem,
  LSP7DigitalAsset,
  LSP8IdentifiableDigitalAsset,
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
      LSP0ERC725Account.events.UniversalReceiver.topic,
      LSP0ERC725Account.events.OwnershipTransferred.topic,
      LSP7DigitalAsset.events.Transfer.topic,
      LSP8IdentifiableDigitalAsset.events.Transfer.topic,
      LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic,
    ],
  })
  .addLog({
    address: [LSP26_ADDRESS],
    range: { from: 3179471 },
    topic0: [LSP26FollowerSystem.events.Follow.topic, LSP26FollowerSystem.events.Unfollow.topic],
  })
  .addLog({
    address: [LSP23_ADDRESS],
    range: { from: 0 },
    topic0: [
      LSP23LinkedContractsFactory.events.DeployedContracts.topic,
      LSP23LinkedContractsFactory.events.DeployedERC1167Proxies.topic,
    ],
  });
