import MultiAuctionAbi from "../assets/abis/MultiAuction";
import { AuctionContractCreationBlock, MultiAuctionAddress } from "../constants";
import { publicClient } from "./ethereum";
import Auction from "../models/Auction";
import Setting from "../models/Setting";

export async function startListeners() {
  console.log("listening...");
  let setting = await Setting.findOne({});
  if (!setting) {
    setting = await Setting.create({ lastBlockRead: AuctionContractCreationBlock });
  }
  publicClient.watchContractEvent({
    abi: MultiAuctionAbi,
    address: MultiAuctionAddress,
    eventName: "AuctionCreated",
    onLogs: (logs) => {
      logs.forEach(async (log) => {
        const { from } = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
        let endTime = new Date(Number(log.args.endTime) * 1000).toString();
        if (endTime === "Invalid Date") endTime = new Date().toString();

        await Auction.findOneAndUpdate(
          { auctionNumber: Number(log.args.auctionId) },
          {
            owner: from,
            auctionNumber: Number(log.args.auctionId),
            auctionType: Number(log.args.auctionType),
            endTime,
            startTime: new Date().toDateString(),
          },
          { upsert: true },
        );
      });
    },
  });
  const latestBlockNumber = await publicClient.getBlockNumber();
  let lastBlock = BigInt(setting.lastBlockRead);
  const limit = 1000n;
  do {
    let toBlock = lastBlock + limit;
    if (toBlock > latestBlockNumber) toBlock = latestBlockNumber;
    await backfillLogs(lastBlock + 1n, toBlock);
    lastBlock = toBlock;
    if (toBlock >= latestBlockNumber) break;
  } while (lastBlock < latestBlockNumber);

  setInterval(
    () => {
      publicClient.getBlockNumber().then(async (num) => {
        await Setting.updateOne({}, { lastBlockRead: num });
      });
    },
    1000 * 60 * 5,
  );
}

async function backfillLogs(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getContractEvents({
    abi: MultiAuctionAbi,
    address: MultiAuctionAddress,
    eventName: "AuctionCreated",
    fromBlock: fromBlock,
    toBlock: toBlock,
  });
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const { timestamp } = await publicClient.getBlock({ blockNumber: log.blockNumber, includeTransactions: false });
    const { from } = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
    let endTime = new Date(Number(log.args.endTime) * 1000).toString();
    // Temporary, until validation added to contract.
    if (endTime === "Invalid Date") endTime = new Date().toString();
    await Auction.findOneAndUpdate(
      { auctionNumber: Number(log.args.auctionId) },
      {
        owner: from,
        auctionNumber: Number(log.args.auctionId),
        auctionType: Number(log.args.auctionType),
        endTime,
        startTime: new Date(Number(timestamp) * 1000).toString(),
      },
      { upsert: true },
    );
  }
  await Setting.updateOne({}, { lastBlockRead: Number(toBlock) });
}
