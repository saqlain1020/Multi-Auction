import { useQuery } from "@tanstack/react-query";
import { getAuction } from "../api/auction";

const useAuction = (auctionId: number) => {
  const { data, isLoading } = useQuery({
    queryKey: ["auction", auctionId],
    queryFn: () => getAuction(auctionId),
  });

  return { auction: data, isLoading };
};

export default useAuction;
