import { useParams } from "react-router-dom";
import useAuction from "../../hooks/useAuction";
import { Box, Card, Grid2, Skeleton, Typography } from "@mui/material";
import { AuctionType } from "../../types";
import moment from "moment";

const AuctionDetails = () => {
  const params = useParams();
  const { auction, isLoading } = useAuction(Number(params.auctionId || 0));
  console.log("auction,isLoading =>", auction, isLoading);
  if (isLoading) return <Skeleton height={100} />;
  if (!auction) return <Typography>Auction Not Found!</Typography>;
  console.log("auction =>", auction);
  return (
    <Box>
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              ID
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {auction?.auctionNumber}
            </Typography>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              Auction Type
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {Object.entries(AuctionType).find(([_, value]) => value === Number(auction.auctionType))?.[0]}
            </Typography>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              Started At
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {moment(auction?.startTime).fromNow()}
            </Typography>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              End At
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {moment(auction?.endTime).fromNow()}
            </Typography>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              Status
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {auction.ended ? "Ended" : "Not Ended"}
            </Typography>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default AuctionDetails;
