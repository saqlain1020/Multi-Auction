import { Box, Grid2, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { AuctionType } from "../../types";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import useCreateAuction from "../../hooks/useCreateAuction";
// import { DatePicker } from '@mui/x-date-pickers'

const CreateAuction = () => {
  const [auctionType, setAuctionType] = useState<AuctionType>(AuctionType.English);
  const [startPrice, setStartPrice] = useState("1");
  const [durationInDays, setDuration] = useState("2");
  const [priceDecrement, setPriceDecrement] = useState("0.001");
  const { create, isLoading } = useCreateAuction();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await create({
      auctionType,
      startPrice: Number(startPrice),
      durationInDays: Number(durationInDays),
      priceDecrement: Number(priceDecrement),
    });
  };
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold">
        Create Auction
      </Typography>
      <Paper sx={{ mt: 2, p: 2 }} component={"form"} onSubmit={handleSubmit}>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12 }}>
            <TextField
              fullWidth
              select
              label="Auction Type"
              required
              value={auctionType}
              onChange={(e) => setAuctionType(e.target.value as unknown as AuctionType)}
            >
              <MenuItem value={AuctionType.English}>English</MenuItem>
              <MenuItem value={AuctionType.Dutch}>Dutch</MenuItem>
              <MenuItem value={AuctionType.SealedBid}>SealedBid</MenuItem>
            </TextField>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              label={"Start Price"}
              type="number"
              required
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              required
              label="Auction Duration (days)"
              fullWidth
              value={durationInDays}
              onChange={(e) => {
                setDuration(e.target.value);
              }}
            />
          </Grid2>
          {auctionType === AuctionType.Dutch && (
            <Grid2 size={{ xs: 12 }}>
              <TextField
                type="number"
                required
                label="Price Decrement (minute)"
                fullWidth
                value={priceDecrement}
                onChange={(e) => {
                  setPriceDecrement(e.target.value);
                }}
              />
            </Grid2>
          )}
        </Grid2>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <LoadingButton loading={isLoading} type="submit" variant="contained">
            Create Auction
          </LoadingButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateAuction;
