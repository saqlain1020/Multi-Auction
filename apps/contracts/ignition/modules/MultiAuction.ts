import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultiAuctionModule = buildModule("MultiAuction", (m) => {
  const multiAuction = m.contract("MultiAuction");

  return { multiAuction };
});

export default MultiAuctionModule;
