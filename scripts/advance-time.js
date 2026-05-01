const { ethers } = require("hardhat");

/** Advance Hardhat local time by 8 days + mine a block (for testing finalize after deadline). */
async function main() {
  await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine", []);
  const b = await ethers.provider.getBlock("latest");
  console.log("New block timestamp:", b.timestamp);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
