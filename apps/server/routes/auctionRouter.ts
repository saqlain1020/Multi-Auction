import { Router } from "express";
import { getAuctionDetails } from "../controllers/auctionController";

const auctionRouter = Router();

auctionRouter.get("/:auctionId", getAuctionDetails);

export default auctionRouter;
