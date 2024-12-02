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
        this.lmstoken = await LMSToken.deploy([owner.address, addr1.address, addr2.address]);
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

        it("Should set the admins correctly", async function () {
            const isAdmin1 = await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr1.address);
            const isAdmin2 = await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr2.address);
            expect(isAdmin1).to.be.true;
            expect(isAdmin2).to.be.true;
        });
    });

    describe("Add admin", async function () {
        it("Should add an admin successfully", async function () {
            expect(await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr1.address)).to.be.true;
            await this.lmstoken.connect(addr1).addAdmin(addr3.address);

            const isAdmin3 = await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr3.address);
            await expect(isAdmin3).to.be.true;
        })

        it("Should remove an admin successfully", async function () {
            await this.lmstoken.connect(owner).removeAdmin(addr1.address);

            const isAdmin1 = await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr3.address);
            await expect(isAdmin1).to.be.false;
        })
    })

    describe("Remove admin", async function () {
        it("Should remove an admin successfully", async function () {
            expect(await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr1.address)).to.be.true;
            await this.lmstoken.connect(addr1).addAdmin(addr3.address);

            await this.lmstoken.connect(owner).removeAdmin(addr3.address);

            const isAdmin3 = await this.lmstoken.hasRole(this.lmstoken.ADMIN_ROLE(), addr3.address);
            await expect(isAdmin3).to.be.false;
        })

    })

    // describe("Mint Function", async function () {
    //     it("Should mint tokens successfully", async function () {
    //         await this.lmstoken.connect(addr3).mintToken(addr1.address, 100);
    //         const balance = await this.lmstoken.balanceOf(addr1.address);

    //         await expect(await balance).to.be.equal(100);
    //     })
    // })

    // describe("Burn Function", async function () {
    //     it("Should burn tokens successfully", async function () {
    //         await this.lmstoken.connect(addr3).mintToken(addr1.address, 1000);
    //         await this.lmstoken.burn(addr1.address, 101);

    //         const balance = await this.lmstoken.balanceOf(addr1.address);

    //         await expect(await balance).to.be.equal(899);
    //     })
    // })

});