import { toast } from "react-toastify";
import { createAuctionApi } from "../api/auction";
import { useIsMutating, useMutation } from "@tanstack/react-query";

const useCreateAuction = () => {
  const { mutateAsync } = useMutation({
    mutationFn: createAuctionApi,
    mutationKey: ["create-auction"],
    onSuccess: () => {
      toast("Auction created successfully", { type: "success" });
    },
    onError: () => {
      toast("Error creating auction", { type: "error" });
    },
  });

  const isMutating = useIsMutating({ mutationKey: ["create-auction"] }) > 0;

  return { create: mutateAsync, isLoading: isMutating };
};

export default useCreateAuction;
