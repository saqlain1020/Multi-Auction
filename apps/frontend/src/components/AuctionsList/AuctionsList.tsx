import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import useGetAuctions from "../../hooks/useGetAuctions";
import { AuctionType } from "../../types";
import moment from "moment";
import { LoadingButton } from "@mui/lab";

const AuctionsList = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetAuctions();

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell align="right">Type</TableCell>
              <TableCell align="right">Start</TableCell>
              <TableCell align="right">End</TableCell>
              <TableCell align="right">Owner</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row, i) => (
              <TableRow key={i} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.auctionNumber}
                </TableCell>
                <TableCell align="right">
                  {Object.entries(AuctionType).find(([_, value]) => value === Number(row.auctionType))?.[0]}
                </TableCell>
                <TableCell align="right">{moment(row.startTime).fromNow()}</TableCell>
                <TableCell align="right">{moment(row.endTime).fromNow()}</TableCell>
                <TableCell align="right">{row.owner}</TableCell>
                <TableCell align="right">{row.ended ? "Ended" : "Active"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {hasNextPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <LoadingButton loading={isFetchingNextPage} onClick={() => fetchNextPage()} variant="outlined">
            Load more
          </LoadingButton>
        </Box>
      )}
    </Box>
  );
};

export default AuctionsList;
