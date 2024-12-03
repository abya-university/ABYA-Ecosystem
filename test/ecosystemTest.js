/* eslint-env mocha */

import { expect } from "chai";
import pkg from 'hardhat';
import { describe, it, beforeEach } from 'mocha';
const { ethers } = pkg;


describe("Ecosystem", function () {
    let Ecosystem, LMSToken, owner, addr1, addr2, addr3, addr4;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

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
            // Prepare the ecosystem
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr1.address);
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr2.address);
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr3.address);

            // Create a course
            await this.ecosystem.connect(addr1).createCourse(
                "Introduction to Blockchain",
                "It's a course that explains and gives more insight on smart contracts and generally web3."
            );

            // Select reviewers
            await this.ecosystem.connect(addr1).selectCourseReviewers(0);

            // Get selected reviewers
            const rt2 = await this.ecosystem.getCourseReviewers(0);
            console.log("Selected Reviewers: ", rt2);

            // Find a selected reviewer
            const selectedReviewer = rt2[0];
            const selectedReviewerSigner = await ethers.getSigner(selectedReviewer);

            // Attempt to submit a review with an invalid score
            await expect(
                this.ecosystem.connect(selectedReviewerSigner).submitReview(0, 9, 8, 6, 5, 7, 8, 9, 4, 16, 8)
            ).to.be.revertedWith("Scores must be between 1 and 10.");
        });
    });

    describe("Approve Course Function", async function () {
        it("Should revert accordingly if course is already approved", async function () {
            // Grant reviewer roles
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr1.address);
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr2.address);
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr3.address);
            await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr4.address);


            // Create a course
            await this.ecosystem.connect(addr1).createCourse(
                "Introduction to Blockchain",
                "Its a course that explains and gives more insight on smart contracts and generally web3."
            );

            // Select reviewers for the course (courseId = 0)
            await this.ecosystem.connect(addr1).selectCourseReviewers(0);

            // Get selected reviewers
            const rt2 = await this.ecosystem.getCourseReviewers(0);
            console.log("Selected Reviewers: ", rt2);

            // Find a selected reviewer
            const selectedReviewer = rt2[0];
            const selectedReviewerSigner = await ethers.getSigner(selectedReviewer);

            // Submit review (using courseId 0, not 1)
            await this.ecosystem.connect(selectedReviewerSigner).submitReview(
                0,  // Correct course ID
                9, 8, 6, 5, 7, 8, 9, 4, 6, 8
            );

            // Approve course
            await this.ecosystem.connect(selectedReviewerSigner).approveCourse(0);

            // Try to approve again (should revert)
            await expect(
                this.ecosystem.connect(selectedReviewerSigner).approveCourse(0)
            ).to.be.revertedWith("You have already approved this course");
        });
    });

    // describe("Approve Course Status", async function () {
    //     it("Should set course approved status to true", async function () {
    //         // Grant reviewer roles
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr1.address);
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr2.address);
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr3.address);
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr4.address);

    //         // Create a course
    //         await this.ecosystem.connect(addr1).createCourse(
    //             "Introduction to Blockchain",
    //             "Its a course that explains and gives more insight on smart contracts and generally web3."
    //         );

    //         // Select reviewers for the course (courseId = 0)
    //         await this.ecosystem.connect(addr1).selectCourseReviewers(0);

    //         // Get selected reviewers
    //         const selectedReviewers = await this.ecosystem.getCourseReviewers(0);
    //         console.log("Selected Reviewers: ", selectedReviewers);

    //         // Submit reviews from selected reviewers
    //         const reviews = [
    //             { reviewer: selectedReviewers[0], scores: [9, 8, 6, 5, 7, 8, 9, 4, 6, 8] },
    //             { reviewer: selectedReviewers[1], scores: [9, 7, 6, 5, 9, 8, 9, 4, 6, 8] },
    //             { reviewer: selectedReviewers[2], scores: [9, 8, 6, 5, 7, 8, 9, 8, 6, 8] }
    //         ];

    //         // Submit reviews
    //         for (const review of reviews) {
    //             const reviewerSigner = await ethers.getSigner(review.reviewer);
    //             await this.ecosystem.connect(reviewerSigner).submitReview(
    //                 0,  // Correct course ID
    //                 ...review.scores
    //             );
    //         }

    //         await this.ecosystem.connect(selectedReviewers[0]).approveCourse(0);

    //         // Retrieve the specific course
    //         const course = await this.ecosystem.getCourse(0);

    //         // Assert that the course is approved
    //         expect(course.approved).to.be.true;
    //     });

    //     it("Should not approve course with insufficient reviews", async function () {
    //         // Grant reviewer roles
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr1.address);
    //         await this.ecosystem.connect(owner).grantRole(await this.ecosystem.REVIEWER_ROLE(), addr2.address);

    //         // Add reviewers to pool
    //         await this.ecosystem.connect(addr1).addToReviewerPool();
    //         await this.ecosystem.connect(addr2).addToReviewerPool();

    //         // Create a course
    //         await this.ecosystem.connect(addr1).createCourse(
    //             "Introduction to Blockchain",
    //             "Its a course that explains and gives more insight on smart contracts and generally web3."
    //         );

    //         // Select reviewers for the course (courseId = 0)
    //         await this.ecosystem.connect(addr1).selectCourseReviewers(0);

    //         // Get selected reviewers
    //         const selectedReviewers = await this.ecosystem.getCourseReviewers(0);

    //         // Submit review from one reviewer
    //         const reviewerSigner = await ethers.getSigner(selectedReviewers[0]);
    //         await this.ecosystem.connect(reviewerSigner).submitReview(
    //             0,  // Correct course ID
    //             9, 8, 6, 5, 7, 8, 9, 4, 6, 8
    //         );

    //         // Approve course by one reviewer
    //         await this.ecosystem.connect(reviewerSigner).approveCourse(0);

    //         // Retrieve the specific course
    //         const course = await this.ecosystem.getCourse(0);

    //         // Assert that the course is not approved
    //         expect(course.approved).to.be.false;
    //     });
    // });

})