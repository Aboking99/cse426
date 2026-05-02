const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdfundingEquity", function () {
  let owner;
  let investor1;
  let investor2;
  let yoda;
  let crowdfunding;

  const goal = ethers.parseUnits("1000", 18);
  const equityOffered = 20;

  async function advancePastDeadline() {
    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
  }

  beforeEach(async function () {
    [owner, investor1, investor2] = await ethers.getSigners();

    const MockYODA = await ethers.getContractFactory("MockYODA");
    yoda = await MockYODA.deploy();
    await yoda.waitForDeployment();

    const CrowdfundingEquity = await ethers.getContractFactory("CrowdfundingEquity");
    const latestBlock = await ethers.provider.getBlock("latest");
    crowdfunding = await CrowdfundingEquity.deploy(
      await yoda.getAddress(),
      goal,
      equityOffered,
      latestBlock.timestamp + 7 * 24 * 60 * 60
    );
    await crowdfunding.waitForDeployment();

    await yoda.mint(investor1.address, ethers.parseUnits("2000", 18));
    await yoda.mint(investor2.address, ethers.parseUnits("2000", 18));
  });

  it("finalizes a successful round and lets the owner claim funds", async function () {
    await yoda.connect(investor1).approve(await crowdfunding.getAddress(), ethers.parseUnits("600", 18));
    await yoda.connect(investor2).approve(await crowdfunding.getAddress(), ethers.parseUnits("400", 18));

    await crowdfunding.connect(investor1).invest(ethers.parseUnits("600", 18));
    await crowdfunding.connect(investor2).invest(ethers.parseUnits("400", 18));

    expect(await crowdfunding.roundState()).to.equal(0n);

    await advancePastDeadline();

    expect(await crowdfunding.roundState()).to.equal(1n);

    await crowdfunding.finalizeRound();

    expect(await crowdfunding.finalized()).to.equal(true);
    expect(await crowdfunding.roundState()).to.equal(3n);
    expect(await crowdfunding.getInvestorShare(investor1.address)).to.equal(
      ethers.parseUnits("12", 18)
    );
    expect(await crowdfunding.getInvestorShare(investor2.address)).to.equal(
      ethers.parseUnits("8", 18)
    );

    const ownerBalanceBefore = await yoda.balanceOf(owner.address);
    await crowdfunding.claimFunds();
    const ownerBalanceAfter = await yoda.balanceOf(owner.address);

    expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(goal);
    expect(await crowdfunding.fundsClaimed()).to.equal(true);
    expect(await crowdfunding.roundState()).to.equal(4n);
  });

  it("opens refunds when the funding goal is missed", async function () {
    const amount = ethers.parseUnits("250", 18);
    await yoda.connect(investor1).approve(await crowdfunding.getAddress(), amount);
    await crowdfunding.connect(investor1).invest(amount);

    await advancePastDeadline();

    expect(await crowdfunding.roundState()).to.equal(2n);
    expect(await crowdfunding.refundableAmount(investor1.address)).to.equal(amount);

    const balanceBefore = await yoda.balanceOf(investor1.address);
    await crowdfunding.connect(investor1).refund();
    const balanceAfter = await yoda.balanceOf(investor1.address);

    expect(balanceAfter - balanceBefore).to.equal(amount);
    expect(await crowdfunding.refundableAmount(investor1.address)).to.equal(0);
  });

  it("prevents claiming funds before the round is finalized", async function () {
    await yoda.connect(investor1).approve(await crowdfunding.getAddress(), goal);
    await crowdfunding.connect(investor1).invest(goal);

    await advancePastDeadline();

    await expect(crowdfunding.claimFunds()).to.be.revertedWith("Round not finalized");
  });

  it("prevents refunds after a successful round", async function () {
    await yoda.connect(investor1).approve(await crowdfunding.getAddress(), goal);
    await crowdfunding.connect(investor1).invest(goal);

    await advancePastDeadline();
    await crowdfunding.finalizeRound();

    await expect(crowdfunding.connect(investor1).refund()).to.be.revertedWith(
      "Refunds are not available"
    );
  });
});
