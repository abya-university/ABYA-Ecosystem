import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;

describe("Diamond Contract Integration Tests", function () {
    let diamond;
    let ecosystem1Facet;
    let owner;
    let addr1;

    const DifficultyLevel = {
        BEGINNER: 0,
        INTERMEDIATE: 1,
        ADVANCED: 2
    };

    // Helper function to get function selectors with debugging
    function getSelectors(contract) {
        console.log("Getting selectors for contract:", contract);
        if (!contract || !contract.interface) {
            console.error("Contract or interface is undefined:", contract);
            throw new Error("Invalid contract object");
        }

        const signatures = Object.keys(contract.interface.functions);
        console.log("Function signatures:", signatures);

        const selectors = signatures.reduce((acc, val) => {
            if (val !== 'init(bytes)') {
                const selector = contract.interface.getSighash(val);
                console.log(`Selector for ${val}:`, selector);
                acc.push(selector);
            }
            return acc;
        }, []);

        return selectors;
    }

    before(async function () {
        try {
            [owner, addr1] = await ethers.getSigners();
            console.log("Deploying contracts with owner:", owner.address);

            // Deploy DiamondCutFacet
            console.log("Deploying DiamondCutFacet...");
            const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
            const diamondCutFacet = await DiamondCutFacet.deploy();
            await diamondCutFacet.waitForDeployment();
            console.log("DiamondCutFacet deployed to:", await diamondCutFacet.getAddress());

            // Deploy Diamond
            console.log("Deploying Diamond...");
            const Diamond = await ethers.getContractFactory("EcosystemDiamond");
            const reviewers = [
                "0x62618De1cA80188FbbeEEaaC99b58Ec9B2e9e72C",
                "0xcE59326853B8EfE539882137d16F826fE46BDD5c",
                "0x3fCf08DDE67A9ED9314F79B97197175313A8E327",
                "0x74c5d6cd0325205b86e2a30B07f1be350367B40D"
            ];

            diamond = await Diamond.deploy(reviewers, owner.address);
            await diamond.waitForDeployment();
            console.log("Diamond deployed to:", await diamond.getAddress());

            // Deploy DiamondLoupeFacet
            console.log("Deploying DiamondLoupeFacet...");
            const DiamondLoupeFacet = await ethers.getContractFactory('DiamondLoupeFacet');
            const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
            await diamondLoupeFacet.waitForDeployment();
            console.log("DiamondLoupeFacet deployed to:", await diamondLoupeFacet.getAddress());

            // Deploy Ecosystem1Facet
            console.log("Deploying Ecosystem1Facet...");
            const Ecosystem1Facet = await ethers.getContractFactory('Ecosystem1Facet');
            const ecosystem1FacetContract = await Ecosystem1Facet.deploy();
            await ecosystem1FacetContract.waitForDeployment();
            console.log("Ecosystem1Facet deployed to:", await ecosystem1FacetContract.getAddress());

            // Verify contract deployments
            if (!ecosystem1FacetContract || !ecosystem1FacetContract.interface) {
                throw new Error("Ecosystem1Facet deployment failed");
            }

            // Get function selectors
            console.log("Getting selectors...");
            const selectors1 = getSelectors(ecosystem1FacetContract);
            console.log("Selectors:", selectors1);

            // Perform diamond cut
            console.log("Performing diamond cut...");
            const diamondCut = await ethers.getContractAt('IDiamondCut', await diamond.getAddress());
            const cut = [
                {
                    facetAddress: await ecosystem1FacetContract.getAddress(),
                    action: 0, // Add
                    functionSelectors: selectors1
                }
            ];

            const tx = await diamondCut.diamondCut(cut, ethers.ZeroAddress, "0x");
            await tx.wait();
            console.log("Diamond cut completed");

            // Get Ecosystem1Facet interface
            ecosystem1Facet = await ethers.getContractAt(
                "Ecosystem1Facet",
                await diamond.getAddress()
            );

            console.log("Setup completed successfully");
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    describe("Course Creation Tests", function () {
        it("Should successfully create a course with BEGINNER difficulty", async function () {
            const courseName = "Introduction to Blockchain";
            const courseDescription = "A beginner's guide to blockchain technology";

            const tx = await ecosystem1Facet.createCourse(
                courseName,
                courseDescription,
                DifficultyLevel.BEGINNER
            );

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log("Transaction receipt:", receipt);


            // Check for CourseCreationSuccess event
            const event = receipt.events.find(event => event.event === 'CourseCreationSuccess');
            expect(event).to.not.be.undefined;
            expect(event.args[1]).to.equal(courseName);
            expect(event.args[2]).to.be.false; // isApproved should be false initially

            // Verify course exists
            const courses = await ecosystem1Facet.getAllCourses();
            expect(courses.length).to.equal(1);

            // Verify course details
            const latestCourse = courses[0];
            expect(latestCourse.courseName).to.equal(courseName);
            expect(latestCourse.description).to.equal(courseDescription);
            expect(latestCourse.difficultyLevel).to.equal(DifficultyLevel.BEGINNER);
            expect(latestCourse.owner).to.equal(owner.address);
            expect(latestCourse.isApproved).to.be.false;
        });

        it("Should grant COURSE_OWNER_ROLE to course creator", async function () {
            const hasRole = await ecosystem1Facet.hasRole(
                await ecosystem1Facet.COURSE_OWNER_ROLE(),
                owner.address
            );
            expect(hasRole).to.be.true;
        });

        it("Should allow multiple courses with different difficulties", async function () {
            // Create an intermediate course
            await ecosystem1Facet.createCourse(
                "Advanced Solidity",
                "Deep dive into Solidity programming",
                DifficultyLevel.INTERMEDIATE
            );

            // Create an advanced course
            await ecosystem1Facet.createCourse(
                "DeFi Protocols",
                "Understanding DeFi protocol development",
                DifficultyLevel.ADVANCED
            );

            const courses = await ecosystem1Facet.getAllCourses();
            expect(courses.length).to.equal(3);

            // Verify different difficulty levels
            expect(courses[1].difficultyLevel).to.equal(DifficultyLevel.INTERMEDIATE);
            expect(courses[2].difficultyLevel).to.equal(DifficultyLevel.ADVANCED);
        });

        it("Should track course count correctly", async function () {
            const courses = await ecosystem1Facet.getAllCourses();
            expect(courses.length).to.equal(3);
        });

        it("Should fail when non-owner tries to create course", async function () {
            // Try to create course with different address
            await expect(
                ecosystem1Facet.connect(addr1).createCourse(
                    "Unauthorized Course",
                    "This should fail",
                    DifficultyLevel.BEGINNER
                )
            ).to.be.revertedWith("AccessControlUnauthorizedAccount");
        });
    });
});