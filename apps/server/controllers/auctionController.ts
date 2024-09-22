import { RequestHandler } from "express";
import { publicClient, walletClient } from "../libs/ethereum";
import MultiAuctionAbi from "../assets/abis/MultiAuction";
import { MultiAuctionAddress } from "../constants";
import { formatEther, parseEther } from "viem";
import APIFeatures from "../libs/apiFeatures";
import Auction from "../models/Auction";

export const getAllAuctions: RequestHandler = async (req, res) => {
  try {
    const auctions = await new APIFeatures(Auction.find(), req.query).sort().paginate().filter().get();
    res.status(200).json({ status: true, data: auctions });
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};

export const getAuctionDetails: RequestHandler = async (req, res) => {
  try {
    const { auctionId } = req.params;

    //   const auction = await Auction.findOne({ auctionNumber: Number(auctionId) });
    const [owner, startTime, endTime, highestBid, highestBidder, ended, auctionType, startPrice, priceDecrement] =
      await publicClient.readContract({
        abi: MultiAuctionAbi,
        address: MultiAuctionAddress,
        functionName: "auctions",
        args: [BigInt(auctionId) - 1n],
      });
    const currentPrice = await publicClient.readContract({
      abi: MultiAuctionAbi,
      address: MultiAuctionAddress,
      functionName: "getCurrentPrice",
      args: [BigInt(auctionId) - 1n],
    });
    res.status(200).json({
      data: {
        auctionId,
        auctionNumber: Number(auctionId),
        owner,
        startTime: new Date(Number(startTime) * 1000).toString(),
        endTime: new Date(Number(endTime) * 1000).toString(),
        highestBid: highestBid.toString(),
        highestBidder,
        ended,
        currentPrice: currentPrice.toString(),
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

export const createAuction: RequestHandler = async (req, res) => {
  try {
    const { startPrice, priceDecrement, auctionType, durationInDays } = req.body;
    let endTime = BigInt((Date.now() / 1000 + durationInDays * 24 * 60 * 60).toFixed());
    const txHash = await walletClient.writeContract({
      address: MultiAuctionAddress,
      abi: MultiAuctionAbi,
      functionName: "createAuction",
      args: [auctionType, parseEther(startPrice.toString()), endTime, parseEther(priceDecrement.toString())],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "success") {
      res.status(201).json({ status: true, txHash });
    } else {
      res.status(500).json({ status: false, txHash });
    }
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};

export const placeBid: RequestHandler = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const bid = parseEther(amount.toString());
    const txHash = await walletClient.writeContract({
      address: MultiAuctionAddress,
      abi: MultiAuctionAbi,
      functionName: "placeBid",
      args: [BigInt(auctionId) - 1n],
      value: bid,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "success") {
      res.status(201).json({ status: true, txHash });
    } else {
      res.status(500).json({ status: false, txHash });
    }
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};

export const endAuction: RequestHandler = async (req, res) => {
  try {
    const txHash = await walletClient.writeContract({
      abi: MultiAuctionAbi,
      address: MultiAuctionAddress,
      functionName: "endAuction",
      args: [BigInt(req.body.auctionId) - 1n],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "success") {
      res.status(201).json({ status: true, txHash });
    } else {
      res.status(500).json({ status: false, txHash });
    }
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};

// Returns balance of server wallet client
export const getBalance: RequestHandler = async (req, res) => {
  try {
    const balance = formatEther(await publicClient.getBalance({ address: walletClient.account.address }));
    res.status(200).json({ status: true, data: balance });
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ status: false, error: "Something went wrong..." });
  }
};
