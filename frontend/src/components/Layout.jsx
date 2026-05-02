import { Link, Outlet } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context.jsx";

export default function Layout() {
  const { connect, account, connectStatus, ready, deployed, yodaIsMock } = useWeb3();

  const networkLabel = deployed?.networkName || "Demo";
  const networkDescription = yodaIsMock
    ? "Mock YODA is enabled on this network for local testing."
    : "Wallet actions use ETH for gas and YODA for investment amounts.";

  return (
    <div className="app-shell">
      <div className="network-banner" role="status">
        <strong>{networkLabel}</strong> — {networkDescription}
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <span className="brand-name">Barakah Equity</span>
              <span className="brand-tagline">Proportional equity · No riba</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Main">
            <Link to="/">Campaigns</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="header-wallet">
            <button
              type="button"
              className="btn btn-primary"
              onClick={connect}
              disabled={!ready}
            >
              {account
                ? `${account.slice(0, 6)}…${account.slice(-4)}`
                : "Connect wallet"}
            </button>
            {connectStatus && (
              <span className="header-status">{connectStatus}</span>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            <strong>Barakah Equity</strong> — educational crowdfunding DApp.
            Not financial, legal, or Sharia advice.
          </p>
          <p className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
