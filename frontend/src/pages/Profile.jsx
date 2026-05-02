import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import crowdfundingAbi from "../abi/CrowdfundingEquity.json";
import { useWeb3 } from "../context/Web3Context.jsx";

const ROUND_STATE_LABELS = {
  0: "Active",
  1: "Successful — ready to finalize",
  2: "Failed — refunds open",
  3: "Finalized",
  4: "Closed",
};

function formatSharePct(shareWei) {
  if (shareWei === 0n) return "0%";
  return `${Number(ethers.formatUnits(shareWei, 18)).toFixed(4)}%`;
}

function projectedShareWei(amountInvested, equityPct, totalRaised) {
  if (totalRaised === 0n || amountInvested === 0n) return 0n;
  return (amountInvested * equityPct * ethers.WeiPerEther) / totalRaised;
}

export default function Profile() {
  const { deployed, account, ready, connect, loadError } = useWeb3();
  const tokenSymbol = deployed?.yodaSymbol || "YODA";
  const tokenDecimals = deployed?.yodaDecimals ?? 18;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const provider = useMemo(() => {
    if (!deployed?.rpcUrl) return null;
    try {
      return new ethers.JsonRpcProvider(deployed.rpcUrl);
    } catch {
      return null;
    }
  }, [deployed?.rpcUrl]);

  useEffect(() => {
    const list = deployed?.campaigns ?? [];
    if (!ready || !provider || !account || !list.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const next = [];
      for (const c of list) {
        const base = {
          slug: c.slug,
          title: c.title,
          amountInvested: "0",
          roundState: 0,
          roundStateLabel: "—",
          equityLabel: "—",
          equityHint: "",
          refundable: "0",
          error: "",
          hasPosition: false,
        };

        try {
          const contract = new ethers.Contract(
            c.crowdfunding,
            crowdfundingAbi,
            provider
          );

          const [
            inv,
            state,
            raised,
            eqPct,
            shareWei,
            refundable,
          ] = await Promise.all([
            contract.investors(account),
            contract.roundState(),
            contract.totalRaised(),
            contract.equityPercentageOffered(),
            contract.getInvestorShare(account),
            contract.refundableAmount(account),
          ]);

          const amountInvested =
            typeof inv.amountInvested === "bigint"
              ? inv.amountInvested
              : inv[0];
          const equityShareStored =
            typeof inv.equityShare === "bigint" ? inv.equityShare : inv[1];
          const stateNum = Number(state);
          const raisedBn = raised;
          const eqBn = eqPct;

          const investedHuman = ethers.formatUnits(amountInvested, tokenDecimals);
          const refundableHuman = ethers.formatUnits(refundable, tokenDecimals);
          const hasPosition =
            amountInvested > 0n || (refundable > 0n && stateNum === 2);

          let equityLabel = "—";
          let equityHint = "";

          if (stateNum === 3 || stateNum === 4) {
            const sw = shareWei > 0n ? shareWei : equityShareStored;
            equityLabel = formatSharePct(sw);
            equityHint =
              "Share of the equity pool offered by this campaign (on-chain after finalize).";
          } else if (stateNum === 1 && amountInvested > 0n) {
            const proj = projectedShareWei(amountInvested, eqBn, raisedBn);
            equityLabel = `${formatSharePct(proj)} (projected)`;
            equityHint =
              "Same math the contract will use at finalize; not locked until the owner calls finalize.";
          } else if (stateNum === 2) {
            equityLabel = "—";
            equityHint = "Round did not meet its goal; use refund on the campaign page if eligible.";
          } else {
            equityLabel = "—";
            equityHint =
              "Equity % is assigned only after a successful round is finalized.";
          }

          next.push({
            ...base,
            amountInvested: investedHuman,
            roundState: stateNum,
            roundStateLabel: ROUND_STATE_LABELS[stateNum] ?? `State ${stateNum}`,
            equityLabel,
            equityHint,
            refundable: refundableHuman,
            hasPosition,
          });
        } catch (e) {
          next.push({
            ...base,
            error: e.shortMessage || e.message || "Read failed",
          });
        }
      }

      if (!cancelled) {
        setRows(next);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, provider, account, deployed, tokenDecimals]);

  if (loadError) {
    return (
      <div className="container">
        <div className="alert alert-warn">{loadError}</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="container">
        <p className="muted-small">Configure campaigns in deployed.json to use this page.</p>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <header className="campaign-hero">
        <h1>My investments</h1>
        <p className="hero-lead">
          Positions across every campaign in this deployment for your connected
          wallet. Equity reflects your share of the <strong>offered equity pool</strong>{" "}
          (proportional to your YODA vs total raised after finalize).
        </p>
      </header>

      {!account ? (
        <section className="card prose-card">
          <p>Connect your wallet to see your investments and equity.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={connect}
            disabled={!ready}
          >
            Connect wallet
          </button>
        </section>
      ) : (
        <>
          <p className="mono muted-small" style={{ marginBottom: "1rem" }}>
            {account}
          </p>

          <section className="card">
            {loading ? (
              <p className="muted-small">Loading on-chain data…</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>{`Invested (${tokenSymbol})`}</th>
                      <th>Equity (pool %)</th>
                      <th>Refundable</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.slug}
                        style={
                          r.hasPosition ? { background: "rgba(0,0,0,0.03)" } : undefined
                        }
                      >
                        <td>
                          <strong>{r.title}</strong>
                          {r.error && (
                            <div className="muted-small" style={{ color: "crimson" }}>
                              {r.error}
                            </div>
                          )}
                        </td>
                        <td>{r.roundStateLabel}</td>
                        <td>
                          {Number(r.amountInvested).toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}
                        </td>
                        <td>
                          <span>{r.equityLabel}</span>
                          {r.equityHint && (
                            <div className="muted-small" style={{ maxWidth: "14rem" }}>
                              {r.equityHint}
                            </div>
                          )}
                        </td>
                        <td>
                          {Number(r.refundable) > 0
                            ? Number(r.refundable).toLocaleString(undefined, {
                                maximumFractionDigits: 6,
                              })
                            : "—"}
                        </td>
                        <td>
                          <Link className="btn btn-ghost" to={`/campaign/${r.slug}`}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
