/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;


describe("Ecosystem", function () {
    let Ecosystem, owner, addr1, addr2, addr3;

    beforeEach("Run Before All", async function () {
        Ecosystem = await ethers.getContractFactory("Ecosystem", owner);
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        this.ecosystem = await Ecosystem.deploy([owner.address, addr1.address, addr2.address, addr3.address]);
    })

    describe("Deployment", async function () {
        it("Should set the right owner", async function () {
            expect(await this.ecosystem.owner()).to.be.equal(owner.address);
        })

        it("Should set the right token name", async function () {
            expect(await this.ecosystem.name()).to.equal("ABYA TOKEN");
        })

        it("Should set the right token symbol", async function () {
            const symbol = await this.ecosystem.symbol();
            expect(symbol).to.equal("ABYTKN");
        });

        it("Should set the admins correctly", async function () {
            const isAdmin1 = await this.ecosystem.isAdminMap(addr1.address);
            const isAdmin2 = await this.ecosystem.isAdminMap(addr2.address);
            expect(isAdmin1).to.be.true;
            expect(isAdmin2).to.be.true;
        });
    })

    describe("Mint Function", async function () {
        it("Should mint tokens correctly", async function () {
            await this.ecosystem.mintToken(addr1.address, 1000);
            const balance = await this.ecosystem.balanceOf(addr1.address);
            expect(balance).to.equal(1000);
        })

        it("Should get the total supply correct", async function () {
            await this.ecosystem.mintToken(addr2.address, 1200);
            await expect(await this.ecosystem.totalSupply()).to.equal(1200);
        })

        it("Should log the right event", async function () {
            const mint = await this.ecosystem.mintToken(addr2.address, 1200);

            await (expect(mint).to.emit(this.ecosystem, "MintSuccess").withArgs(addr2.address, 1200))
            await (expect(mint).to.emit(this.ecosystem, "EcosystemPoolUpdate").withArgs(addr2.address, 1200))
        })
    })

    describe("Burn Function", async function () {
        it("It should burn tokens correctly", async function () {
            await this.ecosystem.mintToken(addr1.address, 1000);
            await this.ecosystem.burn(addr1.address, 500);
            const balance = await this.ecosystem.balanceOf(addr1.address);
            expect(balance).to.equal(500);
        })

        it("It should log the right burn event", async function () {
            await this.ecosystem.mintToken(addr1.address, 1000);
            const burn = await this.ecosystem.burn(addr1.address, 500);

            await (expect(burn).to.emit(this.ecosystem, "BurnSuccess").withArgs(addr1.address, 500));
        })
    })

    describe("Ecosystem Total Supply", async function () {
        it("Should return the correct ecosystem total supply", async function () {
            await this.ecosystem.mintToken(addr1.address, 1000);
            await this.ecosystem.burn(addr1.address, 500);

            await expect(await this.ecosystem.getCurrentEcosystemPoolSupply()).to.equal(500);
        })
    })

})