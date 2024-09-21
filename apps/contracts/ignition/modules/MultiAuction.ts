import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// const ONE_GWEI: bigint = parseEther("0.001");

const MultiAuctionModule = buildModule("MultiAuction", (m) => {
  const bidExtensionTime = BigInt(120); // 2 minutes

  const verifyingPaymaster = m.contract("MultiAuction", [bidExtensionTime]);

  return { verifyingPaymaster };
});

export default MultiAuctionModule;
