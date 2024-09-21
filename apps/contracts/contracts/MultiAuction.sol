// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

error NotAuctionCreator();
error AuctionNotEnded();
error AuctionEnded();
error TransferFailed(address _address, uint _value);
error InvalidAuctionType();

contract MultiAuction is Ownable, ReentrancyGuard {
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
        mapping(address => uint) bids;
        mapping(address => bool) withdrawnSealedBids;
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

    constructor(uint _englishAuctionBidExtensionTime) Ownable(_msgSender()) {
        englishAuctionBidExtensionTime = _englishAuctionBidExtensionTime;
    }

    event EnglishAuctionCreated(
        address indexed beneficiary,
        uint endTime,
        uint startPrice
    );
    event DutchAuctionCreated(
        address indexed beneficiary,
        uint endTime,
        uint startPrice,
        uint startTime,
        uint priceDecrementPerHour,
        uint floorPrice
    );
    event SealedAuctionCreated(address indexed beneficiary, uint endTime);

    function createEnglishAuction(
        uint32 _endTimeInDays,
        uint _startPrice
    ) external {
        Auction storage auction = auctions[totalAuctions];
        auction.beneficiary = _msgSender();
        auction.auctionType = AuctionType.English;
        uint _endTime = block.timestamp + (_endTimeInDays * 24 * 60 * 60);
        auction.endTime = _endTime;
        require(_startPrice > 0, "MultiAuction: Start price cannot be zero.");
        auction.startPrice = _startPrice;
        totalAuctions++;
    }

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
        require(
            _floorPrice <= _startPrice,
            "MultiAuction: Floor price cannot be greater than start price."
        );
        auction.floorPrice = _floorPrice;
        require(
            _priceDecrementPerHour > 0,
            "MultiAuction: Price decrement must be greater than zero."
        );
        auction.priceDecrementPerHour = _priceDecrementPerHour;
        auction.startTime = block.timestamp;
        totalAuctions++;
    }

    function createSealedAuction(uint32 _endTimeInDays) external {
        Auction storage auction = auctions[totalAuctions];
        uint _endTime = block.timestamp + (_endTimeInDays * 24 * 60 * 60);
        auction.beneficiary = _msgSender();
        auction.auctionType = AuctionType.Sealed;
        auction.endTime = _endTime;
        totalAuctions++;
    }

    function bidOnEnglishAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        uint newBid = msg.value;

        // For first bid, highest will always be 0, hence condition returns true
        require(
            newBid > auction.highestBid,
            "MultiAuction: Bid must be higher than current highest bid."
        );
        require(
            newBid >= auction.startPrice,
            "MultiAuction: Bid must be higher than start price."
        );
        if (auction.highestBidder != address(0)) {
            (bool sent, ) = auction.highestBidder.call{
                value: auction.highestBid
            }("");
            if (!sent)
                revert TransferFailed(
                    auction.highestBidder,
                    auction.highestBid
                );
        }
        auction.highestBid = newBid;
        auction.highestBidder = _msgSender();

        // Extend auction end time if bid is placed at the end, for fairness
        if (
            block.timestamp >= auction.endTime - englishAuctionBidExtensionTime
        ) {
            auction.endTime += englishAuctionBidExtensionTime;
        }
    }

    function bidOnDutchAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.winner == address(0),
            "MultiAuction: Auction winner decided."
        );
        uint newBid = msg.value;
        uint256 currentPrice = auction.startPrice -
            (((block.timestamp - auction.startTime) / 3600) *
                auction.priceDecrementPerHour);
        if (currentPrice < auction.floorPrice) {
            currentPrice = auction.floorPrice;
        }
        require(
            newBid >= currentPrice,
            "MultiAuction: Bid must be higher than current price."
        );

        (bool sent, ) = auction.beneficiary.call{value: newBid}("");
        if (!sent) revert TransferFailed(auction.beneficiary, newBid);
        auction.highestBid = newBid;
        auction.highestBidder = _msgSender();
        auction.winner = _msgSender();
    }

    function bidOnSealedAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        uint newBid = msg.value;

        if (auction.bids[_msgSender()] > 0) {
            auction.bids[_msgSender()] += newBid;
            newBid = auction.bids[_msgSender()];
        } else {
            auction.bids[_msgSender()] = newBid;
        }

        if (auction.bids[sealedAuctionHighestBidders[_auctionId]] < newBid) {
            sealedAuctionHighestBidders[_auctionId] = _msgSender();
        }
    }

    function placeBid(
        uint _auctionId
    ) external payable nonReentrant onlyActiveAuction(_auctionId) {
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
    )
        external
        nonReentrant
        onlyAuctionCreator(_auctionId)
        onlyInactiveAuction(_auctionId)
    {
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

        require(
            auction.winner == address(0),
            "MultiAuction: Auction already withdrawn."
        );
        require(
            auction.highestBidder != address(0),
            "MultiAuction: No bids placed."
        );

        auction.winner = auction.highestBidder;

        (bool sent, ) = auction.beneficiary.call{value: auction.highestBid}("");
        if (!sent)
            revert TransferFailed(auction.beneficiary, auction.highestBid);
    }

    function withdrawSealedAuction(uint _auctionId) internal {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.winner == address(0),
            "MultiAuction: Auction already withdrawn."
        );

        require(
            auction.highestBidder != address(0),
            "MultiAuction: Auction didn't received bids."
        );
        address highestBidder = sealedAuctionHighestBidders[_auctionId];
        uint _highestBid = auction.bids[highestBidder];
        auction.winner = highestBidder;
        (bool sent, ) = auction.beneficiary.call{value: _highestBid}("");
        if (!sent) revert TransferFailed(auction.beneficiary, _highestBid);
    }

    function withdrawSealedBid(
        uint _auctionId
    ) external nonReentrant onlyInactiveAuction(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(
            sealedAuctionHighestBidders[_auctionId] != _msgSender(),
            "MultiAuction: Winner cannot withdraw."
        );
        require(
            !auction.withdrawnSealedBids[_msgSender()],
            "MultiAuction: Already Withdrawn."
        );
        auction.withdrawnSealedBids[_msgSender()] = true;
        (bool sent, ) = _msgSender().call{value: auction.bids[_msgSender()]}(
            ""
        );
        if (!sent)
            revert TransferFailed(_msgSender(), auction.bids[_msgSender()]);
    }

    function sealedBidOf(
        address _address,
        uint _auctionId
    )
        public
        view
        onlyInactiveAuction(_auctionId)
        returns (uint bid, bool isAvailableToWithdraw)
    {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.auctionType == AuctionType.Sealed,
            "MultiAuction: Auction not of sealed type"
        );
        bid = auction.bids[_address];
        isAvailableToWithdraw = auction.withdrawnSealedBids[_address];
    }

    function winnerOf(
        uint _auctionId
    )
        public
        view
        onlyInactiveAuction(_auctionId)
        returns (address _winner, uint _bid, AuctionType _auctionType)
    {
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
        if (block.timestamp < auctions[_auctionId].endTime)
            revert AuctionNotEnded();
        _;
    }

    modifier onlyAuctionCreator(uint _auctionId) {
        if (_msgSender() != auctions[_auctionId].beneficiary)
            revert NotAuctionCreator();
        _;
    }

    /** @notice Modifier for placing bids only for active auctions */
    modifier onlyActiveAuction(uint _auctionId) {
        if (block.timestamp >= auctions[_auctionId].endTime) {
            revert AuctionEnded();
        }
        _;
    }
}
