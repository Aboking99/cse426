const CAMPAIGN_DEFS = [
  {
    slug: "al-quds-solar",
    title: "Al-Quds Community Solar",
    subtitle: "Rooftop solar for a masjid community hall — lower bills, shared benefit.",
    fundingGoalHuman: "2000",
    equityOffered: 25,
    durationDays: 7,
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
    durationDays: 10,
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
    durationDays: 14,
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

const DAY_IN_SECONDS = 24n * 60n * 60n;

function deadlineFromNow(durationDays, nowUnixSeconds) {
  return BigInt(nowUnixSeconds) + BigInt(durationDays) * DAY_IN_SECONDS;
}

module.exports = {
  CAMPAIGN_DEFS,
  DAY_IN_SECONDS,
  deadlineFromNow,
};
