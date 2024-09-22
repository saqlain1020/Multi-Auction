import { Box } from "@mui/material";
import useGetAuctions from "../../hooks/useGetAuctions";
import AuctionsList from "../../components/AuctionsList/AuctionsList";

const Home = () => {
  return (
    <Box>
      <AuctionsList />
    </Box>
  );
};

export default Home;
