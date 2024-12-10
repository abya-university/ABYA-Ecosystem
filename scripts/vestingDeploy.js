import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();

    const Vesting = await ethers.getContractFactory("Vesting");
    const vesting = await Vesting.deploy([deployer.address, '0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C', '0xcE59326853B8EfE539882137d16F826fE46BDD5c', '0x3fCf08DDE67A9ED9314F79B97197175313A8E327']);

    console.log("Vesting address: ", vesting.target);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });