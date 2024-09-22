import { Router } from "express";
import { createAuction, getAllAuctions, getAuctionDetails } from "../controllers/auctionController";

const auctionRouter = Router();

auctionRouter.get("/", getAllAuctions);
auctionRouter.get("/:auctionId", getAuctionDetails);
auctionRouter.post("/", createAuction);

export default auctionRouter;
