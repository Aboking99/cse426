import { Link } from "react-router-dom";

export default function FAQ() {
  return (
    <div className="container narrow">
      <h1>FAQ</h1>
      <section className="card prose-card">
        <h2>Why does MetaMask ask for ETH when I invest or approve?</h2>
        <p>
          Every on-chain action needs <strong>gas</strong>, paid in{" "}
          <strong>ETH</strong> on the network you are using.{" "}
          <strong>YODA</strong> is the ERC‑20 you approve and invest with; it
          does not pay gas.
        </p>
        <h2>What is the difference between Approve and Invest?</h2>
        <p>
          <strong>Approve</strong> lets the crowdfunding contract spend up to a
          certain amount of your YODA. <strong>Invest</strong> triggers{" "}
          <code>transferFrom</code> and records your contribution on-chain.
        </p>
        <h2>When does ownership show up?</h2>
        <p>
          After the owner calls <strong>finalize</strong> (only after the
          deadline and once the funding goal is met), the contract computes each
          investor&apos;s share of the offered equity percentage. Until then,
          your &quot;ownership %&quot; may read as zero.
        </p>
        <h2>How do I list a new campaign?</h2>
        <p>
          All campaigns are run <strong>through us</strong> — there is no
          self-serve flow to publish a live offering from the site alone. To
          propose a campaign, reach out on our{" "}
          <Link to="/contact">Contact</Link> page. Each listing requires{" "}
          <strong>admin approval</strong> before it can go live for investors.
        </p>
        <h2>Can fees be removed so I only use YODA?</h2>
        <p>
          Not with a normal wallet: something must pay gas (typically ETH on
          Ethereum-compatible chains). Gasless flows need a relayer — not
          implemented here.
        </p>
      </section>
    </div>
  );
}
