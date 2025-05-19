// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ABYTKNStaking
 * @dev Contract for staking ABYTKN tokens and earning rewards
 */
contract ABYTKNStaking is AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    // Contract state variables
    IERC20 public abyToken;
    IERC20 public rewardToken; // Can be the same as abyToken
    
    uint256 public rewardRate; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    uint256 public totalStaked;
    
    // User data
    mapping(address => uint256) public userStakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    // Access control
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    
    constructor(address _abyToken, address _rewardToken) {
        abyToken = IERC20(_abyToken);
        rewardToken = IERC20(_rewardToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // Modifier to update rewards for a user
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
    
    // Calculate the current reward per token
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored.add(
            block.timestamp.sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(totalStaked)
        );
    }
    
    // Calculate earned rewards for an account
    function earned(address account) public view returns (uint256) {
        return userStakedBalance[account].mul(
            rewardPerToken().sub(userRewardPerTokenPaid[account])
        ).div(1e18).add(rewards[account]);
    }
    
    // Stake tokens
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        
        totalStaked = totalStaked.add(amount);
        userStakedBalance[msg.sender] = userStakedBalance[msg.sender].add(amount);
        
        // Transfer tokens from user to this contract
        require(abyToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        emit Staked(msg.sender, amount);
    }
    
    // Withdraw staked tokens
    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(userStakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        totalStaked = totalStaked.sub(amount);
        userStakedBalance[msg.sender] = userStakedBalance[msg.sender].sub(amount);
        
        // Transfer tokens back to user
        require(abyToken.transfer(msg.sender, amount), "Token transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    // Claim rewards
    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    // Admin function to set the reward rate
    function setRewardRate(uint256 _rewardRate) external onlyRole(ADMIN_ROLE) updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
    
    // Function to add rewards to the contract
    function addRewards(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Cannot add 0 rewards");
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    // Calculate the current APR based on reward rate
    function getAPR() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        // Calculate rewards per year
        uint256 rewardsPerYear = rewardRate.mul(365 days);
        
        // Calculate APR (Annual Percentage Rate)
        return rewardsPerYear.mul(100).mul(1e18).div(totalStaked);
    }
}