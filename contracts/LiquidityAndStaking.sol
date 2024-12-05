// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// This contract manages the liquidity and staking of ABYTKN tokens within the ABYA ecosystem. 
// It allows the admin to pre-mint tokens, provide initial liquidity for trading on decentralized exchanges, 
// adjust liquidity allocations as needed, and withdraw unused tokens. Users can also stake their ABYTKN tokens.

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityAndStaking is Ownable {
    IERC20 public token;

    uint256 public totalLiquidityAllocated;
    uint256 public initialLiquidityProvided;

    // constructor
    constructor(address _token) Ownable(msg.sender) { // Pass deployer's address as the initial owner
        require(_token != address(0), "Token address cannot be zero");
        token = IERC20(_token);
    }

    // staking
    uint256 public totalStaked;
    uint256 public rewardRate; 
    uint256 public lastUpdateTime;
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public rewardBalances;

    // events for liquidity and staking
    event TokensPreMinted(uint256 amount);
    event InitialLiquidityProvided(uint256 amount);
    event LiquidityAdjusted(uint256 newAllocation);
    event LiquidityWithdrawn(uint256 amount);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    // mint tokens for liquidity
    function preMint(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        totalLiquidityAllocated += amount;
        emit TokensPreMinted(amount);
    }

    // provide initial liquidity
    function provideInitialLiquidity(uint256 amount, address liquidityPool) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(initialLiquidityProvided == 0, "Initial liquidity already provided");
        require(amount <= totalLiquidityAllocated, "Insufficient allocated liquidity");

        initialLiquidityProvided = amount;
        totalLiquidityAllocated -= amount;

        require(token.transfer(liquidityPool, amount), "Token transfer failed");
        emit InitialLiquidityProvided(amount);
    }

    // adjust liquidity allocations
    function adjustLiquidity(uint256 newAllocation) external onlyOwner {
        require(newAllocation >= initialLiquidityProvided, "New allocation cannot be less than provided liquidity");
        totalLiquidityAllocated = newAllocation;
        emit LiquidityAdjusted(newAllocation);
    }

    // Wwthdraw unused liquidity
    function withdrawLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= totalLiquidityAllocated, "Insufficient allocated liquidity");

        totalLiquidityAllocated -= amount;
        require(token.transfer(msg.sender, amount), "Token transfer failed");
        emit LiquidityWithdrawn(amount);
    }

    // stake tokens
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        updateRewards(msg.sender);

        stakedBalances[msg.sender] += amount;
        totalStaked += amount;

        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        emit TokensStaked(msg.sender, amount);
    }

    // unstake tokens
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(stakedBalances[msg.sender] >= amount, "Insufficient staked balance");

        updateRewards(msg.sender);

        stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;

        require(token.transfer(msg.sender, amount), "Token transfer failed");
        emit TokensUnstaked(msg.sender, amount);
    }

    // claim rewards
    function claimRewards() external {
        updateRewards(msg.sender);

        uint256 rewards = rewardBalances[msg.sender];
        require(rewards > 0, "No rewards to claim");

        rewardBalances[msg.sender] = 0;
        require(token.transfer(msg.sender, rewards), "Token transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    // update rewards for a user
    function updateRewards(address user) internal {
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        lastUpdateTime = block.timestamp;

        if (totalStaked > 0) {
            uint256 totalRewards = timeElapsed * rewardRate;
            rewardBalances[user] += (totalRewards * stakedBalances[user]) / totalStaked;
        }
    }

    // set reward rate (only admin)
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
    }
}
