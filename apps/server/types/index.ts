import { Address } from "viem";

export enum AuctionType {
  English,
  Dutch,
  SealedBid,
}

// export interface Auction {
//   owner: Address;
//   startTime: BigInt;
//   endTime: BigInt;
//   highestBid: BigInt;
//   highestBidder: Address;
//   ended: boolean;
//   auctionType: AuctionType;
//   startPrice: BigInt; // Used for Dutch Auction
//   priceDecrement: BigInt; // Used for Dutch Auction
// }
