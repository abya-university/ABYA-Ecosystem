// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for the staking contract
interface IStaking {
    function addRewards(uint256 amount) external;
    function setRewardRate(uint256 _rewardRate) external;
}

contract ABYTKNRewardDistributor is AccessControl, ReentrancyGuard {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    
    IERC20 public abyToken;
    IERC20 public usdcToken;
    IStaking public stakingContract;
    
    // Reward calculation parameters
    uint256 public rewardPeriod = 7 days; // Weekly rewards
    uint256 public lastDistributionTime;
    uint256 public targetAPR = 1250; // 12.5% APR (in basis points, 1250 = 12.5%)
    
    event RewardsDistributed(uint256 amount, uint256 timestamp);
    event TargetAPRUpdated(uint256 newAPR);
    
    constructor(
        address _abyToken,
        address _usdcToken,
        address _stakingContract
    ) {
        abyToken = IERC20(_abyToken);
        usdcToken = IERC20(_usdcToken);
        stakingContract = IStaking(_stakingContract);
        
        __grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        __grantRole(DISTRIBUTOR_ROLE, msg.sender);
        
        lastDistributionTime = block.timestamp;
    }
    
    // Function to distribute rewards (called manually or via automation)
    function distributeRewards() external onlyRole(DISTRIBUTOR_ROLE) nonReentrant {
        // Ensure at least one period has passed
        require(block.timestamp >= lastDistributionTime + rewardPeriod, "Too early for distribution");
        
        // Get the total staked amount from the staking contract
        uint256 totalStaked = IStaking(stakingContract).totalStaked();
        if (totalStaked == 0) return; // Nothing to distribute
        
        // Calculate rewards based on target APR
        uint256 annualRewards = totalStaked * targetAPR / 10000; // APR in basis points
        uint256 periodRewards = annualRewards * rewardPeriod / 365 days;
        
        // Calculate reward rate (rewards per second)
        uint256 rewardRate = periodRewards / rewardPeriod;
        
        // Transfer rewards to the staking contract
        require(abyToken.transferFrom(msg.sender, address(stakingContract), periodRewards), "Reward transfer failed");
        
        // Update reward rate on staking contract
        IStaking(stakingContract).setRewardRate(rewardRate);
        
        // Update last distribution time
        lastDistributionTime = block.timestamp;
        
        emit RewardsDistributed(periodRewards, block.timestamp);
    }
    
    // Admin function to update target APR
    function setTargetAPR(uint256 _targetAPR) external onlyRole(DEFAULT_ADMIN_ROLE) {
        targetAPR = _targetAPR;
        emit TargetAPRUpdated(_targetAPR);
    }
}