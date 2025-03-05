// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CommunityBadgeSystem {
    // Enum for different badge levels
    enum BadgeLevel {
        NONE,
        PARTICIPANT,
        CONTRIBUTOR,
        LEADER,
        CHAMPION
    }

    struct BadgeMetadata {
        string name;
        string iconURI;
        uint256 tokenReward;
    }

    // Struct to track community member's achievements
    struct CommunityMember {
        uint256 totalEventsAttended;
        uint256 totalContributions;
        BadgeLevel currentBadge;
        mapping(bytes32 => bool) badges;
    }

    // Mapping to store community member details
    mapping(address => CommunityMember) public communityMembers;
    mapping(BadgeLevel => BadgeMetadata) public badgeMetadata;

    // Badge Threshold Constants
    uint256 public constant PARTICIPANT_BADGE_THRESHOLD = 1;
    uint256 public constant CONTRIBUTOR_BADGE_THRESHOLD = 3;
    uint256 public constant LEADER_BADGE_THRESHOLD = 5;
    uint256 public constant CHAMPION_BADGE_THRESHOLD = 10;

    // Events for badge achievements
    event BadgeAwarded(address indexed member, BadgeLevel badge);
    event EventParticipationRecorded(address indexed member, uint256 totalEvents);
    event MemberRegistered(address indexed member);

    constructor() {
        // Define badge metadata with names, icon URIs, and token rewards
        badgeMetadata[BadgeLevel.NONE] = BadgeMetadata({
            name: "Newcomer",
            iconURI: "ipfs://newcomer-badge-icon",
            tokenReward: 0
        });
        
        badgeMetadata[BadgeLevel.PARTICIPANT] = BadgeMetadata({
            name: "Participant",
            iconURI: "ipfs://participant-badge-icon",
            tokenReward: 1 * 10**18 // 1 ABYTKN token
        });
        
        badgeMetadata[BadgeLevel.CONTRIBUTOR] = BadgeMetadata({
            name: "Contributor",
            iconURI: "ipfs://contributor-badge-icon",
            tokenReward: 2 * 10**18 // 2 ABYTKN tokens
        });
        
        badgeMetadata[BadgeLevel.LEADER] = BadgeMetadata({
            name: "Leader",
            iconURI: "ipfs://leader-badge-icon",
            tokenReward: 3 * 10**18 // 3 ABYTKN tokens
        });
        
        badgeMetadata[BadgeLevel.CHAMPION] = BadgeMetadata({
            name: "Champion",
            iconURI: "ipfs://champion-badge-icon",
            tokenReward: 4 * 10**18 // 4  ABYTKN tokens
        });
    }

    // Internal function to register a new community member
    function _registerMember(address _member) internal {
        CommunityMember storage member = communityMembers[_member];
        
        // Only register if not already a member
        if (member.currentBadge == BadgeLevel(0)) {
            member.currentBadge = BadgeLevel.NONE;
            member.totalEventsAttended = 0;
            member.totalContributions = 0;
            
            emit MemberRegistered(_member);
        }
    }

    // Internal function to update badge status
    function _updateBadgeStatus(address _member) internal returns(uint256 newReward) {
        CommunityMember storage member = communityMembers[_member];
        BadgeLevel previousBadge = member.currentBadge;
        BadgeLevel newBadge;

        // Determine badge level based on participation
        if (member.totalEventsAttended >= CHAMPION_BADGE_THRESHOLD) {
            newBadge = BadgeLevel.CHAMPION;
        } else if (member.totalEventsAttended >= LEADER_BADGE_THRESHOLD) {
            newBadge = BadgeLevel.LEADER;
        } else if (member.totalEventsAttended >= CONTRIBUTOR_BADGE_THRESHOLD) {
            newBadge = BadgeLevel.CONTRIBUTOR;
        } else if (member.totalEventsAttended >= PARTICIPANT_BADGE_THRESHOLD) {
            newBadge = BadgeLevel.PARTICIPANT;
        } else {
            newBadge = BadgeLevel.NONE;
        }

        // Update badge if changed
        if (newBadge != previousBadge) {
            member.currentBadge = newBadge;

            // Calculate new reward
            newReward = badgeMetadata[newBadge].tokenReward;
         
            // Mark specific badge achievement
            bytes32 badgeHash = keccak256(abi.encodePacked(_member, newBadge));
            member.badges[badgeHash] = true;

            emit BadgeAwarded(_member, newBadge);
        }
    }

    // Function to record event participation
    function recordEventParticipation(address _participant) internal {
        // Ensure member is registered
        _registerMember(_participant);

        CommunityMember storage member = communityMembers[_participant];
        
        // Increment total events attended
        member.totalEventsAttended++;

        // Update badge status
        _updateBadgeStatus(_participant);

        emit EventParticipationRecorded(_participant, member.totalEventsAttended);
    }

    // View function to get member's current badge
    function getMemberBadge(address _member) public view returns (BadgeLevel) {
        return communityMembers[_member].currentBadge;
    }

    // Get Badge Metadata
    function getBadgeMetadata(BadgeLevel _level) public view returns (BadgeMetadata memory) {
        return badgeMetadata[_level];
    }

    // Get Member Badge Details
    function getMemberBadgeDetails(address _member) public view returns (
        BadgeLevel currentBadge,
        string memory badgeName,
        string memory iconURI,
        uint256 tokenReward,
        uint256 totalEventsAttended
    ) {
        CommunityMember storage member = communityMembers[_member];
        BadgeLevel badge = member.currentBadge;
        BadgeMetadata memory metadata = badgeMetadata[badge];
        
        return (
            badge,
            metadata.name,
            metadata.iconURI,
            metadata.tokenReward,
            member.totalEventsAttended
        );
    }

    // View function to get total events attended
    function getTotalEventsAttended(address _member) public view returns (uint256) {
        return communityMembers[_member].totalEventsAttended;
    }

    // Check if a specific badge has been achieved
    function hasBadge(address _member, BadgeLevel _badgeLevel) public view returns (bool) {
        return communityMembers[_member].currentBadge >= _badgeLevel;
    }
}