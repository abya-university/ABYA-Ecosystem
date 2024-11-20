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
        this.ecosystem = await Ecosystem.deploy([owner.address, addr1.address, addr2.address]);
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

    describe("Create course function", async function () {
        it("Should create a course correctly", async function () {
            // const nextCourseId = 2;
            const createCourse = await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.")

            await expect(createCourse).to.emit(this.ecosystem, "CourseCreationSuccess").withArgs(1, "Introduction to Blockchain", false);
        })
    })

    describe("Submit Course Review Function", async function () {
        it("Should revert accordingly if caller is not admin", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await expect(this.ecosystem.connect(addr3).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8)).to.be.revertedWith("Caller is not an admin");

        })

        it("Should revert accordingly if value is greater than 10", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await expect(this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 16, 8)).to.be.revertedWith("Scores must be between 1 and 10.");

        })

    })

    describe("Approve Course Function", async function () {
        // it("Should approve a course correctly", async function () { })
        it("Should revert accordingly if caller is not admin", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await expect(this.ecosystem.connect(addr3).approveCourse(1)).to.be.revertedWith("Caller is not an admin");
        })

        it("Should award tokens accordingly to course owner after successful approval", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await expect(await this.ecosystem.balanceOf(addr1.address)).to.equal(ethers.parseEther("5"));
        })

        it("Should revert accordingly if course is already approved", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await expect(this.ecosystem.connect(addr2).approveCourse(1)).to.be.revertedWith("Course already approved");
        })

    })

    describe("Enroll Function", async function () {
        it("Should revert accordingly if course is not yet approved", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await expect(this.ecosystem.connect(addr3).enroll(1)).to.be.revertedWith("Course not yet approved!");
        })

        it("Should enroll successfully if all conditions are met", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await expect(await this.ecosystem.connect(addr3).enroll(1)).emit(this.ecosystem, "EnrollmentSuccess").withArgs(1, addr3.address);
        })

        it("Should award enrollment tokens after successful enrollment", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await this.ecosystem.connect(addr3).enroll(1);
            await expect(await this.ecosystem.balanceOf(addr3.address)).to.equal(2);
        })
    })

    describe("Unenroll Function", async function () {
        it("Should revert accordingly if you are not apparently enrolled", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await expect(this.ecosystem.connect(addr3).unEnroll(1)).to.be.rejectedWith("You are not enrolled in this course!");
        })

        it("Should successful Unenroll from course if all conditions are met", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await this.ecosystem.connect(addr3).enroll(1);

            await expect(await this.ecosystem.connect(addr3).unEnroll(1)).to.emit(this.ecosystem, "unEnrollmentSuccess").withArgs(1, addr3.address);
        })

        it("Should burn the assigned tokens if user successfully unenrolls from a course", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await this.ecosystem.connect(addr3).enroll(1);

            await this.ecosystem.connect(addr3).unEnroll(1)

            await expect(await this.ecosystem.balanceOf(addr3.address)).to.equal(0);
        })
    })

})