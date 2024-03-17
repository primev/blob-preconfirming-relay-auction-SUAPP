pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "suave-std/suavelib/Suave.sol";

import "suave-std/Test.sol";

import "../src/SealedBidAuction.sol";

contract SealedBidAuctionTest is Test, SuaveEnabled {
    SealedBidAuction sealedBidAuction;

    function testSubmitBid() public {
        sealedBidAuction = new SealedBidAuction();
        // Fund the test account with some ether
        vm.deal(address(this), 5 ether);

        // Set the balance of the test account to ensure it has enough ETH
        uint256 startingBalance = address(this).balance;
        assertTrue(startingBalance >= 1 ether, "Test account should have at least 1 ether");

        // Define a slot number for the bid
        uint64 slotNumber = 1;

        // Define a bid amount
        uint256 bidAmount = 1 ether;

            // Create a bid object
        SealedBidAuction.Bid memory bid = SealedBidAuction.Bid({
            id: 0x0, // The ID will be set in the contract
            bidder: address(this), // The bidder's address
            bidAmount: bidAmount // The amount of the bid
        });

            // Encode the bid as confidential inputs
        bytes memory encodedBid = abi.encode(bid);

        // Set the confidential inputs before calling submitBid
        vm.prank(address(this));
        // this.setConfidentialInputs(encodedBid);

        // Submit a bid
        sealedBidAuction.submitBid(slotNumber);
        // vm.stopPrank();

        // Check if an event was emitted to confirm the bid submission
        // vm.expectEmit(true, true, true, true);
    }

    function testGetLatestSlot() public {
        sealedBidAuction = new SealedBidAuction();
        uint64 latestSlot = sealedBidAuction.getLatestSlot();
        // Assuming the slot number is always greater than 0
        assertTrue(latestSlot > 0, "Latest slot should be greater than 0");
    }

    // function testGetLatestSlotReturnsValidSlotNumber() public {
    //     sealedBidAuction = new SealedBidAuction();
    //     uint64 latestSlot = sealedBidAuction.getLatestSlot();
    //     // This is a basic test to ensure that the function returns a valid slot number
    //     // In a real-world scenario, you might want to mock the HTTP request to return a known value
    //     // and check that the function returns that exact value.
    //     assertTrue(latestSlot > 0, "Function should return a valid slot number");
    // }
}
