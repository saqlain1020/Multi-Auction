import mongoose from "mongoose";
import { Address } from "viem";
import { AuctionType } from "../types";

export interface ISetting {
  lastBlockRead: number;
}

const settingSchema = new mongoose.Schema<ISetting>(
  {
    lastBlockRead: {
      type: Number,
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

var Setting = mongoose.model("Setting", settingSchema);

export default Setting;
