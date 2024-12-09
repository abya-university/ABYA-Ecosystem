// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LMSToken } from "./LMS Token.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityContract is LMSToken {
    ISwapRouter public immutable swapRouter;
    IERC20 public immutable nativeToken;
    IERC20 public constant stableCoin = IERC20(0x07865c6E87B9F70255377e024ace6630C1Eaa37F); //stablecoin is USDC

    uint256 public constant LIQUIDITY_POOL = (MAX_SUPPLY * 10) / 100;
    uint256 public totalLiquidityProvided;
    
    uint256 public totalStaked;
    uint256 public rewardRate;
    uint256 public constant PROTOCOL_FEE_PERCENTAGE = 3;

    bytes32 public constant LIQUIDITY_MANAGER = keccak256("LIQUIDITY_MANAGER");

    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public accumulatedRewards;

    event LiquidityAdded(uint256 nativeTokenAmount, uint256 stableCoinAmount);
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(
        address[] memory _reviewers
    ) LMSToken(_reviewers) {
        swapRouter = ISwapRouter("0xE592427A0AEce92De3Edee1F18E0157C05861564"); //uniswaprouter address
        nativeToken = IERC20(address(this));

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDITY_MANAGER, msg.sender);

        mintToken(address(this), LIQUIDITY_POOL);
    }

    function addLiquidity(uint256 nativeTokenAmount, uint256 stableCoinAmount, uint160 sqrtPriceLimitX96) external onlyRole(LIQUIDITY_MANAGER) {
        TransferHelper.safeApprove(address(nativeToken), address(swapRouter), nativeTokenAmount);
        TransferHelper.safeApprove(address(stableCoin), address(swapRouter), stableCoinAmount);

        ISwapRouter.ExactInputSingleParams memory params = 
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(nativeToken),
                tokenOut: address(stableCoin),
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: nativeTokenAmount,
                amountOutMinimum: stableCoinAmount,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            });

        swapRouter.exactInputSingle(params);

        totalLiquidityProvided += nativeTokenAmount;
        emit LiquidityAdded(nativeTokenAmount, stableCoinAmount);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Invalid stake amount");
        
        TransferHelper.safeTransferFrom(address(nativeToken), msg.sender, address(this), amount);

        stakedBalances[msg.sender] += amount;
        totalStaked += amount;

        emit StakeDeposited(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0 && amount <= stakedBalances[msg.sender], "Invalid unstake amount");

        uint256 rewards = calculateRewards(msg.sender);
        
        stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;

        TransferHelper.safeTransfer(address(nativeToken), msg.sender, amount + rewards);

        emit StakeWithdrawn(msg.sender, amount);
        emit RewardsClaimed(msg.sender, rewards);
    }

    function calculateRewards(address staker) internal view returns (uint256) {
        if (totalStaked == 0) return 0;
        return (stakedBalances[staker] * PROTOCOL_FEE_PERCENTAGE) / totalStaked;
    }
}