import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import useGetAuctions from "../../hooks/useGetAuctions";
import { AuctionType } from "../../types";
import moment from "moment";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";

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
              <TableCell align="left">Start</TableCell>
              <TableCell align="left">End</TableCell>
              <TableCell align="left">Owner</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Details/Bid</TableCell>
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
                <TableCell align="left">{moment(row.startTime).fromNow()}</TableCell>
                <TableCell align="left">{moment(row.endTime).fromNow()}</TableCell>
                <TableCell align="left">{row.owner}</TableCell>
                <TableCell align="center">{row.ended ? "Ended" : "Active"}</TableCell>
                <TableCell align="left">
                  {/* @ts-expect-error */}
                  <Button size="small" variant="contained" LinkComponent={Link} to={`/auction/${row.auctionNumber}`}>
                    Click Me
                  </Button>
                </TableCell>
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
