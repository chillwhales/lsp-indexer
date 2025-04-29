import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import { ModularToken } from "@chillwhales/sqd-indexer-abi";
import { Transfer } from "./model";

const db = new TypeormDatabase();

const processor = new EvmBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/lukso-mainnet")
  .setRpcEndpoint({
    url: process.env.RPC_URL,
    rateLimit: 10,
  })
  .setFinalityConfirmation(75) // 15 mins to finality
  .addLog({
    address: ["0x5B8B0E44D4719F8A328470DcCD3746BFc73d6B14"],
    topic0: [ModularToken.events.Transfer.topic],
  });

processor.run(db, async (ctx) => {
  const transfers: Transfer[] = [];
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      let { from, to, amount } = ModularToken.events.Transfer.decode(log);
      transfers.push(
        new Transfer({
          id: log.id,
          from,
          to,
          amount,
        })
      );
    }
  }
  await ctx.store.insert(transfers);
});
