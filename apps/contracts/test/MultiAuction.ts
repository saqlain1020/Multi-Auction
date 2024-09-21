import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("MultiAuction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMultiAuction() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    console.log("owner.account.address =>", owner.account.address);
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

  describe("English Auction", function () {
    it("Create English Auction", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      const durationInDays = 2;
      await MultiAuction.write.createEnglishAuction([durationInDays, parseEther("0.01")]);
      expect(await MultiAuction.read.totalAuctions()).to.equal(1n);
      const [
        auctionType,
        beneficiary,
        endTime,
        winner,
        highestBid,
        startPrice,
        highestBidder,
        startTime,
        priceDecrementPerHour,
        floorPrice,
      ] = await MultiAuction.read.auctions([0n]);
      expect(auctionType).to.equal(0);
      expect(beneficiary).to.equal(getAddress(owner.account.address));
      expect(winner).to.equal("0x0000000000000000000000000000000000000000");
      expect(startPrice).to.equal(parseEther("0.01"));
      expect(highestBid).to.equal(0n);
      expect(highestBidder).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Place Bid English", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      const durationInDays = 2;
      await MultiAuction.write.createEnglishAuction([durationInDays, parseEther("0.01")]);
      await MultiAuction.write.placeBid([0n], { value: parseEther("0.02") });
      const auction = await MultiAuction.read.auctions([0n]);
      expect(auction[4]).to.equal(parseEther("0.02"));
      expect(auction[6]).to.equal(getAddress(owner.account.address));
    });

    it("No bid after end time", async function () {
      const { MultiAuction, owner, publicClient } = await loadFixture(deployMultiAuction);
      const durationInDays = 2;
      await MultiAuction.write.createEnglishAuction([durationInDays, parseEther("0.01")]);
      // let bal = await publicClient.getBalance({ address: owner.account.address });
      const [, , endTime] = await MultiAuction.read.auctions([0n]);
      await time.increase(24 * 60 * 60);
      await MultiAuction.write.placeBid([0n], { value: parseEther("0.02") });
      // expect(await publicClient.getBalance({ address: owner.account.address })).to.equal(bal - parseEther("0.02"));
      await time.increase(24 * 60 * 60);

      await expect(MultiAuction.write.placeBid([0n], { value: parseEther("0.03") })).to.be.rejectedWith("AuctionEnded");

      expect((await MultiAuction.read.auctions([0n]))[4]).to.be.equals(parseEther("0.02"));
    });
  });
});




