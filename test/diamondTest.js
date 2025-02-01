import { expect } from "chai";
import pkg from 'hardhat'; // Use default import for hardhat
const { ethers } = pkg; // Destructure ethers from the imported pkg
import { describe, it, before } from 'mocha';

describe("Diamond Contract Integration Tests", function () {
    let diamond;
    let ecosystem1Facet;
    let owner, addr1, addr2;
    let diamondAddress;

    const DifficultyLevel = {
        BEGINNER: 0,
        INTERMEDIATE: 1,
        ADVANCED: 2
    };

    function getSelectors(contract) {
        const signatures = new Set(); // Use a Set to track unique signatures
        const selectors = [];

        for (const fragment of contract.interface.fragments) {
            if (fragment.type === 'function') {
                const selector = contract.interface.getFunction(fragment.name).selector;
                const signature = fragment.format('sighash');

                // Only add if we haven't seen this selector before
                if (!signatures.has(selector)) {
                    signatures.add(selector);
                    selectors.push(selector);
                    console.log(`Added selector for ${signature}: ${selector}`);
                } else {
                    console.log(`Skipping duplicate selector for ${signature}: ${selector}`);
                }
            }
        }
        return selectors;
    }

    before(async function () {
        this.timeout(60000);
        try {
            [owner, addr1, addr2] = await ethers.getSigners();
            console.log("Deploying contracts with account:", owner.address);

            const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
            const diamondCutFacet = await DiamondCutFacet.deploy();
            await diamondCutFacet.waitForDeployment();
            console.log("DiamondCutFacet deployed at:", diamondCutFacet.target);

            const DiamondLoupe = await ethers.getContractFactory("DiamondLoupeFacet");
            const diamondLoupe = await DiamondLoupe.deploy();
            await diamondLoupe.waitForDeployment();
            console.log("DiamondLoupeFacet deployed at:", diamondLoupe.target);

            const Diamond = await ethers.getContractFactory("EcosystemDiamond");
            const reviewers = [
                "0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C",
                "0xcE59326853B8EfE539882137d16F826fE46BDD5c",
                "0x3fCf08DDE67A9ED9314F79B97197175313A8E327",
                "0x74c5d6cd0325205b86e2a30B07f1be350367B40D"
            ];

            diamond = await Diamond.deploy(reviewers, owner.address);
            await diamond.waitForDeployment();
            diamondAddress = diamond.target;
            console.log("Diamond deployed at:", diamondAddress);

            const Ecosystem1Facet = await ethers.getContractFactory("Ecosystem1Facet");
            const ecosystem1FacetContract = await Ecosystem1Facet.deploy();
            await ecosystem1FacetContract.waitForDeployment();
            console.log("Ecosystem1Facet deployed at:", ecosystem1FacetContract.target);

            // Get selectors for each facet
            const selectorsLoupe = getSelectors(diamondLoupe);
            const selectors1 = getSelectors(ecosystem1FacetContract);

            // Remove any selectors that exist in the loupe from ecosystem1
            const uniqueSelectors1 = selectors1.filter(
                selector => !selectorsLoupe.includes(selector)
            );

            const diamondCutInterface = [
                "function diamondCut((address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes calldata _calldata) external"
            ];
            const diamondCutContract = new ethers.Contract(diamondAddress, diamondCutInterface, owner);

            const cuts = [
                {
                    facetAddress: diamondLoupe.target,
                    action: 0,
                    functionSelectors: selectorsLoupe
                },
                {
                    facetAddress: ecosystem1FacetContract.target,
                    action: 0,
                    functionSelectors: uniqueSelectors1
                }
            ];

            console.log("Diamond Cut Structure:", cuts);
            console.log("Ecosystem1Facet function selectors:", getSelectors(ecosystem1FacetContract));

            const tx = await diamondCutContract.diamondCut(
                cuts,
                ethers.ZeroAddress,
                "0x"
            );
            console.log("Diamond cut transaction sent:", tx.hash);
            await tx.wait();
            console.log("Diamond cut completed");

            const diamondWithFacetABI = new ethers.Contract(
                diamondAddress,                 // Diamond contract address
                Ecosystem1Facet.interface,    // Use *FACET's* ABI here!
                owner                          // Signer (owner)
            );

            const role = await ecosystem1FacetContract.COURSE_OWNER_ROLE(); // Get the role (from the facet or diamond, doesn't matter now)
            const grantTx = await diamondWithFacetABI.grantRole(role, owner.address); // Call grantRole on the DIAMOND, using the FACET's ABI
            await grantTx.wait();
            console.log("COURSE_OWNER_ROLE granted to owner");

            ecosystem1Facet = new ethers.Contract(diamondAddress, Ecosystem1Facet.interface, owner); // Connect to the Diamond

            // const loupeSelectors = await diamondLoupe.facetFunctionSelectors(ecosystem1FacetContract.target);
            // console.log("Functions in Ecosystem1Facet after diamondCut:", loupeSelectors);

            // ecosystem1Facet = await ethers.getContractAt("Ecosystem1Facet", diamondAddress);
            // console.log("Ecosystem1Facet connected at Diamond address");

        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    describe("Course Management", function () {
        it("should create a new course successfully", async function () {
            const courseName = "Blockchain Basics";
            const description = "Introduction to blockchain technology";

            const tx = await ecosystem1Facet.connect(addr1).createCourse(courseName, description, DifficultyLevel.BEGINNER);
            const receipt = await tx.wait();
            console.log("Course creation transaction receipt:", receipt);

            await expect(tx).to.emit(ecosystem1Facet, "CourseCreationSuccess").withArgs(0, "Blockchain Basics", false);
        });

        it("should increment course count and nextCourseId", async function () {
            const initialCourses = await ecosystem1Facet.getAllCourses();
            const initialCount = initialCourses.length;

            await ecosystem1Facet.createCourse(
                "Second Course",
                "Another course description",
                DifficultyLevel.INTERMEDIATE
            );

            const newCourses = await ecosystem1Facet.getAllCourses();
            expect(newCourses.length).to.equal(initialCount + 1);
            expect(newCourses[newCourses.length - 1].courseId).to.equal(initialCount);
        });

        it("should grant COURSE_OWNER_ROLE to course creator", async function () {
            const courseName = "Blockchain Basics";
            const description = "Introduction to blockchain technology";

            const tx = await ecosystem1Facet.connect(owner).createCourse(courseName, description, DifficultyLevel.BEGINNER);

            const role = await ecosystem1Facet.COURSE_OWNER_ROLE();
            const hasRole = await ecosystem1Facet.hasRole(role, owner.address);
            expect(await hasRole).to.be.true;

            // expect(ecosystem1Facet.hasRole(await ecosystem1Facet.COURSE_OWNER_ROLE(), addr1.address).to.be.true)
        });

        it("should handle all difficulty levels correctly", async function () {
            for (const level of Object.values(DifficultyLevel)) {
                const tx = await ecosystem1Facet.createCourse(
                    `Course Level ${level}`,
                    `Description ${level}`,
                    level
                );
                await tx.wait();

                const courses = await ecosystem1Facet.getAllCourses();
                const latestCourse = courses[courses.length - 1];
                expect(latestCourse.difficultyLevel).to.equal(level);
            }
        });
    });
});


