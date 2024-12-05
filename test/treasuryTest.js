/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;

describe("Treasury Contract", function () {
    let Treasury, owner, addr1, addr2, addr3, addr4;

    beforeEach("Run before each", async function () {
        Treasury = await ethers.getContractFactory("Treasury");
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

        this.treasury = await Treasury.deploy([owner.address, addr1.address, addr2.address, addr3.address, addr4.address]);
    })

    describe("Deployment", async function () {
        it("Should assign the treasurer", async function () {
            expect(await this.treasury.hasRole(this.treasury.TREASURER(), owner.address)).to.equal(true);
        })
    })

    describe("Add trustees", async function () {
        it("Should add trustees successfuly", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            expect(await this.treasury.hasRole(this.treasury.TRUSTEE(), addr1.address)).to.equal(true);
            expect(await this.treasury.hasRole(this.treasury.TRUSTEE(), addr2.address)).to.equal(true);
            expect(await this.treasury.hasRole(this.treasury.TRUSTEE(), addr3.address)).to.equal(true);
            expect(await this.treasury.hasRole(this.treasury.TRUSTEE(), addr4.address)).to.equal(true);
        })

        it("Should not add a trustee twice", async function () {
            await this.treasury.connect(owner).addTrustee(addr2.address);

            await expect(this.treasury.connect(owner).addTrustee(addr2.address)).to.be.revertedWith("Treasury: Trustee already exists");
        })
    })

    describe("Revoke Trustee function", async function () {
        it("Should revoke a trustee successfully", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            await this.treasury.connect(owner).revokeTrustee(addr1.address);

            expect(await this.treasury.hasRole(this.treasury.TRUSTEE(), addr1.address)).to.equal(false);
        })

        it("Should revert accordingly if trustee does not exist", async function () {
            await expect(this.treasury.connect(owner).revokeTrustee(addr1.address)).to.be.revertedWith("Treasury: Trustee not found");
        })
    })

    describe("Request Funding Function", async function () {
        it("Should request funding successfully", async function () {
            const request = await this.treasury.connect(addr1).requestFunding(addr1.address, ethers.parseEther("100"), "Marketing");

            expect(await request).to.emit(this.treasury, "FundingRequestCreated").withArgs(1, addr1.address, ethers.parseEther("100"))
        })
    })

    describe("Approve Funding Request Function", async function () {
        it("Should approve funding request successfully", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);

            await this.treasury.connect(addr2).requestFunding(addr1.address, ethers.parseEther("100"), "Marketing");

            const approve = await this.treasury.connect(addr1).approveFundingRequest(1);

            await expect(approve).to.emit(this.treasury, "FundingRequestApproved").withArgs(1, addr1.address);
        })

        it("Should not approve a funding request twice", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            await this.treasury.connect(addr2).requestFunding(addr1.address, ethers.parseEther("100"), "Marketing");

            await this.treasury.connect(addr1).approveFundingRequest(1);
            await expect(this.treasury.connect(addr1).approveFundingRequest(1)).to.be.revertedWith("Treasury: Already voted");
        })

        it("Should not approve a funding request that has already been executed", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            await this.treasury.connect(addr2).requestFunding(addr1.address, ethers.parseEther("100"), "Marketing");

            await this.treasury.connect(addr1).approveFundingRequest(1);
            await this.treasury.connect(addr2).approveFundingRequest(1);
            await this.treasury.connect(addr3).approveFundingRequest(1);
            await expect(this.treasury.connect(addr4).approveFundingRequest(1)).to.be.revertedWith("Treasury: Request already executed");
        })

        it("Should not approve a funding request that has already expired", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            await this.treasury.connect(addr2).requestFunding(addr1.address, ethers.parseEther("100"), "Marketing");

            await ethers.provider.send("evm_increaseTime", [2592000]);
            await ethers.provider.send("evm_mine");

            await expect(this.treasury.connect(addr1).approveFundingRequest(1)).to.be.revertedWith("Treasury: Funding request expired");
        })
    })

    describe("Get trustee count function", async function () {
        it("Should return the correct trustee count", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);
            await this.treasury.connect(owner).addTrustee(addr2.address);
            await this.treasury.connect(owner).addTrustee(addr3.address);
            await this.treasury.connect(owner).addTrustee(addr4.address);

            expect(await this.treasury.getTrusteesCount()).to.equal(4);
        })
    })

    describe("Allocate Funds function", async function () {
        it("Should allocate funcds correctly", async function () {
            const allocate = await this.treasury.connect(owner).allocateFunds(addr1.address, 100, "Marketing");

            await expect(allocate).to.emit(this.treasury, "FundsAllocated").withArgs(addr1.address, 100, "Marketing");
        })

        it("Should revert accordingly if amount is 0", async function () {
            await expect(this.treasury.connect(owner).allocateFunds(addr1.address, 0, "Marketing")).to.be.revertedWith("Treasury: Amount must be greater than 0");
        })
    })

    describe("View Pool Details", async function () {
        it("Should return all the treasury pool details", async function () {
            await this.treasury.connect(owner).addTrustee(addr1.address);

            await this.treasury.connect(owner).allocateFunds(addr1.address, 100, "Marketing");

            const [treasuryPoolSupply, marketingSpent, reserveFunds] = await this.treasury.viewPoolDetails();

            expect(treasuryPoolSupply).to.equal(100);
            expect(marketingSpent).to.equal(100);
            expect(reserveFunds).to.equal(0);
        })
    })

    // describe("Deposit Function", async function () {
    //     it("Should deposit funds successfully", async function () {
    //         const depositAmount = ethers.parseEther("10");
    //         const tx = await this.treasury.connect(addr1).deposit(depositAmount, { value: depositAmount });

    //         await tx.wait();

    //         const contractBalance = await ethers.provider.getBalance(this.treasury.address);
    //         expect(contractBalance).to.equal(depositAmount);
    //     });
    // })

    //withdraw function
})