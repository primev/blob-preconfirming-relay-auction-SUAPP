# Relay Leader Auction SUAPP for Blob Preconfirmations
A second price sealed bid auction uses SUAVE confidential compute, and presents results in a contract that is then accessible by preconfirmation providers on mev-commit. This achieves the credible auctioneer requirement for a preconfirming relay leader auction, where the relay leader is then able to provide blob preconfirmations for Ethereum on the mev-commit network and present them to block builders in the form of an inclusion list.

# Auction Diagram
![Auction diagram](

For how the SUAVE auction integrates into the blob preconfirmation flow, refer to system diagram under [blob preconfs](https://github.com/primevprotocol/blob-preconfs)
