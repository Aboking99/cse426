// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Fixed-supply YODA token for real testnet deployment.
contract YodaToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    constructor(address treasurer) ERC20("Yoda Token", "YODA") {
        require(treasurer != address(0), "Invalid treasurer");
        _mint(treasurer, INITIAL_SUPPLY);
    }
}
