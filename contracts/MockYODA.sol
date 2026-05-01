// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Local / demo-only YODA stand-in. Anyone can mint for easy wallet testing.
contract MockYODA is ERC20 {
    constructor() ERC20("YODA (Mock)", "YODA") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
