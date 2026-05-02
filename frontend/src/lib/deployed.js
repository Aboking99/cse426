/**
 * Normalize legacy single-campaign deployed.json into multi-campaign shape.
 * @param {object|null} data
 */
export function normalizeDeployed(data) {
  if (!data) return null;
  if (Array.isArray(data.campaigns) && data.campaigns.length > 0) {
    return {
      ...data,
      blockExplorerUrl: data.blockExplorerUrl || "",
      yodaSymbol: data.yodaSymbol || "YODA",
      yodaDecimals: Number.isFinite(Number(data.yodaDecimals)) ? Number(data.yodaDecimals) : 18,
      campaigns: data.campaigns.map((c) => ({
        ...c,
        seedInvestors: c.seedInvestors || [],
        story: c.story || { summary: "", useOfFunds: [], shariaNote: "" },
      })),
    };
  }
  if (data.crowdfunding) {
    return {
      ...data,
      networkName: data.networkName || "Unknown",
      rpcUrl: data.rpcUrl || "",
      blockExplorerUrl: data.blockExplorerUrl || "",
      yodaSymbol: data.yodaSymbol || "YODA",
      yodaDecimals: Number.isFinite(Number(data.yodaDecimals)) ? Number(data.yodaDecimals) : 18,
      yodaIsMock: data.yodaIsMock ?? false,
      campaigns: [
        {
          slug: "legacy-campaign",
          title: "Campaign",
          subtitle: "",
          crowdfunding: data.crowdfunding,
          fundingGoalHuman: data.fundingGoalHuman || "0",
          equityPercentageOffered: data.equityPercentageOffered,
          deadline: data.deadline,
          seedInvestors: (data.seedInvestors || []).map((s) => ({
            ...s,
            role: s.role || "",
            note: s.note || "",
          })),
          totalRaisedAfterSeed: data.totalRaisedAfterSeed,
          story: {
            summary: "",
            useOfFunds: [],
            shariaNote: "",
          },
        },
      ],
    };
  }
  return { ...data, campaigns: data.campaigns || [] };
}

export async function fetchDeployed() {
  const res = await fetch(`/deployed.json?t=${Date.now()}`);
  if (!res.ok) throw new Error("Missing frontend/public/deployed.json");
  const raw = await res.json();
  return normalizeDeployed(raw);
}
