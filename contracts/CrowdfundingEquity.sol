// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CrowdfundingEquity {
    using SafeERC20 for IERC20;

    enum RoundState {
        Active,
        SuccessfulPendingFinalization,
        FailedRefunding,
        FinalizedAwaitingClaim,
        Closed
    }

    address public owner;
    IERC20 public yodaToken;
    uint256 public fundingGoal;
    uint256 public totalRaised;
    uint256 public equityPercentageOffered;
    uint256 public deadline;
    bool public finalized;
    bool public fundsClaimed;

    struct Investor {
        uint256 amountInvested;
        uint256 equityShare;
    }

    mapping(address => Investor) public investors;

    address[] private investorList;
    mapping(address => bool) private hasInvested;

    event Invested(address indexed investor, uint256 amount);
    event Finalized(uint256 totalRaised);
    event Refunded(address indexed investor, uint256 amount);
    event FundsClaimed(address indexed owner, uint256 amount);

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
        require(_fundingGoal > 0, "Funding goal must be > 0");
        require(_equityPercentageOffered > 0 && _equityPercentageOffered <= 100, "Equity must be 1-100");
        require(_deadlineTimestamp > block.timestamp, "Deadline must be in the future");

        owner = msg.sender;
        yodaToken = IERC20(_yodaToken);
        fundingGoal = _fundingGoal;
        equityPercentageOffered = _equityPercentageOffered;
        deadline = _deadlineTimestamp;
    }

    function invest(uint256 amount) external {
        require(roundState() == RoundState.Active, "Round is not active");
        require(amount > 0, "Amount must be > 0");

        yodaToken.safeTransferFrom(msg.sender, address(this), amount);

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
        require(roundState() == RoundState.SuccessfulPendingFinalization, "Round not ready to finalize");

        uint256 n = investorList.length;
        for (uint256 i = 0; i < n; i++) {
            address user = investorList[i];
            uint256 contribution = investors[user].amountInvested;
            uint256 share = (contribution * equityPercentageOffered * 1e18) / totalRaised;
            investors[user].equityShare = share;
        }

        finalized = true;
        emit Finalized(totalRaised);
    }

    function claimFunds() external onlyOwner {
        require(finalized, "Round not finalized");
        require(!fundsClaimed, "Funds already claimed");

        uint256 amount = yodaToken.balanceOf(address(this));
        require(amount > 0, "No funds to claim");

        fundsClaimed = true;
        yodaToken.safeTransfer(owner, amount);

        emit FundsClaimed(owner, amount);
    }

    function refund() external {
        require(roundState() == RoundState.FailedRefunding, "Refunds are not available");

        uint256 amount = investors[msg.sender].amountInvested;
        require(amount > 0, "Nothing to refund");

        investors[msg.sender].amountInvested = 0;
        investors[msg.sender].equityShare = 0;

        yodaToken.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    function roundState() public view returns (RoundState) {
        if (finalized) {
            return fundsClaimed ? RoundState.Closed : RoundState.FinalizedAwaitingClaim;
        }

        if (block.timestamp < deadline) {
            return RoundState.Active;
        }

        if (totalRaised >= fundingGoal) {
            return RoundState.SuccessfulPendingFinalization;
        }

        return RoundState.FailedRefunding;
    }

    function fundingSucceeded() external view returns (bool) {
        return block.timestamp >= deadline && totalRaised >= fundingGoal;
    }

    function fundingFailed() external view returns (bool) {
        return block.timestamp >= deadline && totalRaised < fundingGoal;
    }

    function refundableAmount(address investor) external view returns (uint256) {
        if (roundState() != RoundState.FailedRefunding) {
            return 0;
        }
        return investors[investor].amountInvested;
    }

    function claimableFunds() external view returns (uint256) {
        if (!finalized || fundsClaimed) {
            return 0;
        }
        return yodaToken.balanceOf(address(this));
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
