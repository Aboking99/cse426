import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";
import crowdfundingAbi from "../abi/CrowdfundingEquity.json";
import erc20Abi from "../abi/ERC20.json";
import { useWeb3 } from "../context/Web3Context.jsx";

const ROUND_STATE_LABELS = {
  0: "Active",
  1: "Successful — ready to finalize",
  2: "Failed — refunds open",
  3: "Finalized — owner can claim funds",
  4: "Closed",
};

const ROUND_STATE_HELP = {
  0: "Investments are open until the deadline.",
  1: "The funding goal was met. The owner can finalize the round and lock in equity shares.",
  2: "The deadline passed without meeting the goal. Investors can withdraw their YODA refunds.",
  3: "Equity shares are finalized. The owner can now claim the raised YODA from the contract.",
  4: "The owner has already claimed the raised funds.",
};

export default function CampaignDetail() {
  const { slug } = useParams();
  const { deployed, signer, account, ready, yodaIsMock } = useWeb3();
  const tokenSymbol = deployed?.yodaSymbol || "YODA";
  const tokenDecimals = deployed?.yodaDecimals ?? 18;

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
  const [fundsClaimed, setFundsClaimed] = useState(false);
  const [userInvested, setUserInvested] = useState("0");
  const [userOwnership, setUserOwnership] = useState("0");
  const [yodaBalance, setYodaBalance] = useState("0");
  const [refundableAmount, setRefundableAmount] = useState("0");
  const [claimableFunds, setClaimableFunds] = useState("0");
  const [roundState, setRoundState] = useState(0);
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
    return new ethers.Contract(campaign.crowdfunding, crowdfundingAbi, signer);
  }, [signer, campaign]);

  const readContract = useMemo(() => {
    if (!campaign || !deployed?.rpcUrl) return null;
    const provider = new ethers.JsonRpcProvider(deployed.rpcUrl);
    return new ethers.Contract(campaign.crowdfunding, crowdfundingAbi, provider);
  }, [campaign, deployed]);

  const yoda = useMemo(() => {
    if (!signer || !deployed?.yodaToken) return null;
    return new ethers.Contract(deployed.yodaToken, erc20Abi, signer);
  }, [signer, deployed]);

  const refreshData = useCallback(async () => {
    if (!readContract) return;
    try {
      const [
        goal,
        raised,
        eq,
        dl,
        fin,
        claimed,
        state,
      ] = await Promise.all([
        readContract.fundingGoal(),
        readContract.totalRaised(),
        readContract.equityPercentageOffered(),
        readContract.deadline(),
        readContract.finalized(),
        readContract.fundsClaimed(),
        readContract.roundState(),
      ]);

      setFundingGoal(ethers.formatUnits(goal, tokenDecimals));
      setTotalRaised(ethers.formatUnits(raised, tokenDecimals));
      setEquityOffered(eq.toString());
      setDeadline(Number(dl));
      setFinalized(fin);
      setFundsClaimed(claimed);
      setRoundState(Number(state));

      const claimable = await readContract.claimableFunds();
      setClaimableFunds(ethers.formatUnits(claimable, tokenDecimals));

      if (contract && account && yoda) {
        const [ownerAddr, investorData, share, bal, refundable] = await Promise.all([
          contract.owner(),
          contract.investors(account),
          contract.getInvestorShare(account),
          yoda.balanceOf(account),
          contract.refundableAmount(account),
        ]);

        setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
        setUserInvested(ethers.formatUnits(investorData.amountInvested, tokenDecimals));
        setUserOwnership(Number(ethers.formatUnits(share, 18)).toFixed(6));
        setYodaBalance(ethers.formatUnits(bal, tokenDecimals));
        setRefundableAmount(ethers.formatUnits(refundable, tokenDecimals));
      } else {
        setIsOwner(false);
        setUserInvested("0");
        setUserOwnership("0");
        setYodaBalance("0");
        setRefundableAmount("0");
      }

      setStatus("");
    } catch (err) {
      setStatus(`Read failed: ${err.shortMessage || err.message}`);
    }
  }, [readContract, contract, account, yoda, tokenDecimals]);

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
        ethers.parseUnits("10000", tokenDecimals),
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
    if (!yoda || !contract || !investAmount || !campaign) return;
    try {
      setStatus("Approving YODA…");
      const amountWei = ethers.parseUnits(investAmount, tokenDecimals);
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
      const amountWei = ethers.parseUnits(investAmount, tokenDecimals);
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

  async function claimFunds() {
    if (!contract) return;
    try {
      setStatus("Claiming raised funds…");
      const tx = await contract.claimFunds();
      await tx.wait();
      setStatus("Raised funds claimed.");
      await refreshData();
    } catch (e) {
      setStatus(`Claim failed: ${e.shortMessage || e.message}`);
    }
  }

  async function requestRefund() {
    if (!contract) return;
    try {
      setStatus("Requesting refund…");
      const tx = await contract.refund();
      await tx.wait();
      setStatus("Refund completed.");
      await refreshData();
    } catch (e) {
      setStatus(`Refund failed: ${e.shortMessage || e.message}`);
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
  const roundLabel = ROUND_STATE_LABELS[roundState] || "Unknown";
  const roundHelp = ROUND_STATE_HELP[roundState] || "";
  const canInvest = roundState === 0;
  const canFinalize = isOwner && roundState === 1;
  const canClaim = isOwner && roundState === 3 && Number(claimableFunds) > 0;
  const canRefund = Number(refundableAmount) > 0 && roundState === 2;

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
          <strong>{tokenSymbol}</strong> is only for the investment amount after
          approval.
        </p>
        <div className="progress-wrap tall">
          <div className="progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
        <dl className="campaign-stats flat">
          <div>
            <dt>Funding goal</dt>
            <dd>{fundingGoal} {tokenSymbol}</dd>
          </div>
          <div>
            <dt>Total raised</dt>
            <dd>{totalRaised} {tokenSymbol}</dd>
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
            <dt>Round status</dt>
            <dd>{roundLabel}</dd>
          </div>
        </dl>
        <p className="muted-small">{roundHelp}</p>
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
            Pre-filled for the local demo UI. Sepolia deployments start with an
            empty cap table until wallets invest on-chain.
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
            Connect your wallet from the header to approve, invest, refund, or
            claim funds.
          </p>
        ) : (
          <>
            <p className="mono">{account}</p>
            <p>
              <strong>{tokenSymbol} balance:</strong> {yodaBalance}
            </p>
            {yodaIsMock && (
              <details className="dev-mint">
                <summary>Developer: mock YODA mint (uses gas)</summary>
                <div>
                  <p className="muted-small">
                    This control is only available on local mock-token
                    deployments.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={mintDemoYoda}
                  >
                    Mint 10,000 {tokenSymbol}
                  </button>
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Invest</h2>
        <label htmlFor="amt">Amount ({tokenSymbol})</label>
        <div className="row">
          <input
            id="amt"
            type="number"
            min="0"
            step="0.0001"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            disabled={!canInvest}
          />
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={approveYoda}
            disabled={!account || !canInvest}
          >
            1. Approve {tokenSymbol}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={invest}
            disabled={!account || !canInvest}
          >
            2. Invest
          </button>
        </div>
        {!canInvest && (
          <p className="muted-small">
            This round is no longer accepting new investments.
          </p>
        )}
        {status && (
          <p className="form-status" role="status">
            {status}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Your position</h2>
        <p>
          <strong>Invested:</strong> {userInvested} {tokenSymbol}
        </p>
        <p>
          <strong>Ownership (after finalize):</strong> {userOwnership}%
        </p>
        <p>
          <strong>Refund available:</strong> {refundableAmount} {tokenSymbol}
        </p>
        {canRefund && (
          <button type="button" className="btn btn-secondary" onClick={requestRefund}>
            Claim refund
          </button>
        )}
        {canFinalize && (
          <button type="button" className="btn btn-primary" onClick={finalizeRound}>
            Finalize round
          </button>
        )}
        {canClaim && (
          <button type="button" className="btn btn-primary" onClick={claimFunds}>
            Claim {claimableFunds} {tokenSymbol}
          </button>
        )}
        {isOwner && finalized && !fundsClaimed && Number(claimableFunds) === 0 && (
          <p className="muted-small">No claimable funds remain in the contract.</p>
        )}
      </section>
    </div>
  );
}
