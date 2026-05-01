import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import crowdfundingAbi from "../abi/CrowdfundingEquity.json";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function Home() {
  const { deployed, loadError, ready } = useWeb3();
  const [raisedMap, setRaisedMap] = useState({});

  useEffect(() => {
    if (!deployed?.campaigns?.length || !deployed.rpcUrl) return;

    const provider = new ethers.JsonRpcProvider(deployed.rpcUrl);
    const contracts = deployed.campaigns.map(
      (c) => new ethers.Contract(c.crowdfunding, crowdfundingAbi, provider)
    );

    let cancelled = false;
    (async () => {
      const out = {};
      for (let i = 0; i < deployed.campaigns.length; i++) {
        try {
          const r = await contracts[i].totalRaised();
          out[deployed.campaigns[i].slug] = ethers.formatUnits(r, 18);
        } catch {
          out[deployed.campaigns[i].slug] =
            deployed.campaigns[i].totalRaisedAfterSeed ?? "0";
        }
      }
      if (!cancelled) setRaisedMap(out);
    })();

    return () => {
      cancelled = true;
    };
  }, [deployed]);

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
        <div className="hero">
          <h1>Barakah Equity</h1>
          <p className="hero-lead">
            Sharia-minded equity crowdfunding: one offering at a time,
            proportional ownership in YODA — no loans, no interest.
          </p>
        </div>
        <div className="alert alert-warn">
          {deployed?.notes ||
            "Add example campaigns to frontend/public/deployed.json, or run npm run deploy:local with Hardhat for live contracts."}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Invest with clarity</h1>
        <p className="hero-lead">
          Browse offerings below. Each pool sells a fixed slice of equity; your
          share tracks your contribution. Network fees are paid in{" "}
          <strong>ETH</strong> (gas). <strong>YODA</strong> is the token you
          approve and invest with.
        </p>
      </section>

      <section className="campaign-grid" aria-label="Campaigns">
        {deployed.campaigns.map((c) => {
          const raised =
            raisedMap[c.slug] ?? c.totalRaisedAfterSeed ?? "0";
          const goal = Number(c.fundingGoalHuman);
          const r = Number(raised);
          const pct = goal > 0 ? Math.min(100, (r / goal) * 100) : 0;
          const dl = c.deadline
            ? new Date(c.deadline * 1000).toLocaleString()
            : "—";

          return (
            <article key={c.slug} className="campaign-card">
              <div className="campaign-card-head">
                <h2>{c.title}</h2>
                <p className="campaign-sub">{c.subtitle}</p>
              </div>
              <div className="progress-wrap">
                <div
                  className="progress-bar"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <dl className="campaign-stats">
                <div>
                  <dt>Raised</dt>
                  <dd>
                    {Number(raised).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    YODA
                  </dd>
                </div>
                <div>
                  <dt>Goal</dt>
                  <dd>{c.fundingGoalHuman} YODA</dd>
                </div>
                <div>
                  <dt>Equity pool</dt>
                  <dd>{c.equityPercentageOffered}%</dd>
                </div>
                <div>
                  <dt>Deadline</dt>
                  <dd className="muted-small">{dl}</dd>
                </div>
              </dl>
              <Link className="btn btn-secondary" to={`/campaign/${c.slug}`}>
                View offering
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
