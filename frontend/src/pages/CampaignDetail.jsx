import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";
import crowdfundingAbi from "../abi/CrowdfundingEquity.json";
import erc20Abi from "../abi/ERC20.json";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function CampaignDetail() {
  const { slug } = useParams();
  const { deployed, signer, account, ready, yodaIsMock } = useWeb3();

  const campaign = useMemo(
    () => deployed?.campaigns?.find((c) => c.slug === slug),
    [deployed, slug]
  );

  const [investAmount, setInvestAmount] = useState("100");
  const [fundingGoal, setFundingGoal] = useState("0");
  const [totalRaised, setTotalRaised] = useState("0");
  const [equityOffered, setEquityOffered] = useState("0");
  const [deadline, setDeadline] = useState(0);
  const [finalized, setFinalized] = useState(false);
  const [userInvested, setUserInvested] = useState("0");
  const [userOwnership, setUserOwnership] = useState("0");
  const [yodaBalance, setYodaBalance] = useState("0");
  const [status, setStatus] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setFundingGoal(campaign.fundingGoalHuman || "0");
    setTotalRaised(String(campaign.totalRaisedAfterSeed ?? "0"));
    setEquityOffered(String(campaign.equityPercentageOffered ?? "0"));
    setDeadline(Number(campaign.deadline) || 0);
  }, [campaign]);

  const contract = useMemo(() => {
    if (!signer || !campaign) return null;
    return new ethers.Contract(
      campaign.crowdfunding,
      crowdfundingAbi,
      signer
    );
  }, [signer, campaign]);

  const yoda = useMemo(() => {
    if (!signer || !deployed?.yodaToken) return null;
    return new ethers.Contract(deployed.yodaToken, erc20Abi, signer);
  }, [signer, deployed]);

  const refreshData = useCallback(async () => {
    if (!contract || !account || !yoda) return;
    try {
      const [
        goal,
        raised,
        eq,
        dl,
        fin,
        ownerAddr,
        investorData,
        share,
        bal,
      ] = await Promise.all([
        contract.fundingGoal(),
        contract.totalRaised(),
        contract.equityPercentageOffered(),
        contract.deadline(),
        contract.finalized(),
        contract.owner(),
        contract.investors(account),
        contract.getInvestorShare(account),
        yoda.balanceOf(account),
      ]);

      setFundingGoal(ethers.formatUnits(goal, 18));
      setTotalRaised(ethers.formatUnits(raised, 18));
      setEquityOffered(eq.toString());
      setDeadline(Number(dl));
      setFinalized(fin);
      setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
      setUserInvested(ethers.formatUnits(investorData.amountInvested, 18));
      setUserOwnership(Number(ethers.formatUnits(share, 18)).toFixed(6));
      setYodaBalance(ethers.formatUnits(bal, 18));
      setStatus("");
    } catch (err) {
      setStatus(`Read failed: ${err.shortMessage || err.message}`);
    }
  }, [contract, account, yoda]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  async function mintDemoYoda() {
    if (!yoda || !account || !signer || !deployed) return;
    try {
      setStatus("Minting mock YODA…");
      const iface = new ethers.Interface([
        "function mint(address to, uint256 amount) external",
      ]);
      const data = iface.encodeFunctionData("mint", [
        account,
        ethers.parseUnits("10000", 18),
      ]);
      const tx = await signer.sendTransaction({
        to: deployed.yodaToken,
        data,
      });
      await tx.wait();
      setStatus("Minted 10,000 YODA (mock).");
      await refreshData();
    } catch (e) {
      setStatus(`Mint failed: ${e.shortMessage || e.message}`);
    }
  }

  async function approveYoda() {
    if (!yoda || !contract || !investAmount || !deployed || !campaign) return;
    try {
      setStatus("Approving YODA…");
      const amountWei = ethers.parseUnits(investAmount, 18);
      const tx = await yoda.approve(campaign.crowdfunding, amountWei);
      await tx.wait();
      setStatus("Approve confirmed.");
    } catch (e) {
      setStatus(`Approve failed: ${e.shortMessage || e.message}`);
    }
  }

  async function invest() {
    if (!contract || !investAmount) return;
    try {
      setStatus("Investing…");
      const amountWei = ethers.parseUnits(investAmount, 18);
      const tx = await contract.invest(amountWei);
      await tx.wait();
      setStatus("Investment confirmed.");
      await refreshData();
    } catch (e) {
      setStatus(`Invest failed: ${e.shortMessage || e.message}`);
    }
  }

  async function finalizeRound() {
    if (!contract) return;
    try {
      setStatus("Finalizing…");
      const tx = await contract.finalizeRound();
      await tx.wait();
      setStatus("Round finalized.");
      await refreshData();
    } catch (e) {
      setStatus(`Finalize failed: ${e.shortMessage || e.message}`);
    }
  }

  if (!ready || !campaign) {
    return (
      <div className="container">
        <p>Campaign not found.</p>
        <Link to="/">Back to campaigns</Link>
      </div>
    );
  }

  const story = campaign.story || {};
  const progressPct =
    Number(fundingGoal) > 0
      ? Math.min(100, (Number(totalRaised) / Number(fundingGoal)) * 100)
      : 0;
  const deadlineText = deadline
    ? new Date(deadline * 1000).toLocaleString()
    : "—";

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link to="/">Campaigns</Link>
        <span aria-hidden="true"> / </span>
        <span>{campaign.title}</span>
      </nav>

      <header className="campaign-hero">
        <h1>{campaign.title}</h1>
        <p className="hero-lead">{campaign.subtitle}</p>
      </header>

      <section className="card prose-card">
        <h2>What this raise supports</h2>
        <p>{story.summary}</p>
        {Array.isArray(story.useOfFunds) && story.useOfFunds.length > 0 && (
          <>
            <h3>Use of funds</h3>
            <ul>
              {story.useOfFunds.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
        <p className="sharia-note">
          <strong>Sharia framing:</strong> {story.shariaNote}
        </p>
      </section>

      <section className="card">
        <h2>Live pool</h2>
        <p className="gas-note">
          Network fees (gas) are paid in <strong>ETH</strong>.{" "}
          <strong>YODA</strong> is only for your investment amount (after
          approve).
        </p>
        {(!campaign.seedInvestors || campaign.seedInvestors.length === 0) && (
          <p className="muted-small" style={{ marginTop: "0.5rem" }}>
            No demo seed table — live totals update when wallets invest on-chain.
          </p>
        )}
        <div className="progress-wrap tall">
          <div
            className="progress-bar"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <dl className="campaign-stats flat">
          <div>
            <dt>Funding goal</dt>
            <dd>{fundingGoal} YODA</dd>
          </div>
          <div>
            <dt>Total raised</dt>
            <dd>{totalRaised} YODA</dd>
          </div>
          <div>
            <dt>Equity offered (total)</dt>
            <dd>{equityOffered}%</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{deadlineText}</dd>
          </div>
          <div>
            <dt>Finalized</dt>
            <dd>{finalized ? "Yes" : "No"}</dd>
          </div>
        </dl>
        {isOwner && (
          <p>
            <span className="pill">You are the campaign owner</span>
          </p>
        )}
      </section>

      {campaign.seedInvestors?.length > 0 && (
        <section className="card">
          <h2>Early participants (demo seed)</h2>
          <p className="muted-small">
            Pre-filled for the demo UI; real deployments may leave this empty
            until investors transact.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>YODA</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {campaign.seedInvestors.map((s, idx) => (
                  <tr key={`${s.address}-${idx}`}>
                    <td>{s.label}</td>
                    <td>{s.role || "—"}</td>
                    <td>{s.investedYoda}</td>
                    <td className="muted-small">{s.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Your wallet</h2>
        {!account ? (
          <p className="muted-small">
            Connect your wallet from the header to approve and invest.
          </p>
        ) : (
          <>
            <p className="mono">{account}</p>
            <p>
              <strong>YODA balance:</strong> {yodaBalance}
            </p>
            {yodaIsMock && (
              <details className="dev-mint">
                <summary>Developer: mock YODA mint (uses gas)</summary>
                <div>
                  <p className="muted-small">
                    Minting calls the mock token; gas is still paid in ETH (not
                    YODA).
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={mintDemoYoda}
                  >
                    Mint 10,000 YODA
                  </button>
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Invest</h2>
        <label htmlFor="amt">Amount (YODA)</label>
        <div className="row">
          <input
            id="amt"
            type="number"
            min="0"
            step="0.0001"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
          />
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={approveYoda}
            disabled={!account}
          >
            1. Approve YODA
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={invest}
            disabled={!account}
          >
            2. Invest
          </button>
        </div>
        {status && (
          <p className="form-status" role="status">
            {status}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Your position</h2>
        <p>
          <strong>Invested:</strong> {userInvested} YODA
        </p>
        <p>
          <strong>Ownership (after finalize):</strong> {userOwnership}%
        </p>
        {isOwner && (
          <button type="button" className="btn btn-primary" onClick={finalizeRound}>
            Finalize round (owner — after deadline & goal met)
          </button>
        )}
      </section>
    </div>
  );
}
