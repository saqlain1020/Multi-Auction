// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiAuction is Ownable {
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
            payable(auction.highestBidder).transfer(auction.highestBid);
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
        payable(auction.beneficiary).transfer(newBid);
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
    ) external payable onlyActiveAuction(_auctionId) {
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
    ) external onlyAuctionCreator(_auctionId) onlyInactiveAuction(_auctionId) {
        if (auctions[_auctionId].auctionType == AuctionType.English) {
            withdrawEnglishAuction(_auctionId);
        } else if (auctions[_auctionId].auctionType == AuctionType.Sealed) {
            withdrawSealedAuction(_auctionId);
        }
    }

    function withdrawEnglishAuction(uint _auctionId) internal {
        Auction storage auction = auctions[_auctionId];

        require(
            auction.winner == address(0),
            "MultiAuction: Auction already withdrawn."
        );
        payable(auction.beneficiary).transfer(auction.highestBid);
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
            if (_bid > auction.bids[highestBidder]) {
                highestBidder = _bidderAddress;
            } else {
                payable(_bidderAddress).transfer(_bid);
            }
        }
        payable(auction.beneficiary).transfer(auction.bids[highestBidder]);
        auction.winner = highestBidder;
    }

    /** @notice Modifier for withdrawing only for ended auctions */
    modifier onlyInactiveAuction(uint _auctionId) {
        require(
            block.timestamp >= auctions[_auctionId].endTime,
            "MultiAuction: Auction has not yet ended."
        );
        _;
    }

    modifier onlyAuctionCreator(uint _auctionId) {
        require(
            _msgSender() == auctions[_auctionId].beneficiary,
            "MultiAuction: Only auction creator can withdraw."
        );
        _;
    }

    /** @notice Modifier for placing bids only for active auctions */
    modifier onlyActiveAuction(uint _auctionId) {
        require(
            block.timestamp < auctions[_auctionId].endTime,
            "MultiAuction: Auction has already ended."
        );
        _;
    }
}
