import mongoose from "mongoose";
import { Address, Hex } from "viem";

export interface IBid {
  auctionNumber: number;
  bidder: Address;
  bid: string;
  txHash: Hex;
  timestamp: Date;
  newPrice: string; // Used for Dutch Auction
}

const bidSchema = new mongoose.Schema<IBid>(
  {
    auctionNumber: {
      type: Number,
      unique: true,
      required: true,
    },
    bidder: {
      type: String,
      required: [true, "Please provide an address"],
      index: true,
    },
    txHash: {
      type: String,
      required: [true, "Please provide an address"],
      unique: true,
    },
    timestamp: { type: Date, required: true },
    bid: { type: String, required: true },
    newPrice: { type: String, required: true },
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

var Bid = mongoose.model("Bid", bidSchema);

export default Bid;
