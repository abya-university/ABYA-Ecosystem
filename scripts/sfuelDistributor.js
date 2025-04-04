import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();

    const SFuelDistributor = await ethers.getContractFactory("SFuelDistributor");
    const sfuelDistributor = await SFuelDistributor.deploy();

    console.log("SFuelDistributor address: ", sfuelDistributor.target);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });