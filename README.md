# Barakah Equity

**Barakah Equity** is a demo web app for **single-offering** equity crowdfunding: contributors use **YODA** (ERC‑20); **ETH** pays **gas**. Ownership is **proportional** — **no loans, no interest** in this model. **Not** legal or Sharia advice.

## Quick look (sample UI)

The repo ships **`frontend/public/deployed.json`** with **example campaigns** (titles, goals, demo seed tables). Open the site with `npm run dev` in `frontend/` to browse them. On-chain reads fall back to those numbers if the RPC is down or addresses are placeholders.

## Full interactive demo (local contracts)

```bash
npm install
npm run node
npm run deploy:local
cd frontend
npm install
npm run dev
```

That overwrites `deployed.json` with **chainId 31337**, mock YODA, and three live campaigns. Import a Hardhat test account in MetaMask (see Hardhat console output) and use **Connect wallet**.

## Gas vs YODA

| | |
|--|--|
| **ETH** | Pays **gas** for approve, invest, finalize (MetaMask will ask for this). |
| **YODA** | ERC‑20 — **investment** amount after **approve**. Does not pay gas. |

## Repo layout

| Path | Purpose |
|------|---------|
| [contracts/CrowdfundingEquity.sol](contracts/CrowdfundingEquity.sol) | Crowdfunding pool |
| [contracts/MockYODA.sol](contracts/MockYODA.sol) | Mock token for local Hardhat |
| [scripts/deploy-local.js](scripts/deploy-local.js) | Local node: mock + 3 campaigns → `deployed.json` |
| [frontend/public/deployed.example.json](frontend/public/deployed.example.json) | Minimal template |
| [frontend/](frontend/) | React + Vite + ethers |

## Prerequisites

- Node.js 18+
- MetaMask (for wallet flows against a real RPC)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run node` | Local Hardhat RPC |
| `npm run deploy:local` | Deploy mock YODA + campaigns → `frontend/public/deployed.json` |
| `npm run time:advance` | Advance local block time (after deadline tests) |
| `cd frontend && npm run dev` | Website |
| `cd frontend && npm run build` | Production build |

## `.env`

Optional for future tooling. See [.env.example](.env.example).

## PowerShell

```powershell
npm.cmd run deploy:local
```

## Disclaimer

Educational demo only. Smart contracts are unaudited. Not an offer of securities.
