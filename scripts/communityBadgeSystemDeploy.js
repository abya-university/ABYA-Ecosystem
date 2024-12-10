import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
    await ethers.getSigners();

    const CommunityBadgeSystem = await ethers.getContractFactory("CommunityBadgeSystem");
    const communityBadgeSystem = await CommunityBadgeSystem.deploy();

    console.log("CommunityBadgeSystem address: ", communityBadgeSystem.target);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });