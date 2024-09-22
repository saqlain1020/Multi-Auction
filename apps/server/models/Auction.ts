import mongoose from "mongoose";
import { Address } from "viem";
import { AuctionType } from "../types";

export interface IAuction {
  auctionNumber: number;
  owner: Address;
  startTime: Date;
  endTime: Date;
  highestBid: string;
  highestBidder: Address;
  currentPrice?: string;
  ended: boolean;
  auctionType: string;
  startPrice: string; // Used for Dutch Auction
  priceDecrement: string; // Used for Dutch Auction
  winner?: Address;
}

const auctionSchema = new mongoose.Schema<IAuction>(
  {
    auctionNumber: {
      type: Number,
      unique: true,
      required: true,
    },
    owner: {
      type: String,
      required: [true, "Please provide an address"],
      index: true,
    },
    winner: {
      type: String,
      index: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    highestBid: { type: String },
    currentPrice: { type: String },
    highestBidder: { type: String },
    ended: { type: Boolean, default: false },
    auctionType: { type: String, enum: Object.values(AuctionType), required: true },
    startPrice: {
      type: String,
      required() {
        return this.auctionType === (AuctionType.Dutch as unknown as string);
      },
    },
    priceDecrement: {
      type: String,
      required() {
        return this.auctionType === (AuctionType.Dutch as unknown as string);
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

var Auction = mongoose.model("Auction", auctionSchema);

export default Auction;
