const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EvidenceChainOfCustody contract...\n");

  const EvidenceChainOfCustody = await hre.ethers.getContractFactory("EvidenceChainOfCustody");
  const contract = await EvidenceChainOfCustody.deploy();

  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ EvidenceChainOfCustody deployed to:", contractAddress);

  // Save contract address and ABI to frontend
  const contractData = {
    address: contractAddress,
    abi: JSON.parse(contract.interface.formatJson())
  };

  // Use absolute path resolution
  const configDir = path.resolve(__dirname, "../../src/contracts");
  console.log("📁 Target directory:", configDir);
  
  if (!fs.existsSync(configDir)) {
    console.log("📁 Creating directory:", configDir);
    fs.mkdirSync(configDir, { recursive: true });
  }

  const outputFile = path.join(configDir, "EvidenceChainOfCustody.json");
  console.log("📝 Writing to:", outputFile);
  
  fs.writeFileSync(
    outputFile,
    JSON.stringify(contractData, null, 2)
  );

  // Verify file was created
  if (fs.existsSync(outputFile)) {
    console.log("✅ Contract ABI and address saved successfully!");
    console.log("📄 File location: src/contracts/EvidenceChainOfCustody.json");
    console.log("\n📋 Contract Details:");
    console.log("   Address:", contractAddress);
    console.log("   Network: Hardhat Local (Chain ID: 31337)");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Add Hardhat network to MetaMask (Chain ID: 31337, RPC: http://127.0.0.1:8545)");
    console.log("   2. Import a test account using one of the private keys shown above");
    console.log("   3. Switch MetaMask to Hardhat Local network");
    console.log("   4. Refresh your browser and connect wallet");
  } else {
    console.error("❌ Failed to create contract file!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
