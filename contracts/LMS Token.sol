// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LMSToken is ERC20, AccessControl {
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18;
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant MULTISIG_APPROVER = keccak256("MULTISIG_APPROVER");

    address[] public reviewerPool;
    uint256 private _proposalIdCounter;

    struct MultiSigProposal {
        uint256 id;
        address proposer;
        address targetContract;
        bytes data;
        uint256 approvalCount;
        bool executed;
        mapping(address => bool) approvals;
    }

    mapping(address => bool) public isInReviewerPool;
    mapping(uint256 => MultiSigProposal) public multiSigProposals;

    event MintSuccess(address indexed _to, uint256 indexed _amount);
    event BurnSuccess(address indexed _account, uint256 _amount);
    event ReviewerAddedToPool(address indexed reviewer);
    event ReviewerRemovedFromPool(address indexed reviewer);
    event MultiSigProposalCreated(uint256 indexed proposalId, address proposer);
    event MultiSigProposalApproved(uint256 indexed proposalId, address approver);
    event MultiSigProposalExecuted(uint256 indexed proposalId);

    constructor(address[] memory _reviewers) ERC20("ABYA TOKEN", "ABYTKN") {
        require(_reviewers.length >= 4, "At least 4 reviewers are required");

        // Assign the deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MULTISIG_APPROVER, msg.sender);

        // Grant each admin the REVIEWER_ROLE
        for (uint256 i = 0; i < _reviewers.length; i++) {
            _grantRole(REVIEWER_ROLE, _reviewers[i]);
            reviewerPool.push(_reviewers[i]);
            isInReviewerPool[_reviewers[i]] = true;
        }
    }

    // Mint function
    function mintToken(address to, uint256 amount) internal virtual returns(bool) {
        require(amount + totalSupply() <= MAX_SUPPLY, "Limit Exceeded!");
        _mint(to, amount);
        emit MintSuccess(to, amount);
        return true;
    }

    // Burn function
    function burn(address account, uint256 amount) internal virtual {
        require(balanceOf(account) >= amount, "Insufficient balance");
        _burn(account, amount);
        emit BurnSuccess(account, amount);
    }

    // Add a new reviewer
    function addReviewer(address newReviewer) external onlyRole(REVIEWER_ROLE) {
        require(!isInReviewerPool[newReviewer], "Already in reviewer pool");
        _grantRole(REVIEWER_ROLE, newReviewer);

        reviewerPool.push(newReviewer);
        isInReviewerPool[newReviewer] = true;
    
        emit ReviewerAddedToPool(newReviewer);
    }

    // Remove an reviewer (restricted to DEFAULT_ADMIN_ROLE)
    function removeReviewer(address reviewer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isInReviewerPool[reviewer], "Not in reviewer pool");

        // Remove from reviewerPool array
        for (uint256 i = 0; i < reviewerPool.length; i++) {
            if (reviewerPool[i] == reviewer) {
                // Replace with last element and remove last
                reviewerPool[i] = reviewerPool[reviewerPool.length - 1];
                reviewerPool.pop();
                break;
            }
        }

        isInReviewerPool[reviewer] = false;
        _revokeRole(REVIEWER_ROLE, reviewer);
    
        emit ReviewerRemovedFromPool(reviewer);
    }

    // Check if an address has reviewer privileges
    function isReviewer(address account) public view returns (bool) {
        return hasRole(REVIEWER_ROLE, account);
    }

     // Multi-Signature Proposal Creation
    function createMultiSigProposal(
        address _targetContract, 
        bytes memory _data
    ) internal onlyRole(MULTISIG_APPROVER) onlyRole(REVIEWER_ROLE) returns(uint256) {
        uint256 proposalId = _proposalIdCounter++;
        
        MultiSigProposal storage proposal = multiSigProposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.targetContract = _targetContract;
        proposal.data = _data;
        proposal.approvalCount = 1; // Proposer's approval
        proposal.executed = false;
        proposal.approvals[msg.sender] = true;

        emit MultiSigProposalCreated(proposalId, msg.sender);
        return proposalId;
    }

    // Approve Multi-Signature Proposal
    function approveMultiSigProposal(
        uint256 _proposalId
    ) external onlyRole(MULTISIG_APPROVER) {
        MultiSigProposal storage proposal = multiSigProposals[_proposalId];
        
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.approvals[msg.sender], "Already approved");

        proposal.approvals[msg.sender] = true;
        proposal.approvalCount++;

        emit MultiSigProposalApproved(_proposalId, msg.sender);

        // Execute if enough approvals (e.g., 3 out of 5 approvers)
        if (proposal.approvalCount >= 3) {
            (bool success, ) = proposal.targetContract.call(proposal.data);
            require(success, "Proposal execution failed");
            
            proposal.executed = true;
            emit MultiSigProposalExecuted(_proposalId);
        }
    }

    //function to add multisig approver
    function addMultiSigApprover(address newApprover) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MULTISIG_APPROVER, newApprover);
    }

    //function to remove multisig approver
    function removeMultiSigApprover(address approver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MULTISIG_APPROVER, approver);
    }
}
