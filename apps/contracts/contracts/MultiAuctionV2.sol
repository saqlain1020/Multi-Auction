// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

error NotAuctionCreator();
error AuctionNotEnded();
error AuctionEndedError();
error TransferFailed(address _address, uint _value);
error InvalidAuctionType();

/**
 * @title MultiAuctionV2
 * @dev A smart contract that implements multiple auction types: English, Dutch, and Sealed auctions.
 *      It supports bid placements, auction creation, bid withdrawals for Sealed auctions,
 *      and various auction-related functionalities.
 */
contract MultiAuctionV2 is Ownable, ReentrancyGuard {
  struct SealedBids {
    address bidder;
    uint bid;
  }

  enum AuctionType {
    English,
    Dutch,
    Sealed
  }

  struct Auction {
    // Common Fields
    AuctionType auctionType;
    address beneficiary;
    uint endTime;
    address winner;
    uint highestBid;
    // English Auction
    uint startPrice;
    address highestBidder;
    // Dutch Auction
    // uint startPrice; // Start price also included
    uint startTime;
    uint priceDecrementPerHour; // Price Decrement in Eth
    uint floorPrice; // Price after which no decrement will be made
    // Sealed Bid Auction
    mapping(address => uint) bids; // Mapping of bidders and their bids
    mapping(address => bool) withdrawnSealedBids; // Track if a sealed bid has been withdrawn
  }

  mapping(uint256 => Auction) public auctions;
  mapping(uint256 => address) private sealedAuctionHighestBidders;

  /**
   * @notice Time in seconds to increase an English auction deadline if bid is placed at the end.
   */
  uint public englishAuctionBidExtensionTime;

  /**
   * @notice Total number of auctions ever created
   */
  uint public totalAuctions;

  /**
   * @dev Constructor for the MultiAuctionV2 contract.
   * @param _englishAuctionBidExtensionTime Time extension in seconds for English auctions if a bid is placed near the end.
   */
  constructor(uint _englishAuctionBidExtensionTime) Ownable(_msgSender()) {
    englishAuctionBidExtensionTime = _englishAuctionBidExtensionTime;
  }

  // Events for logging auction activities
  event EnglishAuctionCreated(uint auctionId, address indexed beneficiary, uint endTime, uint startPrice);
  event DutchAuctionCreated(
    uint auctionId,
    address indexed beneficiary,
    uint endTime,
    uint startPrice,
    uint startTime,
    uint priceDecrementPerHour,
    uint floorPrice
  );
  event SealedAuctionCreated(uint auctionId, address indexed beneficiary, uint endTime);
  event EnglishBidPlaced(uint auctionId, address indexed bidder, uint bid);
  event EnglishAuctionExtended(uint auctionId, uint newEndTime);
  event DutchBidPlaced(uint auctionId, address indexed bidder, uint bid);
  event AuctionEnded(uint auctionId, address winner, uint winningBid);
  event SealedBidWithdrawn(uint auctionId, address indexed bidder, uint bid);

  /**
   * @notice Create an English auction.
   * @param _endTimeInDays Duration of the auction in days.
   * @param _startPrice Starting price for the auction.
   */
  function createEnglishAuction(uint32 _endTimeInDays, uint _startPrice) external {
    Auction storage auction = auctions[totalAuctions];
    auction.beneficiary = _msgSender();
    auction.auctionType = AuctionType.English;
    uint _endTime = block.timestamp + (_endTimeInDays * 24 * 60 * 60);
    auction.endTime = _endTime;
    require(_startPrice > 0, "MultiAuction: Start price cannot be zero.");
    auction.startPrice = _startPrice;
    totalAuctions++;
    emit EnglishAuctionCreated(totalAuctions - 1, _msgSender(), _endTime, _startPrice);
  }

  /**
   * @notice Create a Dutch auction.
   * @param _endTimeInDays Duration of the auction in days.
   * @param _startPrice Starting price for the auction.
   * @param _priceDecrementPerHour Price decrement in ETH per hour.
   * @param _floorPrice Minimum price at which the auction stops decreasing.
   */
  function createDutchAuction(
    uint32 _endTimeInDays,
    uint _startPrice,
    uint _priceDecrementPerHour,
    uint _floorPrice
  ) external {
    Auction storage auction = auctions[totalAuctions];
    auction.beneficiary = _msgSender();
    auction.auctionType = AuctionType.Dutch;
    uint _endTime = block.timestamp + (_endTimeInDays * 24 * 60 * 60);
    auction.endTime = _endTime;
    require(_startPrice > 0, "MultiAuction: Start price cannot be zero.");
    auction.startPrice = _startPrice;
    require(_floorPrice <= _startPrice, "MultiAuction: Floor price cannot be greater than start price.");
    auction.floorPrice = _floorPrice;
    require(_priceDecrementPerHour > 0, "MultiAuction: Price decrement must be greater than zero.");
    auction.priceDecrementPerHour = _priceDecrementPerHour;
    auction.startTime = block.timestamp;
    totalAuctions++;
    emit DutchAuctionCreated(
      totalAuctions - 1,
      _msgSender(),
      _endTime,
      _startPrice,
      block.timestamp,
      _priceDecrementPerHour,
      _floorPrice
    );
  }

  /**
   * @notice Create a sealed-bid auction.
   * @param _endTimeInDays Duration of the auction in days.
   */
  function createSealedAuction(uint32 _endTimeInDays) external {
    Auction storage auction = auctions[totalAuctions];
    uint _endTime = block.timestamp + (_endTimeInDays * 24 * 60 * 60);
    auction.beneficiary = _msgSender();
    auction.auctionType = AuctionType.Sealed;
    auction.endTime = _endTime;
    totalAuctions++;
    emit SealedAuctionCreated(totalAuctions - 1, _msgSender(), _endTime);
  }

  function bidOnEnglishAuction(uint _auctionId) internal onlyActiveAuction(_auctionId) {
    Auction storage auction = auctions[_auctionId];
    uint newBid = msg.value;

    // For first bid, highest will always be 0, hence condition returns true
    require(newBid > auction.highestBid, "MultiAuction: Bid must be higher than current highest bid.");
    require(newBid >= auction.startPrice, "MultiAuction: Bid must be higher than start price.");
    if (auction.highestBidder != address(0)) {
      (bool sent, ) = auction.highestBidder.call{value: auction.highestBid}("");
      if (!sent) revert TransferFailed(auction.highestBidder, auction.highestBid);
    }
    auction.highestBid = newBid;
    auction.highestBidder = _msgSender();

    // Extend auction end time if bid is placed at the end, for fairness
    if (block.timestamp >= auction.endTime - englishAuctionBidExtensionTime) {
      auction.endTime += englishAuctionBidExtensionTime;
      emit EnglishAuctionExtended(_auctionId, auction.endTime);
    }

    emit EnglishBidPlaced(_auctionId, _msgSender(), newBid);
  }

  function bidOnDutchAuction(uint _auctionId) internal onlyActiveAuction(_auctionId) {
    Auction storage auction = auctions[_auctionId];
    // Cannot bid on an ended auction
    require(auction.winner == address(0), "MultiAuction: Auction winner decided.");
    uint newBid = msg.value;
    uint256 currentPrice = auction.startPrice -
      (((block.timestamp - auction.startTime) / 3600) * auction.priceDecrementPerHour);
    if (currentPrice < auction.floorPrice) {
      currentPrice = auction.floorPrice;
    }
    require(newBid >= currentPrice, "MultiAuction: Bid must be higher than current price.");

    (bool sent, ) = auction.beneficiary.call{value: newBid}("");
    if (!sent) revert TransferFailed(auction.beneficiary, newBid);
    auction.highestBid = newBid;
    auction.highestBidder = _msgSender();
    auction.winner = _msgSender();
    emit DutchBidPlaced(_auctionId, _msgSender(), newBid);
    emit AuctionEnded(_auctionId, _msgSender(), newBid);
  }

  function bidOnSealedAuction(uint _auctionId) internal onlyActiveAuction(_auctionId) {
    Auction storage auction = auctions[_auctionId];
    uint newBid = msg.value;

    // If bidder has already bid, increase bid by previous bid
    if (auction.bids[_msgSender()] > 0) {
      auction.bids[_msgSender()] += newBid;
      newBid = auction.bids[_msgSender()];
    } else {
      auction.bids[_msgSender()] = newBid;
    }

    // Update highest bidder if new bid is higher
    if (auction.bids[sealedAuctionHighestBidders[_auctionId]] < newBid) {
      sealedAuctionHighestBidders[_auctionId] = _msgSender();
    }
  }

  function placeBid(uint _auctionId) external payable nonReentrant onlyActiveAuction(_auctionId) {
    if (auctions[_auctionId].auctionType == AuctionType.English) {
      bidOnEnglishAuction(_auctionId);
    } else if (auctions[_auctionId].auctionType == AuctionType.Dutch) {
      bidOnDutchAuction(_auctionId);
    } else if (auctions[_auctionId].auctionType == AuctionType.Sealed) {
      bidOnSealedAuction(_auctionId);
    }
  }

  function withdraw(
    uint _auctionId
  ) external nonReentrant onlyAuctionCreator(_auctionId) onlyInactiveAuction(_auctionId) {
    if (auctions[_auctionId].auctionType == AuctionType.English) {
      withdrawEnglishAuction(_auctionId);
    } else if (auctions[_auctionId].auctionType == AuctionType.Sealed) {
      withdrawSealedAuction(_auctionId);
    } else {
      revert("MultiAuction: Invalid auction type.");
    }
  }

  function withdrawEnglishAuction(uint _auctionId) internal {
    Auction storage auction = auctions[_auctionId];

    require(auction.winner == address(0), "MultiAuction: Auction already withdrawn.");
    require(auction.highestBidder != address(0), "MultiAuction: No bids placed.");

    auction.winner = auction.highestBidder;

    (bool sent, ) = auction.beneficiary.call{value: auction.highestBid}("");
    if (!sent) revert TransferFailed(auction.beneficiary, auction.highestBid);
    emit AuctionEnded(_auctionId, auction.winner, auction.highestBid);
  }

  function withdrawSealedAuction(uint _auctionId) internal {
    Auction storage auction = auctions[_auctionId];

    require(auction.winner == address(0), "MultiAuction: Auction already withdrawn.");

    require(auction.highestBidder != address(0), "MultiAuction: Auction didn't received bids.");
    address highestBidder = sealedAuctionHighestBidders[_auctionId];
    uint _highestBid = auction.bids[highestBidder];
    auction.winner = highestBidder;
    (bool sent, ) = auction.beneficiary.call{value: _highestBid}("");
    if (!sent) revert TransferFailed(auction.beneficiary, _highestBid);
    emit AuctionEnded(_auctionId, auction.winner, _highestBid);
  }

  function withdrawSealedBid(uint _auctionId) external nonReentrant onlyInactiveAuction(_auctionId) {
    Auction storage auction = auctions[_auctionId];
    require(sealedAuctionHighestBidders[_auctionId] != _msgSender(), "MultiAuction: Winner cannot withdraw.");
    require(!auction.withdrawnSealedBids[_msgSender()], "MultiAuction: Already Withdrawn.");
    auction.withdrawnSealedBids[_msgSender()] = true;
    (bool sent, ) = _msgSender().call{value: auction.bids[_msgSender()]}("");
    if (!sent) revert TransferFailed(_msgSender(), auction.bids[_msgSender()]);
    emit SealedBidWithdrawn(_auctionId, _msgSender(), auction.bids[_msgSender()]);
  }

  function sealedBidOf(
    address _address,
    uint _auctionId
  ) public view onlyInactiveAuction(_auctionId) returns (uint bid, bool isAvailableToWithdraw) {
    Auction storage auction = auctions[_auctionId];
    require(auction.auctionType == AuctionType.Sealed, "MultiAuction: Auction not of sealed type");
    bid = auction.bids[_address];
    isAvailableToWithdraw = !auction.withdrawnSealedBids[_address];
  }

  function winnerOf(
    uint _auctionId
  ) public view onlyInactiveAuction(_auctionId) returns (address _winner, uint _bid, AuctionType _auctionType) {
    Auction storage auction = auctions[_auctionId];
    _auctionType = auction.auctionType;
    if (_auctionType == AuctionType.English) {
      _winner = auction.highestBidder;
      _bid = auction.highestBid;
    } else if (_auctionType == AuctionType.Dutch) {
      _winner = auction.highestBidder;
      _bid = auction.highestBid;
    } else if (_auctionType == AuctionType.Sealed) {
      _winner = sealedAuctionHighestBidders[_auctionId];
      _bid = auction.bids[_winner];
    }
  }

  /** @notice Modifier for withdrawing only for ended auctions */
  modifier onlyInactiveAuction(uint _auctionId) {
    if (block.timestamp < auctions[_auctionId].endTime) revert AuctionNotEnded();
    _;
  }

  modifier onlyAuctionCreator(uint _auctionId) {
    if (_msgSender() != auctions[_auctionId].beneficiary) revert NotAuctionCreator();
    _;
  }

  /** @notice Modifier for placing bids only for active auctions */
  modifier onlyActiveAuction(uint _auctionId) {
    if (block.timestamp >= auctions[_auctionId].endTime) {
      revert AuctionEndedError();
    }
    _;
  }
}
