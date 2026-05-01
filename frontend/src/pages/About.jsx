export default function About() {
  return (
    <div className="container narrow">
      <h1>About Barakah Equity</h1>
      <section className="card prose-card">
        <p className="lead">
          Barakah Equity is a <strong>demo</strong> interface for a single
          fundraising style: contributors supply <strong>YODA</strong> (ERC-20)
          into one pool at a time; when the round closes, ownership is split{" "}
          <strong>proportionally</strong> to what each person put in. There are
          no loans and no interest in this model.
        </p>
        <h2>Why proportional equity?</h2>
        <p>
          In many Islamic finance discussions, <em>riba</em> (interest) is
          avoided by structuring partnerships where risk and reward are shared
          in line with capital — closer to musharakah / equity-like
          participation than fixed debt repayments. This codebase does{" "}
          <strong>not</strong> implement profit distribution or legal
          contracts; it only records contributions and a fixed total equity
          percentage for teaching and prototyping.
        </p>
        <h2>What this demo is not</h2>
        <ul>
          <li>Not a registered security or investment product.</li>
          <li>Not a fatwa or legal opinion — consult qualified scholars and counsel.</li>
          <li>Not a guarantee of returns; smart contracts can fail or be misused.</li>
        </ul>
        <p className="sharia-note">
          This is a <strong>front-end demo</strong>: sample campaigns and
          numbers illustrate the product. Use <strong>ETH</strong> for gas and{" "}
          <strong>YODA</strong> (or a mock token locally) for contributions when
          you connect a wallet to real contracts. Nothing here is production
          value or a real offering.
        </p>
      </section>
    </div>
  );
}
