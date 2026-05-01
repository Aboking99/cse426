// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract CrowdfundingEquity {
    address public owner;
    address public yodaToken;
    uint256 public fundingGoal;
    uint256 public totalRaised;
    uint256 public equityPercentageOffered;
    uint256 public deadline;
    bool public finalized;

    struct Investor {
        uint256 amountInvested;
        uint256 equityShare;
    }

    mapping(address => Investor) public investors;

    address[] private investorList;
    mapping(address => bool) private hasInvested;

    event Invested(address indexed investor, uint256 amount);
    event Finalized();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        address _yodaToken,
        uint256 _fundingGoal,
        uint256 _equityPercentageOffered,
        uint256 _deadlineTimestamp
    ) {
        require(_yodaToken != address(0), "Invalid token address");
        require(_equityPercentageOffered > 0 && _equityPercentageOffered <= 100, "Equity must be 1-100");
        require(_deadlineTimestamp > block.timestamp, "Deadline must be in the future");

        owner = msg.sender;
        yodaToken = _yodaToken;
        fundingGoal = _fundingGoal;
        equityPercentageOffered = _equityPercentageOffered;
        deadline = _deadlineTimestamp;
    }

    function invest(uint256 amount) external {
        require(!finalized, "Round already finalized");
        require(block.timestamp < deadline, "Funding period ended");
        require(amount > 0, "Amount must be > 0");

        bool ok = IERC20(yodaToken).transferFrom(msg.sender, address(this), amount);
        require(ok, "YODA transfer failed (check allowance/balance)");

        if (!hasInvested[msg.sender]) {
            hasInvested[msg.sender] = true;
            investorList.push(msg.sender);
        }

        investors[msg.sender].amountInvested += amount;
        totalRaised += amount;

        emit Invested(msg.sender, amount);
    }

    function finalizeRound() external onlyOwner {
        require(!finalized, "Already finalized");
        require(block.timestamp >= deadline, "Deadline not reached");
        require(totalRaised > 0, "No funds raised");
        require(totalRaised >= fundingGoal, "Funding goal not reached");

        uint256 n = investorList.length;
        for (uint256 i = 0; i < n; i++) {
            address user = investorList[i];
            uint256 contribution = investors[user].amountInvested;
            uint256 share = (contribution * equityPercentageOffered * 1e18) / totalRaised;
            investors[user].equityShare = share;
        }

        finalized = true;
        emit Finalized();
    }

    function getInvestorShare(address investor) external view returns (uint256) {
        return investors[investor].equityShare;
    }

    function getTotalRaised() external view returns (uint256) {
        return totalRaised;
    }

    function getInvestorCount() external view returns (uint256) {
        return investorList.length;
    }
}
