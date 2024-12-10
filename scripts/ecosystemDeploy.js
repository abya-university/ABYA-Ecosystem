import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();

    const Ecosystem = await ethers.getContractFactory("Ecosystem");
    const ecosystem = await Ecosystem.deploy([deployer.address, '0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C', '0xcE59326853B8EfE539882137d16F826fE46BDD5c', '0x3fCf08DDE67A9ED9314F79B97197175313A8E327']);

    console.log("Ecosystem address: ", ecosystem.target);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });