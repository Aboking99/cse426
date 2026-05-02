# Barakah Equity

**Barakah Equity** is an equity crowdfunding DApp: contributors use **YODA** (ERC-20), **ETH** pays **gas**, and ownership is assigned proportionally after a successful round is finalized. The repo supports both **local Hardhat** development and **Sepolia** deployment. **Not** legal or Sharia advice.

## Quick look (sample UI)

The repo ships **`frontend/public/deployed.json`** with **example campaigns** (titles, goals, demo seed tables). Open the site with `npm run dev` in `frontend/` to browse them. On-chain reads fall back to those numbers if the RPC is down or addresses are placeholders.

## Local development

```bash
npm install
npm run node
npm run deploy:local
cd frontend
npm install
npm run dev
```

That overwrites `deployed.json` with **chainId 31337**, mock YODA, and three live campaigns. Import a Hardhat test account in MetaMask (see Hardhat console output) and use **Connect wallet**.

## Sepolia deployment

1. Copy `.env.example` to `.env`
2. Set `SEPOLIA_RPC_URL` and `PRIVATE_KEY`
3. Set `YODA_TOKEN_ADDRESS` to the class Yoda token address on Sepolia
4. Run:

```bash
npm install
npm run compile
npm run deploy:sepolia
cd frontend
npm install
npm run dev
```

This writes `frontend/public/deployed.json` with Sepolia contract addresses and network metadata so the frontend can connect to the live deployment. The deploy script now requires the class Yoda token and will fail fast if `YODA_TOKEN_ADDRESS` is missing.

## Gas vs YODA

| | |
|--|--|
| **ETH** | Pays **gas** for approve, invest, finalize (MetaMask will ask for this). |
| **YODA** | ERC‑20 — **investment** amount after **approve**. Does not pay gas. |

## Repo layout

| Path | Purpose |
|------|---------|
| [contracts/CrowdfundingEquity.sol](contracts/CrowdfundingEquity.sol) | Crowdfunding round contract with finalize / refund / claim lifecycle |
| [contracts/MockYODA.sol](contracts/MockYODA.sol) | Mock token for local Hardhat |
| [contracts/YodaToken.sol](contracts/YodaToken.sol) | Optional reference token contract; Sepolia deployments should use the class Yoda token |
| [scripts/deploy-local.js](scripts/deploy-local.js) | Local node: mock token + seeded campaigns → `deployed.json` |
| [scripts/deploy-sepolia.js](scripts/deploy-sepolia.js) | Sepolia deployment script |
| [frontend/public/deployed.example.json](frontend/public/deployed.example.json) | Minimal template |
| [frontend/](frontend/) | React + Vite + ethers |

## Prerequisites

- Node.js 18+
- MetaMask (for wallet flows against a real RPC)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run node` | Local Hardhat RPC |
| `npm run deploy:local` | Deploy mock YODA + seeded campaigns → `frontend/public/deployed.json` |
| `npm run deploy:sepolia` | Deploy campaigns to Sepolia → `frontend/public/deployed.json` |
| `npm run time:advance` | Advance local block time (after deadline tests) |
| `npm test` | Run the Hardhat test suite |
| `cd frontend && npm run dev` | Website |
| `cd frontend && npm run build` | Production build |

## Deploy on Vercel (free tier)

Connect this GitHub repo in the [Vercel dashboard](https://vercel.com/new). Use **Node.js 18+**.

**Option A — leave project root at the repo root (simplest):** do not set a subdirectory root. The repo includes [vercel.json](vercel.json) at the monorepo root so Vercel runs `npm install` / `npm run build` inside `frontend/` and publishes `frontend/dist`, with SPA rewrites. Framework preset can be **Other** (overridden by `vercel.json`).

**Option B — Root Directory `frontend`:** then use Vite preset, default install, `npm run build`, output `dist`. SPA rewrites come from [frontend/vercel.json](frontend/vercel.json).

If the build log shows lots of `glob` / Hardhat deprecation noise, Vercel was installing from the **wrong directory** (repo root instead of `frontend`); use Option A as committed, or fix Option B’s Root Directory.

[frontend/public/deployed.json](frontend/public/deployed.json) is copied into the production bundle at build time — update it (or redeploy from Hardhat) before triggering a new Vercel build if contract addresses or RPC metadata change.

## `.env`

Required for Sepolia deployment. See [.env.example](.env.example).

## PowerShell

```powershell
npm.cmd run deploy:local
```

## Disclaimer

Educational project only. Smart contracts are unaudited. Not an offer of securities.
