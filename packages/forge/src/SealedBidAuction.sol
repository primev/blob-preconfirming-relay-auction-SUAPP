// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "suave-std/suavelib/Suave.sol";
import "solady/src/utils/LibString.sol";
import "solady/src/utils/JSONParserLib.sol";
import "forge-std/console.sol";

contract SealedBidAuction {
    event BidSubmitted(bytes32 bidId);

    struct Bid {
        bytes32 id;
        address bidder;
        uint256 bidAmount;
    }

    using JSONParserLib for string;
    using JSONParserLib for JSONParserLib.Item;

    // Data ID is the blocknumber of the auction
    // The key is the name of the Relay
    // - data id per auction
    // - key the id of the bidder relay address
    // - value is the bid
    // // bidreveal can be called by anyone which means that the allowed address confidentialRetrieve
    // use Suave.ANYALLOWED to allow anyone to peak - but revert if the auction isn't ended

    // Bidders submit their bids confidentially for a specific blockNumber. 
    // Each bid is associated with the blockNumber of the auction it is intended for.
    function submitBid(uint64 slotNumber) external payable returns (string memory) {
        bytes memory confidentialInputs = Suave.confidentialInputs();
        Bid memory bid = abi.decode(confidentialInputs, (Bid));

        require(msg.value >= bid.bidAmount, "Insufficient funds for bid");

        // Transfer the bid amount to the contract
        payable(address(this)).transfer(bid.bidAmount);
        // IDEA? This id /could/ be computed with the hash of the msg.sender and a secret key stored by the contract?
        // Generate a bid ID (for simplicity, using keccak256 hash of current block timestamp and bidder's address)
        bid.id = keccak256(abi.encodePacked(block.timestamp, msg.sender));

        // // Specify which contracts can read the record (only this contract)
        // address[] memory allowedPeekers = new address[](1);
        // allowedPeekers[0] = address(this);

        // // Specify which kettles can write to the record (any kettle)
        // address[] memory allowedStores = new address[](1);
        // allowedStores[0] = address(this);

        // Specify the allowed list for peeking and storing the data
        // Only the contract itself and the bidder have access the bid this bid data record
        // When the releaseAuction this will call another underlying function to have the contract 
        // call to retreive the bids, since the msg.sender can only reveal their own bid
        address[] memory allowedList = new address[](2);
        allowedList[0] = address(this);
        allowedList[1] = 0x0000000000000000000000000000000043200001;

        // Create a new data record for this bid
        // Note: Assuming Suave.newDataRecord() can take allowedList without decryptionCondition
        Suave.DataRecord memory dataRecord = Suave.newDataRecord(slotNumber, allowedList, allowedList, "default:v0:sealedBids");
    
        Suave.confidentialStore(
            dataRecord.id,
            LibString.toHexString(uint256(bid.id)), 
            abi.encode(bid.bidder, bid.bidAmount)
        );

        // Emit an event to indicate a bid has been saved
        emit BidSubmitted(bid.id);
        return LibString.toHexString(uint256(bid.id));
    }

    
    // function submitBid(uint64 slotNumber) external payable returns (string memory) {
    //     // Retrieve the bid data from the confidential inputs and decode it
    //     bytes memory confidentialInputs = Suave.confidentialInputs();
    //     Bid memory bid = abi.decode(confidentialInputs, (Bid));

    //     // require(msg.value >= bid.bidAmount, "Insufficient funds for bid");
        
    //     return saveBid(slotNumber, bid);
    // }


    // Function to get the latest slot number from the beacon chain API
    function getLatestSlot() public returns (uint64) {
        console.log("getLatestSlot:");
        Suave.HttpRequest memory request;
        request.method = "GET";
        request.url = "https://beaconcha.in/api/v1/slot/latest";
        request.headers = new string[](1);
        request.headers[0] = "accept: application/json";
        request.withFlashbotsSignature = true;

        
        bytes memory output = Suave.doHTTPRequest(request);

        JSONParserLib.Item memory item = string(output).parse();
        uint64 slotNumber = uint64(item.at('"data"').at('"slot"').value().decodeString().parseUint());

        return slotNumber;
    }

    // Iterate through stored bids and release the second highest one and select the originator of the highest one as the winner
    // function releaseAuction(uint256 slotNumber) external {
    //     require(Suave.isConfidential());

    //     Suave.DataRecord[] memory allRecords = Suave.fetchDataRecords(slotNumber, "default:v0:sealedBids");
    //     if (allRecords.length == 0) {
    //         revert Suave.PeekerReverted(address(this), "no data records");
    //     }

    //     // Suave.DataRecord[] memory allRecords = Suave.fetchDataRecords(blockHeight, "default:v0:ethBundles");
    //     // Get all bids
    //     Suave.DataRecord[] memory bids = Suave.getRecords("sealedBidAuction");

    //     // Find the highest bid
    //     uint256 highestBid = 0;
    //     uint256 secondHighestBid = 0;
    //     address highestBidder;
    //     for (uint256 i = 0; i < RelayNames.length; i++) {
    //         uint256 bidAmount = abi.decode(Suave.confidentialRetrieve(slotNumber, RelayNames[i]), (uint256));
    //         if (bidAmount > highestBid) {
    //             secondHighestBid = highestBid;
    //             highestBid = bidAmount;
    //             highestBidder = bids[i].owner;
    //         } else if (bidAmount > secondHighestBid) {
    //             secondHighestBid = bidAmount;
    //         }
    //     }

    //     // Release the second highest bid
    //     for (uint256 i = 0; i < bids.length; i++) {
    //         uint256 bidAmount = abi.decode(Suave.confidentialRetrieve(blockNumber, RelayNames[i]), (uint256));
    //         if (bidAmount == secondHighestBid) {
    //             Suave.confidentialRelease(blockNumber, RelayNames[i]);
    //         }
    //     }

    //     // Release the highest bid
    //     for (uint256 i = 0; i < bids.length; i++) {
    //         uint256 bidAmount = abi.decode(Suave.confidentialRetrieve(bids[i].id, "bidAmount"), (uint256));
    //         if (bidAmount == highestBid) {
    //             Suave.confidentialRelease(blockNumber, RelayNames[i]);
    //         }
    //     }

    //     // Announce the winner
    //     emit WinnerAnnounced(highestBidder);
    // }
    
}
