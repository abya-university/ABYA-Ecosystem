/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;

describe("LMSToken", function () {
    let LMSToken, owner, addr1, addr2, addr3;

    beforeEach("Run Before All", async function () {
        LMSToken = await ethers.getContractFactory("LMSToken");
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        this.lmstoken = await LMSToken.deploy([owner.address, addr1.address, addr2.address, addr3.address]);
    });

    describe("Deployment", async function () {
        it("Should set the right owner", async function () {
            expect(await this.lmstoken.hasRole(this.lmstoken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set the right token name", async function () {
            expect(await this.lmstoken.name()).to.equal("ABYA TOKEN");
        });

        it("Should set the right token symbol", async function () {
            const symbol = await this.lmstoken.symbol();
            expect(symbol).to.equal("ABYTKN");
        });

        it("Should set the reviewers correctly", async function () {
            const isReviewer1 = await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr1.address);
            const isReviewer2 = await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr2.address);
            expect(isReviewer1).to.be.true;
            expect(isReviewer2).to.be.true;
        });
    });

    describe("Add reviewer", async function () {
        it("Should add an reviewer successfully", async function () {
            expect(await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr1.address)).to.be.true;
            await this.lmstoken.connect(addr1).addReviewer(addr3.address);

            const isAdmin3 = await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr3.address);
            await expect(isAdmin3).to.be.true;
        })
    })

    describe("Remove reviewer", async function () {
        it("Should remove an reviewer successfully", async function () {
            expect(await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr1.address)).to.be.true;
            await this.lmstoken.connect(addr1).addReviewer(addr3.address);

            await this.lmstoken.connect(owner).removeReviewer(addr3.address);

            const isReviewer3 = await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr3.address);
            await expect(isReviewer3).to.be.false;
        })

    })

    describe("Check if is Reviewer", async function () {
        it("Should check if an address is a reviewer", async function () {
            await expect(await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr1.address)).to.be.true;
        })

        it("Should check if an address is a reviewer", async function () {
            await this.lmstoken.connect(owner).addReviewer(addr1.address);
            await this.lmstoken.connect(owner).removeReviewer(addr1.address);
            const isReviewer = await this.lmstoken.hasRole(this.lmstoken.REVIEWER_ROLE(), addr1.address);
            await expect(isReviewer).to.be.false;
        })
    })

});