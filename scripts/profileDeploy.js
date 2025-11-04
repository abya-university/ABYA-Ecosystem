import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
    const Profile = await ethers.getContractFactory("contracts/Profile.sol:Nemezis");
    const profile = await Profile.deploy();
    await profile.waitForDeployment();
    console.log("Profile deployed to:", profile.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});