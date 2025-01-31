import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy DiamondCut contract
    const DiamondCut = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutfacet = await DiamondCut.deploy();
    await diamondCutfacet.waitForDeployment();
    console.log("DiamondCut deployed to:", diamondCutfacet.target);

    // Deploy DiamondLoupe contract
    const DiamondLoupe = await ethers.getContractFactory("DiamondLoupeFacet");
    const diamondLoupe = await DiamondLoupe.deploy();
    await diamondLoupe.waitForDeployment();
    console.log("DiamondLoupe deployed to:", diamondLoupe.target);

    // Deploy Diamond
    const Diamond = await ethers.getContractFactory("EcosystemDiamond");
    const reviewers = [
        "0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C",
        "0xcE59326853B8EfE539882137d16F826fE46BDD5c",
        "0x3fCf08DDE67A9ED9314F79B97197175313A8E327",
        "0x74c5d6cd0325205b86e2a30B07f1be350367B40D"
    ];
    const owner = deployer.address;
    const diamond = await Diamond.deploy(reviewers, owner);
    await diamond.waitForDeployment();
    console.log("Diamond deployed to:", diamond.target);

    // Deploy Facets
    const Ecosystem1Facet = await ethers.getContractFactory("Ecosystem1Facet");
    const ecosystem1Facet = await Ecosystem1Facet.deploy();
    await ecosystem1Facet.waitForDeployment();
    console.log("Ecosystem1Facet deployed to:", ecosystem1Facet.target);

    const Ecosystem2Facet = await ethers.getContractFactory("Ecosystem2Facet");
    const ecosystem2Facet = await Ecosystem2Facet.deploy();
    await ecosystem2Facet.waitForDeployment();
    console.log("Ecosystem2Facet deployed to:", ecosystem2Facet.target);

    const Ecosystem3Facet = await ethers.getContractFactory("Ecosystem3Facet");
    const ecosystem3Facet = await Ecosystem3Facet.deploy();
    await ecosystem3Facet.waitForDeployment();
    console.log("Ecosystem3Facet deployed to:", ecosystem3Facet.target);

    // Get selectors for each facet
    const selectors1 = getSelectorsFromInterface(Ecosystem1Facet.interface);
    const selectors2 = getSelectorsFromInterface(Ecosystem2Facet.interface);
    const selectors3 = getSelectorsFromInterface(Ecosystem3Facet.interface);

    console.log("Selectors1:", selectors1);
    console.log("Selectors2:", selectors2);
    console.log("Selectors3:", selectors3);

    const cuts = [
        {
            facetAddress: ecosystem1Facet.target,
            action: 0, // Add
            functionSelectors: selectors1
        },
        {
            facetAddress: ecosystem2Facet.target,
            action: 0,
            functionSelectors: selectors2
        },
        {
            facetAddress: ecosystem3Facet.target,
            action: 0,
            functionSelectors: selectors3
        },
    ];

    console.log("Cuts:", cuts);

    // Create contract instance with IDiamondCut interface
    const diamondCutInterface = [
        "function diamondCut((address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes calldata _calldata) external"
    ];
    const diamondCutContract = new ethers.Contract(diamond.target, diamondCutInterface, deployer);

    try {
        const tx = await diamondCutContract.diamondCut(
            cuts,
            ethers.ZeroAddress,
            "0x",
            { gasLimit: 8000000 } // Add explicit gas limit
        );
        console.log("Diamond cut transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Diamond cut transaction confirmed:", receipt.hash);
    } catch (error) {
        console.error("Error performing diamondCut:", error);
        throw error;
    }
}

function getSelectorsFromInterface(contractInterface) {
    const selectors = [];
    for (const fragment of contractInterface.fragments) {
        if (fragment.type === 'function') {
            // Get the full function signature
            const signature = fragment.format('sighash');
            // Calculate the selector
            const selector = contractInterface.getFunction(fragment.name).selector;
            selectors.push(selector);
            console.log(`Added selector for ${signature}: ${selector}`);
        }
    }
    return selectors;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });