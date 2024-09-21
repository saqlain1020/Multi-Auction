import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

describe("MultiAuction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultiAuction() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const bidExtensionTime = BigInt(120); // 2 minutes
    const MultiAuction = await hre.viem.deployContract("MultiAuction", [bidExtensionTime]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      MultiAuction,
      owner,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with address", async function () {
      const { MultiAuction } = await loadFixture(deployMultiAuction);
      console.log("MultiAuction.address =>", MultiAuction.address);
    });

    it("Should set the right owner", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      expect(await MultiAuction.read.owner()).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Auctions", function () {
    it("Read Auction", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      // const auc = await MultiAuction.read.sealedAuctions([0n]);
      // console.log("auc =>", auc);
      // const bidders = await MultiAuction.read.readSealedAuctionBid([0n]);
      // console.log("bidders =>", bidders);
    });
  });
});





