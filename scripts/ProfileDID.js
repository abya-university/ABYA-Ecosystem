import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();

    const RegistryContract = await ethers.getContractFactory("EthereumDIDRegistry");
    const registryContract = await RegistryContract.deploy();

    console.log("DID Registry address: ", registryContract.target);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
