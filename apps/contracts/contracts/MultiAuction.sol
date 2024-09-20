// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiAuction is Ownable {
    enum AuctionType {
        English,
        Dutch,
        Sealed
    }

    struct EnglishAuction {
        address payable beneficiary;
        uint startPrice;
        uint endTime;
        uint highestBid;
        address highestBidder;
        bool withdrawn;
    }

    struct DutchAuction {
        address payable beneficiary;
        uint startPrice;
        uint startTime;
        uint endTime;
        uint priceDecrementPerHour; // Price Decrement in Eth
        uint floorPrice; // Price after which no decrement will be made
        bool closed;
    }

    mapping(uint256 => EnglishAuction) public englishAuctions;
    mapping(uint256 => DutchAuction) public dutchAuctions;

    /**
     * @notice Time in seconds to increase an English auction deadline if bid is placed at the end.
     */
    uint public englishAuctionBidExtensionTime;

    constructor(uint _englishAuctionBidExtensionTime) Ownable(_msgSender()) {
        englishAuctionBidExtensionTime = _englishAuctionBidExtensionTime;
    }

    function bidOnEnglishAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        EnglishAuction memory englishAuction = englishAuctions[_auctionId];
        uint newBid = msg.value;

        // For first bid, highest will always be 0, hence condition returns true
        require(
            newBid > englishAuction.highestBid,
            "MultiAuction: Bid must be higher than current highest bid."
        );
        require(
            newBid >= englishAuction.startPrice,
            "MultiAuction: Bid must be higher than start price."
        );
        if (englishAuction.highestBidder != address(0)) {
            payable(englishAuction.highestBidder).transfer(
                englishAuction.highestBid
            );
        }
        englishAuction.highestBid = newBid;
        englishAuction.highestBidder = _msgSender();

        // Extend auction end time if bid is placed at the end, for fairness
        if (
            englishAuction.endTime - englishAuctionBidExtensionTime >=
            block.timestamp
        ) {
            englishAuction.endTime += englishAuctionBidExtensionTime;
        }
    }

    function bidOnDutchAuction(
        uint _auctionId
    ) internal onlyActiveAuction(_auctionId) {
        DutchAuction memory dutchAuction = dutchAuctions[_auctionId];
        require(dutchAuction.closed == false, "MultiAuction: Auction closed.");
        uint newBid = msg.value;
        uint256 currentPrice = dutchAuction.startPrice -
            (((block.timestamp - dutchAuction.startTime) / 3600) *
                dutchAuction.priceDecrementPerHour);
        if (currentPrice < dutchAuction.floorPrice) {
            currentPrice = dutchAuction.floorPrice;
        }
        require(
            newBid >= currentPrice,
            "MultiAuction: Bid must be higher than current price."
        );
        payable(dutchAuction.beneficiary).transfer(newBid);
        dutchAuction.closed = true;
    }

    function placeBid(
        uint _auctionId,
        AuctionType _auctionType
    ) external payable onlyActiveAuction(_auctionId) {
        if (_auctionType == AuctionType.English) {
            bidOnEnglishAuction(_auctionId);
        }
    }

    function withdraw(
        uint _auctionId
    ) external onlyAuctionCreator(_auctionId) onlyInactiveAuction(_auctionId) {
        EnglishAuction memory englishAuction = englishAuctions[_auctionId];

        require(
            englishAuction.withdrawn == false,
            "MultiAuction: Auction already withdrawn."
        );
        payable(englishAuction.beneficiary).transfer(englishAuction.highestBid);
        englishAuction.withdrawn = true;
    }

    modifier onlyInactiveAuction(uint _auctionId) {
        require(
            block.timestamp >= englishAuctions[_auctionId].endTime,
            "MultiAuction: Auction has not yet ended."
        );
        _;
    }

    modifier onlyAuctionCreator(uint _auctionId) {
        require(
            _msgSender() == englishAuctions[_auctionId].beneficiary,
            "MultiAuction: Only auction creator can withdraw."
        );
        _;
    }

    modifier onlyActiveAuction(uint _auctionId) {
        require(
            block.timestamp < englishAuctions[_auctionId].endTime,
            "MultiAuction: Auction has already ended."
        );
        _;
    }
}
