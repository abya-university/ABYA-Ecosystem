import pkg from 'hardhat';
const { ethers } = pkg;

function getSelectors(contract) {
    const signatures = new Set();
    const selectors = [];

    for (const fragment of contract.interface.fragments) {
        if (fragment.type === 'function') {
            const selector = contract.interface.getFunction(fragment.name).selector;
            const signature = fragment.format('sighash');

            if (!signatures.has(selector)) {
                signatures.add(selector);
                selectors.push(selector);
                console.log(`Added selector for ${signature}: ${selector}`);
            }
        }
    }
    return selectors;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy DiamondCut contract
    const DiamondCut = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCut.deploy();
    await diamondCutFacet.waitForDeployment();
    console.log("DiamondCut deployed to:", diamondCutFacet.target);

    // Deploy DiamondInit contract
    const DiamondInit = await ethers.getContractFactory('DiamondInit');
    const diamondInit = await DiamondInit.deploy();
    await diamondInit.waitForDeployment();
    console.log('DiamondInit deployed:', diamondInit.target);

    // Deploy DiamondLoupe contract
    const DiamondLoupe = await ethers.getContractFactory("DiamondLoupeFacet");
    const diamondLoupe = await DiamondLoupe.deploy();
    await diamondLoupe.waitForDeployment();
    console.log("DiamondLoupe deployed to:", diamondLoupe.target);

    // Deploy OwnershipFacet contract
    const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    const ownershipFacet = await OwnershipFacet.deploy();
    await ownershipFacet.waitForDeployment();
    console.log("OwnershipFacet deployed to:", ownershipFacet.target);

    // Deploy Diamond
    const Diamond = await ethers.getContractFactory("EcosystemDiamond");
    const reviewers = [
        "0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C",
        "0xcE59326853B8EfE539882137d16F826fE46BDD5c",
        "0x3fCf08DDE67A9ED9314F79B97197175313A8E327",
        "0x74c5d6cd0325205b86e2a30B07f1be350367B40D"
    ];

    // Encode the init function call
    const functionCall = diamondInit.interface.encodeFunctionData('init');

    // Prepare diamond cut and args
    const diamondCut = [
        {
            facetAddress: diamondCutFacet.target,
            action: 0,
            functionSelectors: getSelectors(diamondCutFacet)
        },
        {
            facetAddress: diamondLoupe.target,
            action: 0,
            functionSelectors: getSelectors(diamondLoupe)
        },
        {
            facetAddress: ownershipFacet.target,
            action: 0,
            functionSelectors: getSelectors(ownershipFacet)
        }
    ];

    const diamondArgs = {
        owner: deployer.address,
        init: diamondInit.target,
        initCalldata: functionCall
    };

    const diamond = await Diamond.deploy(diamondCut, diamondArgs, reviewers, deployer.address);
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

    // Get selectors
    const selectors1 = getSelectors(ecosystem1Facet);
    const selectors2 = getSelectors(ecosystem2Facet);
    const selectors3 = getSelectors(ecosystem3Facet);

    function removeDuplicateSelectors(selectors, previousSelectorArrays) {
        console.log("\n--- removeDuplicateSelectors ---"); // Clearer separator
        console.log("Initial Selectors:", selectors);

        const existing = new Set();
        previousSelectorArrays.forEach(arr => arr.forEach(selector => existing.add(selector)));

        const uniqueSelectors = selectors.filter(selector => !existing.has(selector));

        console.log("Existing Selectors (from previous arrays):", Array.from(existing)); // Log existing selectors
        console.log("Unique Selectors:", uniqueSelectors);
        console.log("--- End of removeDuplicateSelectors ---\n"); // Clearer separator

        return uniqueSelectors;
    }

    const uniqueSelectors1 = removeDuplicateSelectors(selectors1, [diamondCut[1].functionSelectors, diamondCut[0].functionSelectors, diamondCut[2].functionSelectors]);
    const uniqueSelectors2 = removeDuplicateSelectors(selectors2, [diamondCut[1].functionSelectors, diamondCut[0].functionSelectors, diamondCut[2].functionSelectors, uniqueSelectors1]);
    const uniqueSelectors3 = removeDuplicateSelectors(selectors3, [diamondCut[1].functionSelectors, diamondCut[0].functionSelectors, diamondCut[2].functionSelectors, uniqueSelectors1, uniqueSelectors2]);

    // Prepare cuts array for additional facets
    const additionalFacetCuts = [
        {
            facetAddress: ecosystem1Facet.target,
            action: 0,
            functionSelectors: uniqueSelectors1
        },
        {
            facetAddress: ecosystem2Facet.target,
            action: 0,
            functionSelectors: uniqueSelectors2
        },
        {
            facetAddress: ecosystem3Facet.target,
            action: 0,
            functionSelectors: uniqueSelectors3
        }
    ];

    console.log("Additional Facet Cuts Structure:", JSON.stringify(additionalFacetCuts, null, 2));

    // Execute additional diamond cut
    const diamondCutInterface = ["function diamondCut((address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes calldata _calldata) external"];
    const diamondCutContract = new ethers.Contract(diamond.target, diamondCutInterface, deployer);

    try {
        const tx = await diamondCutContract.diamondCut(
            additionalFacetCuts,
            ethers.ZeroAddress,
            "0x",
            { gasLimit: 8000000 }
        );
        console.log("Diamond cut transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Diamond cut transaction confirmed:", receipt.transactionHash);
    } catch (error) {
        console.error("Detailed error:", {
            message: error.message,
            reason: error.reason,
            code: error.code,
            data: error.data,
            transaction: error.transaction
        });
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });