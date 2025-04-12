// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SFuelDistributor
 * @dev Contract for distributing sFUEL to users with low balances
 */
contract SFuelDistributor is AccessControl, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant WHITELIST_ROLE = keccak256("WHITELIST_ROLE");
    
    uint256 public distributionAmount = 0.00001 ether;
    uint256 public threshold = 0.000005 ether;
    uint256 public cooldownPeriod = 1 days;
    
    mapping(address => uint256) public lastDistribution;
    
    event AmountUpdated(uint256 indexed originalAmount, uint256 indexed newAmount, address indexed signer);
    event ThresholdUpdated(uint256 indexed originalThreshold, uint256 indexed newThreshold);
    event CooldownUpdated(uint256 indexed originalPeriod, uint256 indexed newPeriod);
    event Whitelist(address indexed to);
    event SFuelDistributed(address indexed to, uint256 amount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Update amount to distribute to user
     * @param newAmount The new distribution amount
     */
    function updateDistributionAmount(uint256 newAmount) external onlyRole(MANAGER_ROLE) {
        require(newAmount > 0, "SFuelDistributor: Invalid Amount");
        uint256 originalAmount = distributionAmount;
        distributionAmount = newAmount;
        emit AmountUpdated(originalAmount, distributionAmount, msg.sender);
    }
    
    /**
     * @dev Update balance threshold for distribution eligibility
     * @param newThreshold The new balance threshold
     */
    function updateThreshold(uint256 newThreshold) external onlyRole(MANAGER_ROLE) {
        require(newThreshold > 0, "SFuelDistributor: Invalid Threshold");
        uint256 originalThreshold = threshold;
        threshold = newThreshold;
        emit ThresholdUpdated(originalThreshold, threshold);
    }
    
    /**
     * @dev Update cooldown period between distributions
     * @param newPeriod The new cooldown period in seconds
     */
    function updateCooldownPeriod(uint256 newPeriod) external onlyRole(MANAGER_ROLE) {
        uint256 originalPeriod = cooldownPeriod;
        cooldownPeriod = newPeriod;
        emit CooldownUpdated(originalPeriod, cooldownPeriod);
    }
    
    /**
     * @dev Check if an address is eligible for sFUEL distribution
     * @param user Address to check
     * @return bool True if eligible
     */
    function isEligibleForDistribution(address user) public view returns (bool) {
        // Check if balance is below threshold
        bool belowThreshold = user.balance < threshold;
        
        // Check if cooldown period has passed
        bool cooldownPassed = block.timestamp > lastDistribution[user] + cooldownPeriod;
        
        // Not already whitelisted
        bool notWhitelisted = !hasRole(WHITELIST_ROLE, user);
        
        return belowThreshold && cooldownPassed && notWhitelisted;
    }
    
    /**
     * @dev Whitelist address and distribute sFUEL if needed
     * @param to Address to whitelist and potentially receive sFUEL
     */
    function whitelist(address to) external {
        require(!hasRole(WHITELIST_ROLE, to), "SFuelDistributor: Already whitelisted");
        
        // Check if user needs sFUEL
        if (to.balance < threshold) {
            require(address(this).balance >= distributionAmount, "SFuelDistributor: Contract out of sFUEL");
            
            // Record last distribution time
            lastDistribution[to] = block.timestamp;
            
            // Transfer sFUEL
            (bool success, ) = payable(to).call{value: distributionAmount}("");
            require(success, "SFuelDistributor: sFUEL transfer failed");
            
            emit SFuelDistributed(to, distributionAmount);
        }
        
        // Grant whitelist role regardless of whether sFUEL was distributed
        _grantRole(WHITELIST_ROLE, to);

        emit Whitelist(to);
    }

    
    /**
     * @dev Remove address from whitelist
     * @param user Address to remove from whitelist
     */
    function removeFromWhitelist(address user) external onlyRole(MANAGER_ROLE) {
        require(hasRole(WHITELIST_ROLE, user), "SFuelDistributor: Not whitelisted");
        _revokeRole(WHITELIST_ROLE, user);
    }
    
    /**
     * @dev Allow contract to receive sFUEL
     */
    receive() external payable {}
    
    /**
     * @dev Allow admin to withdraw sFUEL if needed
     */
    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "SFuelDistributor: No balance to withdraw");
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "SFuelDistributor: Withdrawal failed");
    }
}