/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;


describe("Ecosystem", function () {
    let Ecosystem, LMSToken, owner, addr1, addr2, addr3, addr4;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // Deploy LMSToken contract
        LMSToken = await ethers.getContractFactory("LMSToken");
        this.lmstoken = await LMSToken.deploy([owner.address, addr1.address, addr2.address, addr3.address]);

        // Deploy Ecosystem contract
        Ecosystem = await ethers.getContractFactory("Ecosystem");
        this.ecosystem = await Ecosystem.deploy([owner.address, addr1.address, addr2.address, addr3.address]);

        console.log("Contracts deployed successfully");
    });

    describe("Deployment", async function () {
        it("Should set the right owner", async function () {
            expect(await this.lmstoken.hasRole(this.ecosystem.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set the right token name", async function () {
            expect(await this.ecosystem.name()).to.equal("ABYA TOKEN");
        })

        it("Should set the right token symbol", async function () {
            const symbol = await this.ecosystem.symbol();
            expect(symbol).to.equal("ABYTKN");
        });
    })

    describe("Create course function", async function () {
        it("Should create a course correctly", async function () {
            // Check the initial value of nextCourseId
            const initialNextCourseId = (await this.ecosystem.nextCourseIdd());
            console.log("nextCourseId: ", initialNextCourseId.toString());
            console.log("nextCourseId type: ", typeof initialNextCourseId);
            expect(initialNextCourseId).to.equal("1");

            const createCourseTx = await this.ecosystem.connect(addr1).createCourse(
                "Introduction to Blockchain",
                "It's a course that explains and gives more insight on smart contracts and generally web3."
            );

            await expect(createCourseTx)
                .to.emit(this.ecosystem, "CourseCreationSuccess")
                .withArgs(0, "Introduction to Blockchain", false);

            const course = await this.ecosystem.courseObject(0);
            expect(course.courseName).to.equal("Introduction to Blockchain");
            expect(course.description).to.equal("It's a course that explains and gives more insight on smart contracts and generally web3.");
            expect(course.approved).to.be.false;
            expect(course.creator).to.equal(addr1.address);
        });
    })

    describe("Submit Course Review Function", async function () {
        it("Should revert accordingly if value is greater than 10", async function () {
            await this.ecosystem.connect(addr1).createCourse(
                "Introduction to Blockchain",
                "It's a course that explains and gives more insight on smart contracts and generally web3."
            );

            const rt = await this.ecosystem.getCourseReviewers(0);
            console.log("rt: ", rt);

            console.log([owner.address, addr1.address, addr2.address, addr3.address]);

            await this.ecosystem.connect(addr1).addReviewerToPool(addr2.address);
            await this.ecosystem.connect(addr2).addReviewerToPool(addr3.address);
            await this.ecosystem.connect(addr3).addReviewerToPool(owner.address);
            // await this.ecosystem.connect(addr3).addReviewerToPool(addr1.address);

            await this.ecosystem.connect(addr1).selectCourseReviewers(0)
            await this.ecosystem.connect(addr2).selectCourseReviewers(0)
            await this.ecosystem.connect(addr3).selectCourseReviewers(0)

            const rt2 = await this.ecosystem.getCourseReviewers(0);
            console.log("rt2: ", rt2);

            await expect(this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 16, 8)).to.be.revertedWith("Scores must be between 1 and 10.");

        })

    })

    describe("Approve Course Function", async function () {
        it("Should revert accordingly if course is already approved", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await this.ecosystem.connect(addr2).submitReview(1, 9, 8, 6, 5, 7, 8, 9, 4, 6, 8);

            await this.ecosystem.connect(addr2).approveCourse(1);

            await expect(this.ecosystem.connect(addr2).approveCourse(1)).to.be.revertedWith("You have already approved this course");
        })

    })

    describe("Enroll Function", async function () {
        it("Should revert accordingly if course is not yet approved", async function () {
            // const nextCourseId = 2;
            await this.ecosystem.connect(addr1).createCourse("Introduction to Blockchain", "Its a course that explains and gives more insight on smart contracts and generally web3.");

            await expect(this.ecosystem.connect(addr3).enroll(1)).to.be.revertedWith("Course not yet approved!");
        })

    })

})