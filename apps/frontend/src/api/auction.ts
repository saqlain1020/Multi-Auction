import backendApi from ".";
import { ApiAuction, AuctionType } from "../types";

export const createAuctionApi = async (obj: {
  auctionType: AuctionType;
  startPrice: number;
  durationInDays: number;
  priceDecrement: number;
}) => {
  const { auctionType, durationInDays, priceDecrement, startPrice } = obj;
  const { data } = await backendApi.post("/api/auction", { startPrice, priceDecrement, auctionType, durationInDays });
  return data;
};

export const getAllAuctions = async (params: { page: number; limit: number }) => {
  const { limit, page } = params;
  const { data } = await backendApi.get<{ status: boolean; data: ApiAuction[] }>("/api/auction", {
    params: { limit, page, sort: "-auctionNumber" },
  });
  return data;
};
