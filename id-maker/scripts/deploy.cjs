const hre = require("hardhat");

async function main() {
  console.log("🔧 Deploying VoterIDRegistry contract...");

  const VoterIDRegistry = await hre.ethers.getContractFactory("VoterIDRegistry");
  const registry = await VoterIDRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`✅ VoterIDRegistry deployed to: ${address}`);
  console.log("");
  console.log("─────────────────────────────────────────────────────");
  console.log("  IMPORTANT: Copy this address into config.js");
  console.log(`  CONTRACT_ADDRESS = "${address}"`);
  console.log("─────────────────────────────────────────────────────");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
