import { Router } from "express";
import {
  createAuction,
  endAuction,
  getAllAuctions,
  getAuctionDetails,
  getBalance,
  placeBid,
} from "../controllers/auctionController";

const auctionRouter = Router();

auctionRouter.get("/", getAllAuctions);
auctionRouter.post("/end-auction", endAuction);
auctionRouter.post("/bid/:auctionId", placeBid);
auctionRouter.post("/", createAuction);
auctionRouter.get("/balance", getBalance);
auctionRouter.get("/:auctionId", getAuctionDetails);

export default auctionRouter;
