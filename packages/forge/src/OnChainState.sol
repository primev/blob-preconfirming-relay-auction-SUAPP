// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.8;

import "./lib/Suave.sol";

contract OnChainState {
    uint64 public state;
    event UpdatedState(uint64 newState);
    event NothingHappened();

    receive() external payable {}

    fallback() external payable {
        emit NothingHappened();
    }

    function nilExampleCallback() external payable {}

    // nilExample is a function executed in a confidential request
    // that CANNOT modify the state of the smart contract.
    function nilExample() external payable returns (bytes memory) {
        require(Suave.isConfidential());
        state++;
        return abi.encodeWithSelector(this.nilExampleCallback.selector);
    }

    function exampleCallback() external {
        state++;
        emit UpdatedState(state);
    }

    // example is a function executed in a confidential request that includes
    // a callback that can modify the state.
    function example() external view returns (bytes memory) {
        require(Suave.isConfidential());
        return bytes.concat(this.exampleCallback.selector);
    }
}
