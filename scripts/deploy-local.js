const { ethers } = require("hardhat");
const { CAMPAIGN_DEFS, deadlineFromNow } = require("./campaign-defs");
const { writeDeployment, DEPLOYED_PATH } = require("./deploy-utils");

async function main() {
  const signers = await ethers.getSigners();
  const owner = signers[0];

  const MockYODA = await ethers.getContractFactory("MockYODA");
  const yoda = await MockYODA.deploy();
  await yoda.waitForDeployment();
  const yodaAddress = await yoda.getAddress();

  const CrowdfundingEquity = await ethers.getContractFactory("CrowdfundingEquity");
  const now = Math.floor(Date.now() / 1000);

  const mintAmount = ethers.parseUnits("100000", 18);
  const usedSigners = new Set();
  for (const def of CAMPAIGN_DEFS) {
    for (const investor of def.seed) {
      usedSigners.add(investor.signerIndex);
    }
  }

  await yoda.mint(owner.address, mintAmount);
  for (const idx of usedSigners) {
    await yoda.mint(signers[idx].address, mintAmount);
  }

  const campaigns = [];

  for (const def of CAMPAIGN_DEFS) {
    const fundingGoal = ethers.parseUnits(def.fundingGoalHuman, 18);
    const deadline = deadlineFromNow(def.durationDays, now);

    const campaign = await CrowdfundingEquity.deploy(
      yodaAddress,
      fundingGoal,
      def.equityOffered,
      deadline
    );
    await campaign.waitForDeployment();
    const crowdfundingAddress = await campaign.getAddress();

    const seedInvestors = [];

    for (const row of def.seed) {
      const investor = signers[row.signerIndex];
      const amountWei = ethers.parseUnits(row.amount, 18);
      await (await yoda.connect(investor).approve(crowdfundingAddress, amountWei)).wait();
      await (await campaign.connect(investor).invest(amountWei)).wait();

      seedInvestors.push({
        label: row.label,
        role: row.role,
        address: investor.address,
        investedYoda: row.amount,
        note: row.note,
      });
    }

    const totalRaised = await campaign.totalRaised();
    const deadlineBn = await campaign.deadline();

    campaigns.push({
      slug: def.slug,
      title: def.title,
      subtitle: def.subtitle,
      crowdfunding: crowdfundingAddress,
      fundingGoalHuman: def.fundingGoalHuman,
      equityPercentageOffered: def.equityOffered,
      deadline: Number(deadlineBn),
      totalRaisedAfterSeed: ethers.formatUnits(totalRaised, 18),
      seedInvestors,
      story: def.story,
    });
  }

  const payload = {
    chainId: 31337,
    networkName: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorerUrl: "",
    yodaToken: yodaAddress,
    yodaSymbol: "YODA",
    yodaDecimals: 18,
    yodaIsMock: true,
    owner: owner.address,
    notes:
      "Local development deployment. Import a Hardhat account into MetaMask to invest, finalize, refund, and claim funds during testing.",
    campaigns,
  };

  writeDeployment(payload);

  console.log("MockYODA:", yodaAddress);
  campaigns.forEach((c) => {
    console.log(`Campaign [${c.slug}]:`, c.crowdfunding, "raised", c.totalRaisedAfterSeed, "YODA");
  });
  console.log("Owner:", owner.address);
  console.log("Wrote", DEPLOYED_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
