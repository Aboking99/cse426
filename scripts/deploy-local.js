const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

const DEPLOYED_PATH = path.join(__dirname, "..", "frontend", "public", "deployed.json");

const CAMPAIGN_DEFS = [
  {
    slug: "al-quds-solar",
    title: "Al-Quds Community Solar",
    subtitle: "Rooftop solar for a masjid community hall — lower bills, shared benefit.",
    fundingGoalHuman: "2000",
    equityOffered: 25,
    deadlineOffsetSec: 600n,
    seed: [
      { signerIndex: 1, label: "Amina R.", role: "Community lead", amount: "1200", note: "Early backer; aligned with long-term savings for the hall." },
      { signerIndex: 2, label: "Yusuf K.", role: "Small business owner", amount: "800", note: "Prefers equity-style risk-sharing over debt." },
      { signerIndex: 3, label: "Fatimah S.", role: "Family office (demo)", amount: "400", note: "Diversifies sadaqa-aligned portfolio." },
    ],
    story: {
      summary:
        "Funds install a modest solar array and inverter on the community hall. Returns are conceptual in this demo; on-chain logic records proportional equity only — no interest.",
      useOfFunds: [
        "Panels, inverter, and certified installation",
        "Electrical inspection and grid paperwork",
        "Maintenance reserve (first year)",
      ],
      shariaNote:
        "Structured as proportional equity in a single campaign (no guaranteed profit, no riba). This interface is a classroom / demo build.",
    },
  },
  {
    slug: "rifq-housing-cooperative",
    title: "Rifq Housing Cooperative (pilot)",
    subtitle: "Shared-equity pilot for affordable family units — no mortgage interest in this model.",
    fundingGoalHuman: "5000",
    equityOffered: 30,
    deadlineOffsetSec: 700n,
    seed: [
      { signerIndex: 1, label: "Omar H.", role: "Co-op member", amount: "1000", note: "First tranche toward the pilot unit." },
      { signerIndex: 2, label: "Khadijah M.", role: "Treasurer (demo)", amount: "500", note: "Documents proportional stakes for members." },
    ],
    story: {
      summary:
        "A pilot cooperative raise for land-bank fees and planning deposits. This demo does not issue real securities — it shows how proportional contributions map to equity % on-chain.",
      useOfFunds: ["Planning and permits", "Legal structure setup", "Community consultation"],
      shariaNote:
        "Framed as musharakah-style participation in a defined pool; consult qualified scholars and counsel for real offerings.",
    },
  },
  {
    slug: "nur-edtech-seed",
    title: "Nūr EdTech Seed (ethical content)",
    subtitle: "Curriculum tools for Islamic schools — subscription revenue shared with backers.",
    fundingGoalHuman: "3000",
    equityOffered: 20,
    deadlineOffsetSec: 800n,
    seed: [
      { signerIndex: 2, label: "Ibrahim T.", role: "EdTech founder", amount: "1200", note: "Founder co-invest alongside community." },
      { signerIndex: 3, label: "Layla N.", role: "Angel (demo)", amount: "900", note: "Supports content moderation budget." },
    ],
    story: {
      summary:
        "Builds a minimal LMS layer and content pipeline for partner schools. Demo uses the same CrowdfundingEquity contract with a different goal and deadline.",
      useOfFunds: ["Engineering sprint", "Content review", "Pilot school onboarding"],
      shariaNote:
        "Profit-sharing in real life requires clear contracts; here we only demonstrate proportional equity allocation after finalize.",
    },
  },
];

async function main() {
  const signers = await ethers.getSigners();
  const owner = signers[0];

  const MockYODA = await ethers.getContractFactory("MockYODA");
  const yoda = await MockYODA.deploy();
  await yoda.waitForDeployment();
  const yodaAddress = await yoda.getAddress();

  const CrowdfundingEquity = await ethers.getContractFactory("CrowdfundingEquity");
  const now = BigInt(Math.floor(Date.now() / 1000));

  const mintAmount = ethers.parseUnits("100000", 18);
  const usedSigners = new Set();
  for (const def of CAMPAIGN_DEFS) {
    for (const s of def.seed) usedSigners.add(s.signerIndex);
  }
  await yoda.mint(owner.address, mintAmount);
  for (const idx of usedSigners) {
    await yoda.mint(signers[idx].address, mintAmount);
  }

  const campaigns = [];

  for (const def of CAMPAIGN_DEFS) {
    const fundingGoal = ethers.parseUnits(def.fundingGoalHuman, 18);
    const deadline = now + def.deadlineOffsetSec;

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
      const inv = signers[row.signerIndex];
      const wei = ethers.parseUnits(row.amount, 18);
      const tx1 = await yoda.connect(inv).approve(crowdfundingAddress, wei);
      await tx1.wait();
      const tx2 = await campaign.connect(inv).invest(wei);
      await tx2.wait();
      seedInvestors.push({
        label: row.label,
        role: row.role,
        address: inv.address,
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
      seedInvestors,
      totalRaisedAfterSeed: ethers.formatUnits(totalRaised, 18),
      story: def.story,
    });
  }

  const payload = {
    chainId: 31337,
    networkName: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    yodaToken: yodaAddress,
    yodaIsMock: true,
    campaigns,
    owner: owner.address,
    notes:
      "Gas on this network is free test ETH on Hardhat. Import account #0 as owner for finalize. YODA is mock — optional mint in UI for dev.",
  };

  fs.mkdirSync(path.dirname(DEPLOYED_PATH), { recursive: true });
  fs.writeFileSync(DEPLOYED_PATH, JSON.stringify(payload, null, 2), "utf8");

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
