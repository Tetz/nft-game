const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ERC20 Token contract
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();
  console.log("Token address:", token.address);

  // Deploy CryptoPet contract
  const CryptoPet = await ethers.getContractFactory("CryptoPet");
  const cryptoPet = await CryptoPet.deploy();
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

  // Save Token contract address and ABI
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: token.address, CryptoPet: cryptoPet.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");
  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );

  // Save CryptoPet contract ABI
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
