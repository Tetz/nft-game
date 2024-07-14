const { ethers } = require("hardhat");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying the contracts with the account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ERC20 Token contract
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy(ethers.utils.parseUnits("1000000", 18)); // 1,000,000 MTK
  await token.deployed();
  console.log("Token address:", token.address);

  // Check deployer's balance
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`Deployer balance: ${ethers.utils.formatUnits(deployerBalance, 18)} MTK`);

  // Transfer tokens to your wallet address
  const myWalletAddress = "0x59178bAc7A9BBfa287F39887EAA2826666f14A2a";
  const transferAmount = ethers.utils.parseUnits("1000", 18); // Transfer 1000 MTK
  const transferTx = await token.transfer(myWalletAddress, transferAmount);
  await transferTx.wait();
  console.log(`Transferred ${ethers.utils.formatUnits(transferAmount, 18)} MTK to ${myWalletAddress}`);

  // Check your wallet's balance
  const myWalletBalance = await token.balanceOf(myWalletAddress);
  console.log(`My Wallet balance: ${ethers.utils.formatUnits(myWalletBalance, 18)} MTK`);

  // Deploy CryptoPet contract with the token address
  const CryptoPet = await ethers.getContractFactory("CryptoPet");
  const cryptoPet = await CryptoPet.deploy(token.address);
  await cryptoPet.deployed();
  console.log("CryptoPet address:", cryptoPet.address);

  // Save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, cryptoPet);
}

function saveFrontendFiles(token, cryptoPet) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: token.address, CryptoPet: cryptoPet.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("MyToken");
  fs.writeFileSync(
    path.join(contractsDir, "MyToken.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );

  const CryptoPetArtifact = artifacts.readArtifactSync("CryptoPet");
  fs.writeFileSync(
    path.join(contractsDir, "CryptoPet.json"),
    JSON.stringify(CryptoPetArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
