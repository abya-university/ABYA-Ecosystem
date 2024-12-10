// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LMSToken } from "./LMS Token.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Treasury is LMSToken, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant TREASURY_POOL = (MAX_SUPPLY * 20) / 100;
    uint256 public constant MAX_FUNDING_REQUEST_DURATION = 30 days;

    // Roles
    bytes32 public constant TREASURER = keccak256("TREASURER");
    bytes32 public constant TRUSTEE = keccak256("TRUSTEE");

    // Tracking variables
    uint256 public marketingSpent;
    uint256 public reserveFunds;
    uint256 public treasuryPoolSupply;
    uint256 public nextRequestId;
    uint256 public contractBalance;

    // Funding request structure
    struct FundingRequest {
        address requester;
        address recipient;
        uint256 amount;
        string purpose;
        uint256 createdAt;
        uint256 approvalCount;
        bool executed;
        mapping(address => bool) votes;
    }

    // Mappings and sets
    mapping(address => uint256) public allocations;
    mapping(uint256 => FundingRequest) public fundingRequests;
    EnumerableSet.AddressSet private trustees;

    // Events
    event FundsAllocated(address indexed recipient, uint256 amount, string purpose);
    event TreasuryPoolUpdate(address indexed _to, uint256 indexed _amount);
    event FundingRequestCreated(uint256 indexed requestId, address indexed requester, uint256 amount);
    event FundingRequestApproved(uint256 indexed requestId, address indexed trustee);
    event FundingRequestExecuted(uint256 indexed requestId, address indexed recipient);
    event DepositSuccess(address indexed _contract, uint256 amount);
    event WithdrawalSuccess(address indexed recipient, uint256 amount);

    constructor(address[] memory _reviewers) LMSToken(_reviewers) ReentrancyGuard() {
        _grantRole(TREASURER, msg.sender);
        nextRequestId = 1;
    }

    // Deposit function to add funds to the contract
    function deposit(uint256 amount) external payable nonReentrant returns(bool){
        require(msg.value > 0 && msg.value == amount, "Treasury: Invalid deposit amount");

        contractBalance += msg.value;

        emit DepositSuccess(address(this), amount);
        return true;
    }

    // Withdraw function for treasurer to remove funds
    function withdraw(uint256 amount) external onlyRole(TREASURER) nonReentrant {
        require(amount > 0, "Treasury: Withdrawal amount must be greater than 0");
        require(amount <= address(this).balance, "Treasury: Insufficient contract balance");
        require(amount <= contractBalance, "Treasury: Insufficient tracked balance");

        // Create a multi-sig proposal for withdrawal
        bytes memory data = abi.encodeWithSignature(
            "performAirdrop(uint256,address[])", 
            amount
        );
        createMultiSigProposal(address(this), data);

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Treasury: Withdrawal transfer failed");

        // Update contract balance
        contractBalance -= amount;

        emit WithdrawalSuccess(msg.sender, amount);
    }

    // View contract balance
    function getContractBalance() external view returns (uint256) {
        return contractBalance;
    }

    // Mint function with enhanced control
    function mintToken(address to, uint256 amount) internal override returns(bool) {
        require(amount + getCurrentTreasuryPoolSupply() <= TREASURY_POOL, "Treasury: Minting limit exceeded");
        require(to != address(0), "Treasury: Cannot mint to zero address");
        
        super.mintToken(to, amount);
        treasuryPoolSupply += amount;

        emit TreasuryPoolUpdate(to, amount);
        return true;
    }

    // Burn function with enhanced tracking
    function burn(address account, uint256 amount) internal override {
        require(account != address(0), "Treasury: Cannot burn from zero address");
        
        super.burn(account, amount);
        // Ensure we don't underflow
        treasuryPoolSupply = treasuryPoolSupply > amount ? treasuryPoolSupply - amount : 0;
    }

    // Get current treasury pool supply
    function getCurrentTreasuryPoolSupply() internal view returns(uint256) {
        return treasuryPoolSupply;
    }

    // Allocate funds
    function allocateFunds(address recipient, uint256 amount, string memory purpose) 
        external 
        onlyRole(TREASURER) 
        nonReentrant 
    {
        require(recipient != address(0), "Treasury: Invalid recipient");
        require(amount > 0, "Treasury: Amount must be greater than 0");

        mintToken(recipient, amount);
        allocations[recipient] += amount;

        // Categorize funds
        if (keccak256(bytes(purpose)) == keccak256("Marketing")) {
            marketingSpent += amount;
        } else {
            reserveFunds += amount;
        }

        emit FundsAllocated(recipient, amount, purpose);
    }

    // View pool details
    function viewPoolDetails() external view returns (uint256, uint256, uint256) {
        return (treasuryPoolSupply, marketingSpent, reserveFunds);
    }

    // Trustee management
    function addTrustee(address _trustee) external onlyRole(TREASURER) returns(bool) {
        require(_trustee != address(0), "Treasury: Invalid trustee address");
        require(trustees.add(_trustee), "Treasury: Trustee already exists");
        _grantRole(TRUSTEE, _trustee);
        return true;
    }

    function revokeTrustee(address _trustee) external onlyRole(TREASURER) returns(bool) {
        require(trustees.remove(_trustee), "Treasury: Trustee not found");
        _revokeRole(TRUSTEE, _trustee);
        return true;
    }

    // Funding request system
    function requestFunding(address to, uint256 amount, string memory purpose) 
        external 
        returns(uint256) 
    {
        require(to != address(0), "Treasury: Invalid recipient");
        require(amount > 0, "Treasury: Amount must be greater than 0");

        uint256 requestId = nextRequestId++;
        FundingRequest storage request = fundingRequests[requestId];
        
        request.requester = msg.sender;
        request.recipient = to;
        request.amount = amount;
        request.purpose = purpose;
        request.createdAt = block.timestamp;

        emit FundingRequestCreated(requestId, msg.sender, amount);
        return requestId;
    }

    function approveFundingRequest(uint256 requestId) 
        external 
        onlyRole(TRUSTEE) 
        nonReentrant 
    {
        FundingRequest storage request = fundingRequests[requestId];
        
        require(!request.executed, "Treasury: Request already executed");
        require(block.timestamp <= request.createdAt + MAX_FUNDING_REQUEST_DURATION, 
            "Treasury: Funding request expired");
        require(!request.votes[msg.sender], "Treasury: Already voted");

        request.votes[msg.sender] = true;
        request.approvalCount++;

        emit FundingRequestApproved(requestId, msg.sender);

        // If majority of trustees approve, execute the request
        if (request.approvalCount > trustees.length() / 2) {
            mintToken(request.recipient, request.amount);
            request.executed = true;

            emit FundingRequestExecuted(requestId, request.recipient);
        }
    }

    // get trustees count
    function getTrusteesCount() external view returns (uint256) {
        return trustees.length();
    }
}