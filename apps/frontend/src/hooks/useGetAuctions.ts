import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getAllAuctions } from "../api/auction";
import { ApiAuction } from "../types";

const limit = 2;
const useGetAuctions = () => {
  const { fetchNextPage, hasNextPage, isFetchingNextPage, data } = useInfiniteQuery({
    queryKey: ["get", "auctions"],
    queryFn: ({ pageParam }) => getAllAuctions({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
      return lastPage.data.length >= limit ? lastPageParam + 1 : undefined;
    },
    // getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => firstPage.prevCursor,
    select(data) {
      let dt: ApiAuction[] = [];
      data.pages.forEach((page) => {
        dt = dt.concat(page.data);
      });
      return dt;
    },
  });

  return { fetchNextPage, hasNextPage, isFetchingNextPage, data };
};

export default useGetAuctions;
