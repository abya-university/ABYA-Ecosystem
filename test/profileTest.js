import { expect } from "chai";
import pkg from "hardhat";

const { ethers } = pkg;

import { describe, it, beforeEach } from "mocha";

describe('Profile', function () {
    let owner, addr1, addr2, addr3, profile;

    beforeEach(async () => {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const Profile = await ethers.getContractFactory("contracts/Profile.sol:Nemezis");
        profile = await Profile.deploy();
        await profile.waitForDeployment();
    })

    describe("Add Profile", async function () {
        it("Should successfully add a profile", async () => {
            let _fname = "John";
            let _lname = "Doe";
            let _email = "jonedoe@gmail.com";

            const tx = await profile.connect(addr1).createProfile(_fname, _lname, _email);

            expect(tx).to.emit(profile, "ProfileCreated").withArgs(1, _email, addr1.address);
        })

        it("Should fail to add a profile with the same email", async () => {
            let _fname = "Jane";
            let _lname = "Smith";
            let _email = "janedoe@gmail.com";

            await profile.connect(addr1).createProfile(_fname, _lname, _email);

            await expect(profile.connect(addr2).createProfile("Jane", "Smith", _email))
                .to.be.revertedWith("Email already exists");
        })

        it("Should get all the profiles created by an address", async () => {
            let _fname1 = "Alice";
            let _lname1 = "Johnson";
            let _email1 = "alicejohnson@gmail.com";

            let _fname2 = "Bob";
            let _lname2 = "Brown";
            let _email2 = "bobbrown@gmail.com";

            await profile.connect(addr1).createProfile(_fname1, _lname1, _email1);
            await profile.connect(addr1).createProfile(_fname2, _lname2, _email2);

            const profiles = await profile.getProfilesByAccount(addr1.address);
            expect(profiles.length).to.equal(2);
            expect(profiles[0].fname).to.equal(_fname1);
            expect(profiles[1].fname).to.equal(_fname2);
        })

        it("Should get a profile by email", async () => {
            let _fname = "Charlie";
            let _lname = "Davis";
            let _email = "charliedavis@gmail.com";

            await profile.connect(addr3).createProfile(_fname, _lname, _email);

            const pr = await profile.connect(addr3).getProfile(1);
            expect(pr.fname).to.equal(_fname);
            expect(pr.lname).to.equal(_lname);
            expect(pr.email).to.equal(_email);
            expect(pr.account).to.equal(addr3.address);
        })

        it("Should fail to get a non-existing profile", async () => {
            await expect(profile.getProfile(999)).to.be.revertedWith("Profile does not exist");
        })

        it("Should return all profiles created", async () => {
            let _fname1 = "Eve";
            let _lname1 = "White";
            let _email1 = "evewhite@gmail.com";

            let _fname2 = "Frank";
            let _lname2 = "Green";
            let _email2 = "frankgreen@gmail.com";

            await profile.connect(addr1).createProfile(_fname1, _lname1, _email1);
            await profile.connect(addr2).createProfile(_fname2, _lname2, _email2);

            const allProfiles = await profile.getAllProfiles();
            expect(allProfiles.length).to.equal(2);

            expect(allProfiles[0].fname).to.equal(_fname1);
            expect(allProfiles[1].fname).to.equal(_fname2);
        })
    })
})