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
  updatedAt: string;
  _id: string;
}
