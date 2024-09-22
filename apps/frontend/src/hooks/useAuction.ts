import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { endAuctionApi, getAuction, placeBidApi } from "../api/auction";
import { toast } from "react-toastify";

const useAuction = (auctionId: number) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auction", auctionId],
    queryFn: () => getAuction(auctionId),
  });

  const { mutateAsync } = useMutation({
    mutationKey: ["place-bid"],
    mutationFn: placeBidApi,
    onSuccess: () => {
      toast("Bid placed successfully", { type: "success" });
      setTimeout(() => refetch(), 5000);
    },
    onError: () => {
      toast("Error placing bid", { type: "error" });
    },
  });

  const { mutateAsync: endAuction } = useMutation({
    mutationKey: ["end-auction"],
    mutationFn: endAuctionApi,
    onSuccess: () => {
      toast("Auction ended successfully", { type: "success" });
      setTimeout(() => refetch(), 5000);
    },
    onError: () => {
      toast("Error ending auction", { type: "error" });
    },
  });

  const isBidding = useIsMutating({ mutationKey: ["place-bid"] }) > 0;
  const isEndingAuction = useIsMutating({ mutationKey: ["end-auction"] }) > 0;

  return { auction: data, endAuction, isEndingAuction, isBidding, placeBid: mutateAsync, isLoading, refetch };
};

export default useAuction;
