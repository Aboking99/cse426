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
        <h2>Which network does this site use?</h2>
        <p>
          Whatever <code>chainId</code> and <code>rpcUrl</code> you set in{" "}
          <code>frontend/public/deployed.json</code>. For a full interactive
          demo, run a local Hardhat node and <code>npm run deploy:local</code>{" "}
          to write real contract addresses there.
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
