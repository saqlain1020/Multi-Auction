import { Address } from "viem";

export enum AuctionType {
  English,
  Dutch,
  SealedBid,
}

export interface ApiAuction {
  auctionNumber: number;
  auctionType: string;
  createdAt: string;
  endTime: string;
  ended: boolean;
  id: string;
  owner: string;
  startTime: string;
  startPrice: string;
  currentPrice?: string;
  highestBidder?: string;
  priceDecrement?: string;
  highestBid?: string;
  updatedAt: string;
  _id: string;
  bids?: AuctionBid[];
}

export interface AuctionBid {
  auctionNumber: number;
  bid: string;
  bidder: Address;
  newPrice: string;
  timestamp: string;
  txHash: Address;
}
