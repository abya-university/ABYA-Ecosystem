const hre = require("hardhat");

async function main() {
  const AbyaUniversityVC = await hre.ethers.getContractFactory("AbyaUniversityVC");
  const vcContract = await AbyaUniversityVC.deploy();
  await vcContract.deployed();
  console.log("AbyaUniversityVC deployed to:", vcContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
