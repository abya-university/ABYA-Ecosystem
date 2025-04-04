// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LMSToken } from "../LMS Token.sol";
import { CommunityBadgeSystem } from "./CommunityBadgeSystem.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Community is AccessControl, ReentrancyGuard, LMSToken, CommunityBadgeSystem {
    // Constants
    uint256 public constant COMMUNITY_POOL = (MAX_SUPPLY * 10) / 100;
    uint256 public constant MAX_COMMUNITY_PROJECT_FUNDING = (COMMUNITY_POOL * 5) / 100;
    uint256 public constant EVENT_PARTICIPATION_REWARD = 3 * 10**18; // 10 tokens

    // Roles
    bytes32 public constant COMMUNITY_MANAGER = keccak256("COMMUNITY_MANAGER");

    // State Variables
    uint256 public communityPoolSupply;
    uint256 public communityProjectFunds;
    uint256 public nextAirdropId;
    uint256 public activeAirdropId;
  
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
        bool isOnline;           // true if online, false if physical
        string location;         // URL for online events, physical address for in-person events
        string additionalDetails; // Additional event details (dress code, items to bring, etc.)
    }

    enum ProjectStage {
        IDEA,
        PLANNING,
        MVP,
        ALPHA,
        BETA,
        PRODUCTION
    }

    struct AirdropProposal {
        uint256 airdropId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 approvalCount;
    }

    struct ProjectFundingProposal {
        uint256 id;
        address creator;
        string name;
        string description;
        string[] techStack;
        string blockchain;
        uint256 requestedAmount;
        uint256 timeline; // In days
        ProjectStage stage;
        bool isApproved;
        bool isRejected;
        string rejectionReason;
        uint256 approvalCount;
    }


    // Mappings
    mapping(uint256 => CommunityEvent) public communityEvents;
    mapping(address => uint256) public communityContributorRewards;
    mapping(address => bool) public isCommunityMember;
    mapping(uint256 => ProjectFundingProposal) public projectProposals;
    mapping(uint256 => mapping(address => bool)) approvals;
    mapping(uint256 => mapping(address => bool)) hasClaimedAirdrop;
    mapping(uint256 => AirdropProposal) public airdropProposal;

    // Events
    event CommunityPoolUpdate(address indexed _to, uint256 indexed _amount);
    event EventCreated(uint256 indexed eventId, string name, address creator, bool isOnline, string location);
    event EventParticipation(uint256 indexed eventId, address participant);
    event JoinSuccess(address indexed _address);
    event ProjectProposalCreated(uint256 indexed proposalId, address indexed creator, string name, uint256 requestedAmount);
    event ProjectProposalApproved(uint256 indexed proposalId);
    event ProjectProposalRejected(uint256 indexed proposalId, string reason);
    event ProjectFundingReleased(uint256 indexed proposalId, address indexed creator, uint256 amount);
    event AirdropActivated(uint256 indexed airdropId, uint256 amount, uint256 startTime, uint256 endTime);
    event AirdropClaimed(uint256 indexed airdropId, address indexed claimer, uint256 amount);
    event AirdropDeactivated(uint256 indexed airdropId);
    event AirdropProposalCreated(uint256 indexed airdropId, uint256 amount, uint256 startTime, uint256 endTime);
    event AirdropProposalApproved(uint256 indexed airdropId, address indexed approver);

    // Counters (simulating OpenZeppelin's Counters library)
    uint256 private _eventIdCounter;
    uint256 private _proposalIdCounter;
    address[] public abyaCommunity;
    uint256 private _projectProposalCounter;

    constructor(address[] memory _reviewers) LMSToken(_reviewers) ReentrancyGuard() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMMUNITY_MANAGER, msg.sender);
        _grantRole(MULTISIG_APPROVER, msg.sender);

        nextAirdropId = 1;
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

    // Function to join ABYA Community
    function joinCommunity() external returns (bool) {
        require(!isCommunityMember[msg.sender], "Already a member!");

        abyaCommunity.push(msg.sender);
        isCommunityMember[msg.sender] = true;

        recordEventParticipation(msg.sender);

        emit JoinSuccess(msg.sender);

        return true;
    }

    // Function to get all community members
    function getAllCommunityMembers() external view returns (address[] memory) {
        return abyaCommunity;
    }

    // Get Current Community Pool Supply
    function getCurrentCommunityPoolSupply() internal view returns(uint256) {
        return communityPoolSupply;
    }

    // Distribute Airdrops with Multi-Sig Approval
    function createAirdropProposal(
    uint256 _amount,
    uint256 _startTime,
    uint256 _endTime
) external onlyRole(COMMUNITY_MANAGER) returns (bool) {
    require(_startTime < _endTime, "Invalid time period");
    require(_startTime > block.timestamp, "Start time must be in the future");
    require(activeAirdropId == 0, "Another airdrop is currently active");

    // Create the airdrop proposal
    airdropProposal[nextAirdropId] = AirdropProposal({
        airdropId: nextAirdropId,
        amount: _amount,
        startTime: _startTime,
        endTime: _endTime,
        isActive: false,
        approvalCount: 0
    });

    emit AirdropProposalCreated(nextAirdropId, _amount, _startTime, _endTime);

    nextAirdropId++;
    return true;
}

    //internal functio to activate airdrop proposal
    function activateAirdrop(uint256 _airdropId) external {
    AirdropProposal storage proposal = airdropProposal[_airdropId];

    require(proposal.isActive, "Airdrop not approved");
    require(activeAirdropId == 0, "Another airdrop is currently active");

    // Set the active airdrop ID
    activeAirdropId = _airdropId;

    emit AirdropActivated(_airdropId, proposal.amount, proposal.startTime, proposal.endTime);
}

    function claimAirdrop(uint256 _airdropId) external nonReentrant {
        AirdropProposal storage airdropProposal = airdropProposal[_airdropId];
        require(airdropProposal.isActive, "Airdrop not active!");
        require(block.timestamp >= airdropProposal.startTime && block.timestamp <= airdropProposal.endTime, 
            "Airdrop not in progress");
        require(!hasClaimedAirdrop[airdropProposal.airdropId][msg.sender], "Already claimed this airdrop");
        require(isCommunityMember[msg.sender], "Must be a community member to claim");
    
        // Mark as claimed using the external mapping
        hasClaimedAirdrop[airdropProposal.airdropId][msg.sender] = true;
    
        // Mint tokens to the claimer
        mintToken(msg.sender, airdropProposal.amount);
    
        emit AirdropClaimed(airdropProposal.airdropId, msg.sender, airdropProposal.amount);
    }


    function approveAirdropProposal(uint256 _airdropId) external onlyRole(MULTISIG_APPROVER) {
    AirdropProposal storage proposal = airdropProposal[_airdropId];

    require(!proposal.isActive, "Airdrop already active");
    require(activeAirdropId == 0, "Another airdrop is currently active");
    require(!approvals[_airdropId][msg.sender], "Already approved by this approver");

    approvals[_airdropId][msg.sender] = true;
    proposal.approvalCount++;

    if (proposal.approvalCount >= 3) {
        proposal.isActive = true;
        activeAirdropId = _airdropId; // Set the active airdrop ID

                // Create data for multisig proposal to activate airdrop
            bytes memory data = abi.encodeWithSignature(
                "activateAirdrop(uint256,uint256,uint256)",
                proposal.amount,
                proposal.startTime,
                proposal.endTime
            );
        uint256 proposalId = createMultiSigProposal(address(this), data);

        emit AirdropProposalApproved(_airdropId, msg.sender);
    }
}

    //function to get all airdrop proposal plus their details
    function getAirdropProposal(uint256 _airdropId) external view returns (
    uint256 airdropId,
    uint256 amount,
    uint256 startTime,
    uint256 endTime,
    bool isActive,
    uint256 approvalCount
) {
    AirdropProposal storage proposal = airdropProposal[_airdropId];
    return (
        proposal.airdropId,
        proposal.amount,
        proposal.startTime,
        proposal.endTime,
        proposal.isActive,
        proposal.approvalCount
    );
}

function getAllAirdropProposals() external view returns (AirdropProposal[] memory) {
    uint256 totalProposals = nextAirdropId - 1;
    AirdropProposal[] memory allProposals = new AirdropProposal[](totalProposals);

    for (uint256 i = 0; i < totalProposals; i++) {
        allProposals[i] = airdropProposal[i + 1];
    }

    return allProposals;
}

    function checkClaimStatus(address _address, uint256 _airdropId) external view returns (bool) {
        AirdropProposal storage airdropProposal = airdropProposal[_airdropId];
        require(airdropProposal.isActive, "Airdrop not active!");
        return hasClaimedAirdrop[airdropProposal.airdropId][_address];
    }

    // Create Community Event
    function createEvent(
        string memory _name, 
        uint256 _startTime, 
        uint256 _endTime, 
        uint256 _maxParticipants,
        bool _isOnline,
        string memory _location,
        string memory _additionalDetails
        ) external onlyRole(COMMUNITY_MANAGER) returns (uint256) {
        uint256 eventId = _eventIdCounter++;
    
        CommunityEvent storage newEvent = communityEvents[eventId];
        newEvent.id = eventId;
        newEvent.name = _name;
        newEvent.creator = msg.sender;
        newEvent.startTime = _startTime;
        newEvent.endTime = _endTime;
        newEvent.maxParticipants = _maxParticipants;
        newEvent.isActive = true;
        newEvent.isOnline = _isOnline;
        newEvent.location = _location;
        newEvent.additionalDetails = _additionalDetails;

        emit EventCreated(eventId, _name, msg.sender, _isOnline, _location);
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

    // Function to claim badge rewards
    function claimBadgeRewards() external {
        CommunityMember storage member = communityMembers[msg.sender];
        
        // Calculate and mint badge rewards
        uint256 reward = _updateBadgeStatus(msg.sender);
        
        if (reward > 0) {
            mintToken(msg.sender, reward);
        }
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

    // Function to get all community events with details
function getAllCommunityEvents() external view returns (CommunityEvent[] memory) {
    uint256 totalEvents = _eventIdCounter;
    CommunityEvent[] memory allEvents = new CommunityEvent[](totalEvents);
    
    for (uint256 i = 0; i < totalEvents; i++) {
        allEvents[i] = communityEvents[i];
    }
    
    return allEvents;
}

// Function to create a project funding proposal
function createProjectFundingProposal(
    string memory _name,
    string memory _description,
    string[] memory _techStack,
    string memory _blockchain,
    uint256 _requestedAmount,
    uint256 _timeline,
    ProjectStage _stage
) external nonReentrant returns (uint256) {
    // Require that the creator is a community member
    require(isCommunityMember[msg.sender], "Must be a community member to create proposals");
    
    // Require that the requested amount is within limits
    require(_requestedAmount <= MAX_COMMUNITY_PROJECT_FUNDING, "Requested amount exceeds maximum funding limit");
    
    ProjectFundingProposal storage proposal = projectProposals[_projectProposalCounter];
    proposal.id = _projectProposalCounter;
    proposal.creator = msg.sender;
    proposal.name = _name;
    proposal.description = _description;
    proposal.techStack = _techStack;
    proposal.blockchain = _blockchain;
    proposal.requestedAmount = _requestedAmount;
    proposal.timeline = _timeline;
    proposal.stage = _stage;
    proposal.isApproved = false;
    proposal.isRejected = false;
    proposal.rejectionReason = "";
    proposal.approvalCount = 0;

    _projectProposalCounter++;
    
    emit ProjectProposalCreated(_projectProposalCounter, msg.sender, _name, _requestedAmount);
    
    return _projectProposalCounter;
}

// Function for multisig approvers to approve a project funding proposal
function approveProjectProposal(uint256 _proposalId) external onlyRole(MULTISIG_APPROVER) {
    ProjectFundingProposal storage proposal = projectProposals[_proposalId];
    
    require(!proposal.isApproved, "Proposal already approved");
    require(!proposal.isRejected, "Proposal already rejected");
    require(!approvals[_proposalId][msg.sender], "Already approved by this approver");
    
    approvals[_proposalId][msg.sender] = true;
    proposal.approvalCount++;
    
    // Execute if enough approvals (using the same threshold as other multisig operations - 3)
    if (proposal.approvalCount >= 3) {
        proposal.isApproved = true;
        
        // Create data for multisig proposal to release funds
        bytes memory data = abi.encodeWithSignature(
            "releaseProjectFunding(uint256)",
            _proposalId
        );
        
        // Create multisig proposal for releasing funds
        createMultiSigProposal(address(this), data);
        
        emit ProjectProposalApproved(_proposalId);
    }
}

// Function to reject a project proposal
function rejectProjectProposal(uint256 _proposalId, string memory _reason) external onlyRole(MULTISIG_APPROVER) {
    ProjectFundingProposal storage proposal = projectProposals[_proposalId];
    
    require(!proposal.isApproved, "Proposal already approved");
    require(!proposal.isRejected, "Proposal already rejected");
    
    proposal.isRejected = true;
    proposal.rejectionReason = _reason;
    
    emit ProjectProposalRejected(_proposalId, _reason);
}

// Internal function to release project funding after approval
function releaseProjectFunding(uint256 _proposalId) external {
    ProjectFundingProposal storage proposal = projectProposals[_proposalId];
    
    require(proposal.isApproved, "Proposal not approved");
    require(communityProjectFunds + proposal.requestedAmount <= MAX_COMMUNITY_PROJECT_FUNDING, 
        "Insufficient community project funds");
    
    // Mint tokens to the project creator
    mintToken(proposal.creator, proposal.requestedAmount);
    
    // Update community project funds
    communityProjectFunds += proposal.requestedAmount;
    
    emit ProjectFundingReleased(_proposalId, proposal.creator, proposal.requestedAmount);
}

// Function to get project proposal details
function getProjectProposal(uint256 _proposalId) external view returns (
    address creator,
    string memory name,
    string memory description,
    string memory blockchain,
    uint256 requestedAmount,
    uint256 timeline,
    ProjectStage stage,
    bool isApproved,
    bool isRejected,
    string memory rejectionReason,
    uint256 approvalCount
) {
    ProjectFundingProposal storage proposal = projectProposals[_proposalId];
    
    return (
        proposal.creator,
        proposal.name,
        proposal.description,
        proposal.blockchain,
        proposal.requestedAmount,
        proposal.timeline,
        proposal.stage,
        proposal.isApproved,
        proposal.isRejected,
        proposal.rejectionReason,
        proposal.approvalCount
    );
}

// Function to get project proposal tech stack
function getProjectTechStack(uint256 _proposalId) external view returns (string[] memory) {
    return projectProposals[_proposalId].techStack;
}

// Function to get all project proposals
function getAllProjectProposals() external view returns (ProjectFundingProposal[] memory) {
    uint256 totalProposals = _projectProposalCounter;
    ProjectFundingProposal[] memory allProposals = new ProjectFundingProposal[](totalProposals);

    for (uint256 i = 0; i < totalProposals; i++) {
        ProjectFundingProposal storage proposal = projectProposals[i];
        allProposals[i] = ProjectFundingProposal({
            id: proposal.id,
            creator: proposal.creator,
            name: proposal.name,
            description: proposal.description,
            techStack: proposal.techStack,
            blockchain: proposal.blockchain,
            requestedAmount: proposal.requestedAmount,
            timeline: proposal.timeline,
            stage: proposal.stage,
            isApproved: proposal.isApproved,
            isRejected: proposal.isRejected,
            rejectionReason: proposal.rejectionReason,
            approvalCount: proposal.approvalCount
        });
    }

    return allProposals;
}
}