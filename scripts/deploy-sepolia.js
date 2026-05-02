const { ethers, network } = require("hardhat");
const { CAMPAIGN_DEFS, deadlineFromNow } = require("./campaign-defs");
const { writeDeployment, DEPLOYED_PATH } = require("./deploy-utils");

const FRONTEND_RPC_URL =
  process.env.FRONTEND_RPC_URL ||
  process.env.SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";
const EXTERNAL_YODA_TOKEN = process.env.YODA_TOKEN_ADDRESS || "";
const ERC20_METADATA_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function resolveYodaToken(provider) {
  if (!EXTERNAL_YODA_TOKEN) {
    throw new Error(
      "YODA_TOKEN_ADDRESS is required for Sepolia deployment. Set it to the class Yoda token address."
    );
  }

  const token = new ethers.Contract(EXTERNAL_YODA_TOKEN, ERC20_METADATA_ABI, provider);
  const [decimals, symbol] = await Promise.all([token.decimals(), token.symbol()]);

  return {
    address: EXTERNAL_YODA_TOKEN,
    isMock: false,
    source: "class-token",
    decimals: Number(decimals),
    symbol,
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const yoda = await resolveYodaToken(ethers.provider);
  const CrowdfundingEquity = await ethers.getContractFactory("CrowdfundingEquity");
  const now = Math.floor(Date.now() / 1000);

  const campaigns = [];
  for (const def of CAMPAIGN_DEFS) {
    const fundingGoal = ethers.parseUnits(def.fundingGoalHuman, yoda.decimals);
    const deadline = deadlineFromNow(def.durationDays, now);

    const campaign = await CrowdfundingEquity.deploy(
      yoda.address,
      fundingGoal,
      def.equityOffered,
      deadline
    );
    await campaign.waitForDeployment();
    const crowdfundingAddress = await campaign.getAddress();

    campaigns.push({
      slug: def.slug,
      title: def.title,
      subtitle: def.subtitle,
      crowdfunding: crowdfundingAddress,
      fundingGoalHuman: def.fundingGoalHuman,
      equityPercentageOffered: def.equityOffered,
      deadline: Number(deadline),
      totalRaisedAfterSeed: "0",
      seedInvestors: [],
      story: def.story,
    });
  }

  const payload = {
    chainId: Number(network.config.chainId || 11155111),
    networkName: "Sepolia",
    rpcUrl: FRONTEND_RPC_URL,
    blockExplorerUrl: "https://sepolia.etherscan.io",
    yodaToken: yoda.address,
    yodaSymbol: yoda.symbol,
    yodaDecimals: yoda.decimals,
    yodaIsMock: false,
    owner: deployer.address,
    notes: "Sepolia deployment using the class Yoda token.",
    campaigns,
  };

  writeDeployment(payload);

  console.log("Network:", payload.networkName);
  console.log("Deployer:", deployer.address);
  console.log("YODA token:", yoda.address, `(${yoda.source}, ${yoda.decimals} decimals)`);
  campaigns.forEach((c) => {
    console.log(`Campaign [${c.slug}]:`, c.crowdfunding);
  });
  console.log("Wrote", DEPLOYED_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
