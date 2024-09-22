import { RequestHandler } from "express";
import Auction from "../models/Auction";
import { publicClient } from "../libs/ethereum";
import MultiAuctionAbi from "../assets/abis/MultiAuction";
import { MultiAuctionAddress } from "../constants";

export const getAuctionDetails: RequestHandler = async (req, res) => {
  try {
    const { auctionId } = req.params;

    //   const auction = await Auction.findOne({ auctionNumber: Number(auctionId) });
    const [owner, startTime, endTime, highestBid, highestBidder, ended, auctionType, startPrice, priceDecrement] =
      await publicClient.readContract({
        abi: MultiAuctionAbi,
        address: MultiAuctionAddress,
        functionName: "auctions",
        args: [BigInt(auctionId)],
      });
    res.status(200).json({
      data: {
        auctionId,
        owner,
        startTime: new Date(Number(startTime) * 1000),
        endTime: new Date(Number(endTime) * 1000),
        highestBid: highestBid.toString(),
        highestBidder,
        ended,
        auctionType,
        startPrice: startPrice.toString(),
        priceDecrement: priceDecrement.toString(),
      },
    });
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};
