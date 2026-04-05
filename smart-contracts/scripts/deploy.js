const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...");
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  console.log("Voting contract deployed to:", await voting.getAddress());

  // Wait a moment before interacting to ensure the contract state is ready locally
  console.log("Waiting for network propagation...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Deployment complete.");
  console.log("-----------------------------------------");
  console.log("You can find the ABI in /smart-contracts/artifacts/contracts/Voting.sol/Voting.json");
  console.log("Remember to copy the contract address to your frontend environment variables.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
