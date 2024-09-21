// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error NotAuctionCreator();
error AuctionNotEnded();
error AuctionEnded();
error TransferFailed(address _address, uint _value);
error InvalidAuctionType();

// TODO: sealed bids claim system
// TODO: reentrat guard
// TODO: end time in days
// TODO: error definitions
// TODO: variable packing
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
        // English Auction
        uint startPrice;
        uint highestBid;
        address highestBidder;
        // Dutch Auction
        // uint startPrice; // Start price also included
        uint startTime;
        uint priceDecrementPerHour; // Price Decrement in Eth
        uint floorPrice; // Price after which no decrement will be made
        // Sealed Bid Auction
        address[] bidders;
        mapping(address => uint) bids;
    }

    mapping(uint256 => Auction) public auctions;

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

    function createEnglishAuction(uint _endTime, uint _startPrice) external {
        Auction storage auction = auctions[totalAuctions];
        auction.beneficiary = _msgSender();
        auction.auctionType = AuctionType.English;
        require(
            _endTime > block.timestamp,
            "MultiAuction: Auction cannot end in the past."
        );
        auction.endTime = _endTime;
        require(_startPrice > 0, "MultiAuction: Start price cannot be zero.");
        auction.startPrice = _startPrice;
        totalAuctions++;
    }

    function createDutchAuction(
        uint _endTime,
        uint _startPrice,
        uint _priceDecrementPerHour,
        uint _floorPrice
    ) external {
        Auction storage auction = auctions[totalAuctions];
        auction.beneficiary = _msgSender();
        auction.auctionType = AuctionType.Dutch;
        require(
            _endTime > block.timestamp,
            "MultiAuction: Auction cannot end in the past."
        );
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

    function createSealedAuction(uint _endTime) external {
        Auction storage auction = auctions[totalAuctions];
        auction.beneficiary = _msgSender();
        auction.auctionType = AuctionType.Sealed;
        require(
            _endTime > block.timestamp,
            "MultiAuction: Auction cannot end in the past."
        );
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
            auction.endTime - englishAuctionBidExtensionTime >= block.timestamp
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

        auction.winner = _msgSender();
    }

    function bidOnSealedAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        uint newBid = msg.value;
        if (auction.bids[_msgSender()] > 0) {
            auction.bids[_msgSender()] += newBid;
        } else {
            auction.bids[_msgSender()] = newBid;
            auction.bidders.push(_msgSender());
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

        (bool sent, ) = auction.beneficiary.call{value: auction.highestBid}("");
        if (!sent)
            revert TransferFailed(auction.beneficiary, auction.highestBid);

        auction.winner = auction.highestBidder;
    }

    function withdrawSealedAuction(uint _auctionId) internal {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.winner == address(0),
            "MultiAuction: Auction already withdrawn."
        );

        require(
            auction.bidders.length > 0,
            "MultiAuction: Auction didn't received bids."
        );

        address highestBidder;
        for (uint i = 0; i < auction.bidders.length; i++) {
            address _bidderAddress = auction.bidders[i];
            uint _bid = auction.bids[_bidderAddress];
            uint prevHighestBid = auction.bids[highestBidder];
            if (_bid > prevHighestBid) {
                if (highestBidder != address(0)) {
                    // Refund previous higest bidder
                    (bool bidRefunded, ) = highestBidder.call{
                        value: prevHighestBid
                    }("");
                    if (!bidRefunded)
                        revert TransferFailed(highestBidder, prevHighestBid);
                }
                highestBidder = _bidderAddress;
            } else {
                // Refund lower bidders
                (bool lowerRefunded, ) = _bidderAddress.call{value: _bid}("");
                if (!lowerRefunded) revert TransferFailed(_bidderAddress, _bid);
            }
        }
        (bool sent, ) = auction.beneficiary.call{
            value: auction.bids[highestBidder]
        }("");
        if (!sent)
            revert TransferFailed(
                auction.beneficiary,
                auction.bids[highestBidder]
            );
        auction.winner = highestBidder;
    }

    function revealSealedBids(
        uint _auctionId
    )
        public
        view
        onlyInactiveAuction(_auctionId)
        returns (SealedBids[] memory)
    {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.auctionType == AuctionType.Sealed,
            "MultiAuction: Auction not of sealed type"
        );

        // Create a memory array with a fixed size (same as the number of bidders)
        SealedBids[] memory sealedBids = new SealedBids[](
            auction.bidders.length
        );

        for (uint i = 0; i < auction.bidders.length; i++) {
            address _bidderAddress = auction.bidders[i];
            uint _bid = auction.bids[_bidderAddress];
            sealedBids[i] = SealedBids(_bidderAddress, _bid);
        }
        return sealedBids;
    }

    function cancelAuction(
        uint _auctionId
    ) external nonReentrant onlyAuctionCreator(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        if (auction.auctionType == AuctionType.English) {
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
        } else if (auction.auctionType == AuctionType.Sealed) {
            for (uint i = 0; i < auction.bidders.length; i++) {
                address _bidder = auction.bidders[i];
                (bool sent, ) = _bidder.call{value: auction.bids[_bidder]}("");
                if (!sent)
                    revert TransferFailed(_bidder, auction.bids[_bidder]);
            }
        }
        auction.endTime = block.timestamp;
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
        if (block.timestamp >= auctions[_auctionId].endTime)
            revert AuctionEnded();
        _;
    }
}
