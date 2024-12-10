// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LMSToken } from "../LMS Token.sol";
import { CommunityBadgeSystem } from "./CommunityBadgeSystem.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CommunityEnhanced is LMSToken, ReentrancyGuard, CommunityBadgeSystem {
    // Constants
    uint256 public constant COMMUNITY_POOL = (MAX_SUPPLY * 10) / 100;
    uint256 public constant MAX_COMMUNITY_PROJECT_FUNDING = (COMMUNITY_POOL * 5) / 100;
    uint256 public constant EVENT_PARTICIPATION_REWARD = 3 * 10**18; // 10 tokens

    // Roles
    bytes32 public constant COMMUNITY_MANAGER = keccak256("COMMUNITY_MANAGER");

    // State Variables
    uint256 public communityPoolSupply;
    uint256 public communityProjectFunds;
    
    // Structs
    struct CommunityEvent {
        uint256 id;
        string name;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        uint256 currentParticipants;
        bool isActive;
    }

    // Mappings
    mapping(uint256 => CommunityEvent) public communityEvents;
    mapping(address => uint256) public communityContributorRewards;

    // Events
    event CommunityPoolUpdate(address indexed _to, uint256 indexed _amount);
    event AirdropDistributeSuccess(uint256 indexed _amount, uint256 _numberOfEarlyAdopters);
    event CommunityProjectFunded(address indexed project, uint256 amount);
    event EventCreated(uint256 indexed eventId, string name, address creator);
    event EventParticipation(uint256 indexed eventId, address participant);

    // Counters (simulating OpenZeppelin's Counters library)
    uint256 private _eventIdCounter;
    uint256 private _proposalIdCounter;

    constructor(address[] memory _reviewers) LMSToken(_reviewers) ReentrancyGuard() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMMUNITY_MANAGER, msg.sender);
        _grantRole(MULTISIG_APPROVER, msg.sender);
    }

    // Enhanced Mint Function
    function mintToken(address to, uint256 amount) internal override returns(bool) {
        require(amount + getCurrentCommunityPoolSupply() <= COMMUNITY_POOL, "Community: Minting limit exceeded");
        require(to != address(0), "Community: Cannot mint to zero address");
        
        super.mintToken(to, amount);
        communityPoolSupply += amount;

        emit CommunityPoolUpdate(to, amount);
        return true;
    }

    // Burn Function
    function burn(address account, uint256 amount) internal override {
        require(account != address(0), "Community: Cannot burn from zero address");
        
        super.burn(account, amount);
        communityPoolSupply = communityPoolSupply > amount ? communityPoolSupply - amount : 0;
    }

    // Get Current Community Pool Supply
    function getCurrentCommunityPoolSupply() internal view returns(uint256) {
        return communityPoolSupply;
    }

    // Distribute Airdrops with Multi-Sig Approval
    function distributeAirdrops(
        uint256 _amount, 
        address[] memory earlyAdopters
    ) external onlyRole(COMMUNITY_MANAGER) returns(bool) {
        require((earlyAdopters.length * _amount) + getCurrentCommunityPoolSupply() <= (COMMUNITY_POOL / 2), 
            "Community: Insufficient tokens");

        // Create a multi-sig proposal for airdrop
        bytes memory data = abi.encodeWithSignature(
            "performAirdrop(uint256,address[])", 
            _amount, 
            earlyAdopters
        );
        uint256 proposalId = createMultiSigProposal(address(this), data);

        return true;
    }

    // Internal function to perform actual airdrop
    function performAirdrop(
        uint256 _amount, 
        address[] memory earlyAdopters
    ) external {
        for(uint256 i = 0; i < earlyAdopters.length; i++){
            mintToken(earlyAdopters[i], _amount);
        }

        emit AirdropDistributeSuccess(_amount, earlyAdopters.length);
    }

    // Create Community Event
    function createEvent(
        string memory _name, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _maxParticipants
    ) external returns (uint256) {
        uint256 eventId = _eventIdCounter++;
        
        CommunityEvent storage newEvent = communityEvents[eventId];
        newEvent.id = eventId;
        newEvent.name = _name;
        newEvent.creator = msg.sender;
        newEvent.startTime = _startTime;
        newEvent.endTime = _endTime;
        newEvent.maxParticipants = _maxParticipants;
        newEvent.isActive = true;

        emit EventCreated(eventId, _name, msg.sender);
        return eventId;
    }

    // Participate in Community Event
    function participateInEvent(uint256 _eventId) external nonReentrant {
        CommunityEvent storage communityEvent = communityEvents[_eventId];
        
        require(communityEvent.isActive, "Event is not active");
        require(block.timestamp >= communityEvent.startTime && block.timestamp <= communityEvent.endTime, 
            "Event not in progress");
        require(communityEvent.currentParticipants < communityEvent.maxParticipants, 
            "Event is full");

        communityEvent.currentParticipants++;

        // Record event participation for badges
        recordEventParticipation(msg.sender);
        
        // Reward participation
        mintToken(msg.sender, EVENT_PARTICIPATION_REWARD);

        emit EventParticipation(_eventId, msg.sender);
    }

    // Additional function to check member's badge
    function checkMemberBadge() external view returns (BadgeLevel) {
        return getMemberBadge(msg.sender);
    }

    // Fund Community Projects
    function fundCommunityProjects(
        address _projectAddress, 
        uint256 _amount
    ) external onlyRole(COMMUNITY_MANAGER) {
        require(_amount <= MAX_COMMUNITY_PROJECT_FUNDING, "Exceeds max project funding");
        require(communityProjectFunds + _amount <= MAX_COMMUNITY_PROJECT_FUNDING, 
            "Insufficient community project funds");

        // Create multi-sig proposal for project funding
        bytes memory data = abi.encodeWithSignature(
            "transferFunds(address,uint256)", 
            _projectAddress, 
            _amount
        );
        createMultiSigProposal(address(this), data);

        communityProjectFunds += _amount;
        emit CommunityProjectFunded(_projectAddress, _amount);
    }

    // Function to claim badge rewards
    function claimBadgeRewards() external {
        CommunityMember storage member = communityMembers[msg.sender];
        
        // Calculate and mint badge rewards
        uint256 reward = _updateBadgeStatus(msg.sender);
        
        if (reward > 0) {
            mintToken(msg.sender, reward);
        }
    }

    // Internal function to transfer project funds
    function transferFunds(address _projectAddress, uint256 _amount) external {
        require(hasRole(COMMUNITY_MANAGER, msg.sender), "Not authorized");
        (bool success, ) = _projectAddress.call{value: _amount}("");
        require(success, "Transfer failed");
    }

    // Process Community Contributor Rewards
    function processCommunityRewards(
        address _contributor, 
        uint256 _rewardAmount
    ) external onlyRole(COMMUNITY_MANAGER) {
        require(_rewardAmount > 0, "Invalid reward amount");
        
        mintToken(_contributor, _rewardAmount);
        communityContributorRewards[_contributor] += _rewardAmount;
    }

    // Periodic Airdrops (can be called periodically)
    function periodicAirdrops(
        address[] memory _eligibleAddresses, 
        uint256 _amount
    ) external onlyRole(COMMUNITY_MANAGER) {
        require(_eligibleAddresses.length > 0, "No eligible addresses");
        
        bytes memory data = abi.encodeWithSignature(
            "performPeriodicAirdrop(address[],uint256)", 
            _eligibleAddresses, 
            _amount
        );
        createMultiSigProposal(address(this), data);
    }

    // Internal function to perform periodic airdrop
    function performPeriodicAirdrop(
        address[] memory _eligibleAddresses, 
        uint256 _amount
    ) external {
        for(uint256 i = 0; i < _eligibleAddresses.length; i++) {
            mintToken(_eligibleAddresses[i], _amount);
        }
    }
}