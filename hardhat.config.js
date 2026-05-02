require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const sepoliaAccounts =
  PRIVATE_KEY.length === 64 || PRIVATE_KEY.startsWith("0x")
    ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
    : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    ...(SEPOLIA_RPC_URL && sepoliaAccounts.length
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: sepoliaAccounts,
            chainId: 11155111,
          },
        }
      : {}),
  },
};
