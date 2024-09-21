// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiAuction {
  struct Auction {
    address payable owner;
    uint startTime;
    uint endTime;
    uint highestBid;
    address highestBidder;
    bool ended;
    AuctionType auctionType;
    uint startPrice; // Used for Dutch Auction
    uint priceDecrement; // Used for Dutch Auction
    mapping(address => uint) bids;
  }
  enum AuctionType {
    English,
    Dutch,
    SealedBid
  }
  mapping(uint => Auction) public auctions;
  uint public auctionCount;
  event AuctionCreated(uint auctionId, AuctionType auctionType, uint startPrice, uint endTime);
  event NewBid(uint auctionId, address bidder, uint bid, uint newPrice);
  event AuctionEnded(uint auctionId, address winner, uint winningBid);

  function createAuction(AuctionType _type, uint _startPrice, uint _endTime, uint _priceDecrement) public {
    require(_endTime > block.timestamp, "End time must be in the future.");
    Auction storage newAuction = auctions[auctionCount++];
    newAuction.owner = payable(msg.sender);
    newAuction.startTime = block.timestamp;
    newAuction.endTime = _endTime;
    newAuction.auctionType = _type;
    newAuction.startPrice = _startPrice;
    newAuction.priceDecrement = _priceDecrement;
    emit AuctionCreated(auctionCount, _type, _startPrice, _endTime);
  }

  function placeBid(uint _auctionId) public payable {
    Auction storage auction = auctions[_auctionId];
    require(!auction.ended, "Auction has already ended.");
    require(block.timestamp < auction.endTime, "Auction already ended.");
    uint currentPrice = getCurrentPrice(_auctionId);
    require(msg.value >= currentPrice, "Bid is too low.");
    if (auction.auctionType == AuctionType.English) {
      require(msg.value > auction.highestBid, "There is already a higher bid.");
      if (auction.highestBidder != address(0)) {
        require(block.timestamp <= auction.endTime - 10 seconds, "Bid too close to auction end time.");
      }
      address payable previousBidder = payable(auction.highestBidder);
      uint previousBid = auction.highestBid;
      previousBidder.transfer(previousBid); // This should happen after updating all state variables
      auction.highestBid = msg.value;
      auction.highestBidder = msg.sender;
    } else if (auction.auctionType == AuctionType.Dutch) {
      auction.ended = true;
      auction.highestBid = msg.value;
      auction.highestBidder = msg.sender;
    } else {
      auction.bids[msg.sender] += msg.value;
    }
    emit NewBid(_auctionId, msg.sender, msg.value, currentPrice);
  }

  function getCurrentPrice(uint _auctionId) public view returns (uint) {
    Auction storage auction = auctions[_auctionId];
    if (auction.auctionType == AuctionType.Dutch) {
      uint timeElapsed = block.timestamp - auction.startTime;
      uint priceDecrements = timeElapsed / 1 minutes;
      uint currentPrice = auction.startPrice - (priceDecrements * auction.priceDecrement);
      return currentPrice > 0 ? currentPrice : 0;
    } else {
      return auction.highestBid;
    }
  }

  function endAuction(uint _auctionId) public {
    Auction storage auction = auctions[_auctionId];
    require(msg.sender == auction.owner, "Not the auction owner.");
    require(!auction.ended, "Auction already ended.");
    require(block.timestamp >= auction.endTime, "Auction not yet ended.");
    auction.ended = true;
    auction.owner.transfer(auction.highestBid);
    emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
  }
}
