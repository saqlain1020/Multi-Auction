import backendApi from ".";
import { ApiAuction, AuctionType } from "../types";

export const getAuction = async (auctionId: number) => {
  const { data } = await backendApi.get<{ status: boolean; data: ApiAuction }>("/api/auction/" + auctionId);
  return data.data;
};

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

export const placeBidApi = async (params: { auctionId: number; amount: number }) => {
  const { amount, auctionId } = params;
  const { data } = await backendApi.post("/api/auction/bid/" + auctionId, { amount });
  return data;
};

export const endAuctionApi = async (params: { auctionId: number }) => {
  const { auctionId } = params;
  const { data } = await backendApi.post("/api/auction/end-auction", { auctionId });
  return data;
};

export const getBalanceApi = async () => {
  const { data } = await backendApi.get("/api/auction/balance");
  return data.data as string;
};
