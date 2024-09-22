import MultiAuctionAbi from "../assets/abis/MultiAuction";
import { AuctionContractCreationBlock, MultiAuctionAddress } from "../constants";
import { publicClient } from "./ethereum";
import Auction from "../models/Auction";
import Setting from "../models/Setting";
import { WatchContractEventOnLogsFn, WatchContractEventOnLogsParameter } from "viem";
import Bid from "../models/Bid";

export async function startListeners() {
  console.log("listening...");
  let setting = await Setting.findOne({});
  if (!setting) {
    setting = await Setting.create({ lastBlockRead: AuctionContractCreationBlock });
  }
  publicClient.watchContractEvent({
    abi: MultiAuctionAbi,
    address: MultiAuctionAddress,
    onLogs: (logs) => {
      logs.forEach(async (log) => {
        if (log.eventName === "AuctionCreated") {
          // @ts-expect-error
          await onAuctionCreated([log]);
        } else if (log.eventName === "NewBid") {
          // @ts-expect-error
          await onNewBid([log]);
        } else if (log.eventName === "AuctionEnded") {
          // @ts-expect-error
          await onAuctionEnded([log]);
        }
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
        await Setting.updateOne({}, { lastBlockRead: Number(num) });
      });
    },
    1000 * 60 * 5,
  );
}

async function backfillLogs(fromBlock: bigint, toBlock: bigint) {
  const logs = await publicClient.getContractEvents({
    abi: MultiAuctionAbi,
    address: MultiAuctionAddress,
    fromBlock: fromBlock,
    toBlock: toBlock,
  });
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.eventName === "AuctionCreated") {
      await onAuctionCreated([log]);
    } else if (log.eventName === "NewBid") {
      await onNewBid([log]);
    } else if (log.eventName === "AuctionEnded") {
      await onAuctionEnded([log]);
    }
  }
  await Setting.updateOne({}, { lastBlockRead: Number(toBlock) });
}

async function onAuctionCreated(logs: WatchContractEventOnLogsParameter<typeof MultiAuctionAbi, "AuctionCreated">) {
  const log = logs[0];
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

async function onNewBid(logs: WatchContractEventOnLogsParameter<typeof MultiAuctionAbi, "NewBid">) {
  const log = logs[0];
  const { timestamp } = await publicClient.getBlock({ blockNumber: log.blockNumber, includeTransactions: false });
  await Bid.findOneAndUpdate(
    { txHash: log.transactionHash },
    {
      auctionNumber: Number(log.args.auctionId),
      bidder: log.args.bidder,
      bid: log.args.bid?.toString(),
      newPrice: log.args.newPrice?.toString(),
      timestamp: new Date(Number(timestamp) * 1000).toString(),
    },
    { upsert: true },
  );
  await Auction.findOneAndUpdate(
    { auctionNumber: Number(log.args.auctionId) },
    { currentPrice: log.args.newPrice?.toString() },
  );
}

async function onAuctionEnded(logs: WatchContractEventOnLogsParameter<typeof MultiAuctionAbi, "AuctionEnded">) {
  const log = logs[0];
  // const { timestamp } = await publicClient.getBlock({ blockNumber: log.blockNumber, includeTransactions: false });
  await Auction.findOneAndUpdate(
    { auctionNumber: Number(log.args.auctionId) },
    {
      winner: log.args.winner,
      highestBid: log.args.winningBid?.toString(),
      highestBidder: log.args.winner,
      ended: true,
    },
  );
}
