import { useQuery } from "@tanstack/react-query";
import { getBalanceApi } from "../api/auction";

const useBalance = () => {
  const { data } = useQuery({
    queryKey: ["balance"],
    queryFn: getBalanceApi,
    refetchInterval: 10000, // 10s balance refetch
  });

  return { data };
};

export default useBalance;
