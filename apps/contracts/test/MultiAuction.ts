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
      const twoDaysAfter = BigInt(((new Date().getTime() + 1000 * 60 * 60 * 2) / 1000).toFixed());
      await MultiAuction.write.createEnglishAuction([twoDaysAfter, parseEther("0.01")]);
      expect(await MultiAuction.read.totalAuctions()).to.equal(1n);
      const [
        auctionType,
        beneficiary,
        endTime,
        winner,
        startPrice,
        highestBid,
        highestBidder,
        startTime,
        priceDecrementPerHour,
        floorPrice,
      ] = await MultiAuction.read.auctions([0n]);
      expect(auctionType).to.equal(0);
      expect(beneficiary).to.equal(getAddress(owner.account.address));
      expect(endTime).to.equal(twoDaysAfter);
      expect(winner).to.equal("0x0000000000000000000000000000000000000000");
      expect(startPrice).to.equal(parseEther("0.01"));
      expect(highestBid).to.equal(0n);
      expect(highestBidder).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Place Bid English", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      const twoDaysAfter = BigInt(((new Date().getTime() + 1000 * 60 * 60 * 2) / 1000).toFixed());
      await MultiAuction.write.createEnglishAuction([twoDaysAfter, parseEther("0.01")]);
      await MultiAuction.write.placeBid([0n], { value: parseEther("0.02") });
      const auction = await MultiAuction.read.auctions([0n]);
      expect(auction[5]).to.equal(parseEther("0.02"));
      expect(auction[6]).to.equal(getAddress(owner.account.address));
    });

    it("No bid after end time", async function () {
      const { MultiAuction, owner } = await loadFixture(deployMultiAuction);
      const twoDaysAfter = BigInt(((new Date().getTime() + 1000 * 60 * 60 * 2) / 1000).toFixed());
      await MultiAuction.write.createEnglishAuction([twoDaysAfter, parseEther("0.01")]);

      await time.increaseTo(twoDaysAfter - 10n);
      await MultiAuction.write.placeBid([0n], { value: parseEther("0.02") });
      await time.increaseTo(twoDaysAfter);

      await expect(MultiAuction.write.placeBid([0n], { value: parseEther("0.02") })).to.be.rejectedWith(
        "MultiAuction: Auction has already ended."
      );
    });

    it("Increase auction time at close to end bid",async function(){
      
    })
  });
});

