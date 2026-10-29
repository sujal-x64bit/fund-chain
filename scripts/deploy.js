const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const FundChain = await hre.ethers.getContractFactory("FundChain");
  const fundChain = await FundChain.deploy();
  await fundChain.waitForDeployment();

  const address = await fundChain.getAddress();
  console.log("FundChain deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("\nPaste this address into index.html as CONTRACT_ADDRESS.");

  fs.writeFileSync(
    path.join(__dirname, "..", "deployed-address.txt"),
    `${address}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
