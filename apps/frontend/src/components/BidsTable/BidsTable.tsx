import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { FC } from "react";
import { AuctionBid } from "../../types";
import { truncateAddress } from "../../utils/common";
import { formatEther } from "viem";
import moment from "moment";

const BidsTable: FC<{ bids: AuctionBid[] }> = ({ bids }) => {
  console.log("bids =>", bids);
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={600}>
        Bids
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">Bidder</TableCell>
              <TableCell align="center">Bid</TableCell>
              <TableCell align="center">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.map((bid, i) => (
              <TableRow key={i}>
                <TableCell align="left">{truncateAddress(bid.bidder)}</TableCell>
                <TableCell align="center">{formatEther(BigInt(bid.bid))} ETH</TableCell>
                <TableCell align="center">{moment(bid.timestamp).calendar()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BidsTable;
