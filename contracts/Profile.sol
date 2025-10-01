// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Nemezis {
    struct Profile {
        uint256 id;
        string fname;
        string lname;
        string email;
        address account;
        bool active;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(uint256 => Profile) public profilesById;
    mapping(string => uint256) public profileIdByEmail;
    mapping(address => uint256[]) public profileIdsByAccount;

    uint256 private nextProfileId = 1;

    event ProfileCreated(
        uint256 indexed profileId,
        string indexed email,
        address account
    );
    event ProfileUpdated(uint256 indexed profileId);
    event ProfileDeactivated(uint256 indexed profileId);
    event ProfileReactivated(uint256 indexed profileId);

    // Create profile with unique numerical ID
    function createProfile(
        string memory _fname,
        string memory _lname,
        string memory _email
    ) external returns (uint256) {
        require(profileIdByEmail[_email] == 0, "Email already exists");

        uint256 profileId = nextProfileId; // DECLARE profileId first!

        Profile memory newProfile = Profile({
            id: profileId,
            fname: _fname,
            lname: _lname,
            email: _email,
            account: msg.sender,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        profilesById[profileId] = newProfile;
        profileIdByEmail[_email] = profileId;
        profileIdsByAccount[msg.sender].push(profileId);

        nextProfileId++; // Then increment

        emit ProfileCreated(profileId, _email, msg.sender);
        return profileId;
    }

    // Get profile by ID
    function getProfile(
        uint256 _profileId
    ) public view returns (Profile memory) {
        require(profilesById[_profileId].id != 0, "Profile does not exist");
        return profilesById[_profileId];
    }

    // Get profiles by account (supports multiple profiles per wallet)
    function getProfilesByAccount(
        address _account
    ) public view returns (Profile[] memory) {
        uint256[] memory ids = profileIdsByAccount[_account];
        Profile[] memory result = new Profile[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = profilesById[ids[i]];
        }
        return result;
    }

    //function to return all profiles
    function getAllProfiles() public view returns (Profile[] memory) {
        Profile[] memory result = new Profile[](nextProfileId - 1);
        for (uint256 i = 1; i < nextProfileId; i++) {
            if (profilesById[i].id != 0) {
                result[i - 1] = profilesById[i];
            }
        }
        return result;
    }

    // Deactivate instead of remove
    function deactivateProfile(uint256 _profileId) external {
        require(
            profilesById[_profileId].account == msg.sender,
            "Not profile owner"
        );
        require(profilesById[_profileId].active, "Profile already inactive");

        profilesById[_profileId].active = false;
        profilesById[_profileId].updatedAt = block.timestamp;

        emit ProfileDeactivated(_profileId);
    }

    //function to reactivate a deactivated account
    function reactivateProfile(uint256 _profileId) external {
        require(
            profilesById[_profileId].account == msg.sender,
            "Not profile owner"
        );
        require(!profilesById[_profileId].active, "Profile already active");

        // Optional: Add cooldown period (e.g., 30 days)
        uint256 deactivationTime = profilesById[_profileId].updatedAt;
        require(
            block.timestamp <= deactivationTime + 30 days,
            "Reactivate period expired"
        );

        profilesById[_profileId].active = true;
        profilesById[_profileId].updatedAt = block.timestamp;

        emit ProfileReactivated(_profileId);
    }
}
