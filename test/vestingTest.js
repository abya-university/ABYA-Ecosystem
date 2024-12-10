/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;

describe("Vesting Contract", function () {
    let VestingContract, LMSToken, owner, admin, investor1, investor2, teamMember, advisor;

    beforeEach("Deploy contracts", async function () {
        // Get signers
        [owner, admin, investor1, investor2, teamMember, advisor] = await ethers.getSigners();

        // Deploy LMS Token
        const LMSTokenFactory = await ethers.getContractFactory("LMSToken");
        this.lmstoken = await LMSTokenFactory.connect(owner).deploy(admin.address);

        // Deploy Vesting Contract
        const VestingFactory = await ethers.getContractFactory("Vesting");
        this.vesting = await VestingFactory.connect(owner).deploy(this.lmstoken.address, admin.address);

        // Mint tokens to vesting contract
        await this.lmstoken.connect(admin).mint(this.vesting.address, ethers.parseEther("1000000"));
    });

    describe("Deployment", function () {
        it("Should set the correct admin", async function () {
            const hasAdminRole = await this.vesting.hasRole(await this.vesting.DEFAULT_ADMIN_ROLE(), admin.address);
            expect(hasAdminRole).to.be.true;
        });

        it("Should have the correct token address", async function () {
            expect(await this.vesting.token()).to.equal(this.lmstoken.address);
        });
    });

    describe("Adding Investors", function () {
        it("Should add investor successfully", async function () {
            await this.vesting.connect(admin).addToInvestors(investor1.address);
            
            const isInvestor = await this.vesting.isInInvestor(investor1.address);
            const hasInvestorRole = await this.vesting.hasRole(await this.vesting.INVESTOR_ROLE(), investor1.address);
            
            expect(isInvestor).to.be.true;
            expect(hasInvestorRole).to.be.true;
        });

        it("Should prevent adding duplicate investors", async function () {
            await this.vesting.connect(admin).addToInvestors(investor1.address);
            
            await expect(
                this.vesting.connect(admin).addToInvestors(investor1.address)
            ).to.be.revertedWith("Already added to Investors");
        });

        it("Should prevent non-admin from adding investors", async function () {
            await expect(
                this.vesting.connect(investor2).addToInvestors(investor1.address)
            ).to.be.reverted;
        });
    });

    describe("Removing Investors", function () {
        it("Should remove investor successfully", async function () {
            await this.vesting.connect(admin).addToInvestors(investor1.address);
            await this.vesting.connect(admin).removeFromInvestors(investor1.address);
            
            const isInvestor = await this.vesting.isInInvestor(investor1.address);
            const hasInvestorRole = await this.vesting.hasRole(await this.vesting.INVESTOR_ROLE(), investor1.address);
            
            expect(isInvestor).to.be.false;
            expect(hasInvestorRole).to.be.false;
        });

        it("Should prevent removing non-existing investor", async function () {
            await expect(
                this.vesting.connect(admin).removeFromInvestors(investor1.address)
            ).to.be.revertedWith("Address not in Investors");
        });
    });

    describe("Team Members", function () {
        it("Should add team member successfully", async function () {
            await this.vesting.connect(admin).addTeamMember(teamMember.address);
            
            const isTeamMember = await this.vesting.isInTeam(teamMember.address);
            const hasTeamRole = await this.vesting.hasRole(await this.vesting.TEAM_ROLE(), teamMember.address);
            
            expect(isTeamMember).to.be.true;
            expect(hasTeamRole).to.be.true;
        });
    });

    describe("Advisors", function () {
        it("Should add advisor successfully", async function () {
            await this.vesting.connect(admin).addToAdvisors(advisor.address);
            
            const isAdvisor = await this.vesting.isInAdvisors(advisor.address);
            const hasAdvisorRole = await this.vesting.hasRole(await this.vesting.ADVISOR_ROLE(), advisor.address);
            
            expect(isAdvisor).to.be.true;
            expect(hasAdvisorRole).to.be.true;
        });
    });

    describe("Vesting Schedule", function () {
        beforeEach(async function () {
            await this.vesting.connect(admin).addToInvestors(investor1.address);
        });

        it("Should set vesting schedule successfully", async function () {
            const currentTime = Math.floor(Date.now() / 1000);
            const startTime = BigInt(currentTime);
            const cliffTime = 30n * 24n * 60n * 60n; // 30 days
            const duration = 365n * 24n * 60n * 60n; // 1 year
            const interval = 30n * 24n * 60n * 60n; // 30 days

            await this.vesting.connect(admin).setVestingSchedule(
                investor1.address, 
                startTime, 
                cliffTime, 
                duration, 
                interval
            );

            const vestingSchedule = await this.vesting.vestingSchedules(investor1.address);
            
            expect(vestingSchedule.startTime).to.equal(startTime);
            expect(vestingSchedule.cliffTime).to.equal(cliffTime);
            expect(vestingSchedule.duration).to.equal(duration);
            expect(vestingSchedule.interval).to.equal(interval);
        });

        it("Should prevent setting duplicate vesting schedule", async function () {
            const currentTime = Math.floor(Date.now() / 1000);
            const startTime = BigInt(currentTime);
            const cliffTime = 30n * 24n * 60n * 60n;
            const duration = 365n * 24n * 60n * 60n;
            const interval = 30n * 24n * 60n * 60n;

            await this.vesting.connect(admin).setVestingSchedule(
                investor1.address, 
                startTime, 
                cliffTime, 
                duration, 
                interval
            );

            await expect(
                this.vesting.connect(admin).setVestingSchedule(
                    investor1.address, 
                    startTime, 
                    cliffTime, 
                    duration, 
                    interval
                )
            ).to.be.revertedWith("Vesting schedule already set");
        });
    });
});