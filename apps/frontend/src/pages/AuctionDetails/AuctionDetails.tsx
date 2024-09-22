import { useParams } from "react-router-dom";
import useAuction from "../../hooks/useAuction";
import { Box, Card, Grid2, Paper, Skeleton, TextField, Tooltip, Typography } from "@mui/material";
import { AuctionType } from "../../types";
import moment from "moment";
import { formatEther, zeroAddress } from "viem";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { truncateAddress } from "../../utils/common";

const AuctionDetails = () => {
  const [amount, setAmount] = useState("0.00001");
  const params = useParams();
  const { auction, isLoading, placeBid, isBidding, endAuction, isEndingAuction } = useAuction(
    Number(params.auctionId || 0),
  );
  const handleBidSumbit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await placeBid({
      auctionId: Number(params.auctionId || 0),
      amount: Number(amount),
    });
  };

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
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              Starting Price
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {formatEther(BigInt(auction.startPrice))}
            </Typography>
          </Card>
        </Grid2>
        <Grid2 size={{ xs: 6, sm: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography align="center" color="primary">
              Current Price
            </Typography>
            <Typography variant="h6" align="center" fontWeight={600}>
              {formatEther(BigInt(auction.currentPrice || 0))}
            </Typography>
          </Card>
        </Grid2>
        {Number(auction.auctionType) === AuctionType.Dutch && (
          <Grid2 size={{ xs: 6, sm: 4 }}>
            <Card sx={{ p: 2 }}>
              <Typography align="center" color="primary">
                Price Decrement
              </Typography>
              <Typography variant="h6" align="center" fontWeight={600}>
                {formatEther(BigInt(auction.priceDecrement || 0))}
              </Typography>
            </Card>
          </Grid2>
        )}
        {auction.highestBidder !== zeroAddress && (
          <Grid2 size={{ xs: 6, sm: 4 }}>
            <Card sx={{ p: 2 }}>
              <Typography align="center" color="primary">
                Highest Bidder
              </Typography>
              <Tooltip title={auction.highestBidder}>
                <Typography variant="h6" align="center" fontWeight={600}>
                  {truncateAddress(auction.highestBidder || "")}
                </Typography>
              </Tooltip>
            </Card>
          </Grid2>
        )}
        {Number(formatEther(BigInt(auction.highestBid || 0))) > 0 && (
          <Grid2 size={{ xs: 6, sm: 4 }}>
            <Card sx={{ p: 2 }}>
              <Typography align="center" color="primary">
                Highest Bid
              </Typography>
              <Typography variant="h6" align="center" fontWeight={600}>
                {formatEther(BigInt(auction.highestBid || 0))}
              </Typography>
            </Card>
          </Grid2>
        )}
      </Grid2>
      <Typography sx={{ mt: 4 }} variant="h5" fontWeight={600}>
        Place Bid
      </Typography>
      <Paper sx={{ p: 2, maxWidth: 400, mt: 2 }} component="form" onSubmit={handleBidSumbit}>
        <TextField
          fullWidth
          required
          label="Bid Amount (ETH)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <LoadingButton loading={isBidding} fullWidth sx={{ mt: 2 }} type="submit" variant="contained">
          Place
        </LoadingButton>
        <Tooltip placement="top" title={moment().isBefore(moment(auction.endTime)) ? "Wait for auction to end!" : ""}>
          <span>
            <LoadingButton
              loading={isEndingAuction}
              disabled={moment().isBefore(moment(auction.endTime))}
              onClick={() => endAuction({ auctionId: Number(params.auctionId) })}
              fullWidth
              sx={{ mt: 2 }}
              variant="contained"
            >
              End Auction
            </LoadingButton>
          </span>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default AuctionDetails;
