// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// For Uniswap V4, you'll need to import the appropriate interfaces
// This is a simplified version assuming Uniswap V3 for now
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract ABYTKNLiquidityManager is AccessControl, ReentrancyGuard {
    bytes32 public constant LIQUIDITY_MANAGER_ROLE = keccak256("LIQUIDITY_MANAGER_ROLE");
    
    IERC20 public abyToken;
    IERC20 public usdcToken;
    
    // Uniswap interfaces
    ISwapRouter public immutable swapRouter;
    INonfungiblePositionManager public immutable positionManager;
    
    // Pool constants
    uint24 public constant POOL_FEE = 3000; // 0.3%
    
    // Events
    event LiquidityAdded(uint256 tokenId, uint256 abyAmount, uint256 usdcAmount);
    event LiquidityRemoved(uint256 tokenId, uint256 abyAmount, uint256 usdcAmount);
    
    constructor(
        address _abyToken,
        address _usdcToken,
        address _swapRouter,
        address _positionManager
    ) {
        abyToken = IERC20(_abyToken);
        usdcToken = IERC20(_usdcToken);
        swapRouter = ISwapRouter(_swapRouter);
        positionManager = INonfungiblePositionManager(_positionManager);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDITY_MANAGER_ROLE, msg.sender);
    }
    
    // Function to add liquidity to Uniswap V3 pool
    function addLiquidity(
        uint256 abyAmount,
        uint256 usdcAmount,
        uint256 abyMinAmount,
        uint256 usdcMinAmount,
        int24 tickLower,
        int24 tickUpper
    ) external onlyRole(LIQUIDITY_MANAGER_ROLE) nonReentrant returns (uint256 tokenId) {
        // Transfer tokens to this contract
        TransferHelper.safeTransferFrom(address(abyToken), msg.sender, address(this), abyAmount);
        TransferHelper.safeTransferFrom(address(usdcToken), msg.sender, address(this), usdcAmount);
        
        // Approve tokens to position manager
        TransferHelper.safeApprove(address(abyToken), address(positionManager), abyAmount);
        TransferHelper.safeApprove(address(usdcToken), address(positionManager), usdcAmount);
        
        // Sort tokens (Uniswap requires tokenA < tokenB)
        (address token0, address token1) = address(abyToken) < address(usdcToken) 
            ? (address(abyToken), address(usdcToken)) 
            : (address(usdcToken), address(abyToken));
            
        // Amounts must be sorted in the same order as tokens
        (uint256 amount0, uint256 amount1) = address(abyToken) < address(usdcToken) 
            ? (abyAmount, usdcAmount) 
            : (usdcAmount, abyAmount);
            
        // Minimum amounts sorted
        (uint256 amount0Min, uint256 amount1Min) = address(abyToken) < address(usdcToken) 
            ? (abyMinAmount, usdcMinAmount) 
            : (usdcMinAmount, abyMinAmount);
        
        // Create mint params
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: POOL_FEE,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            recipient: address(this),
            deadline: block.timestamp
        });
        
        // Mint position and get tokenId
        (tokenId, , , ) = positionManager.mint(params);
        
        emit LiquidityAdded(tokenId, abyAmount, usdcAmount);
        return tokenId;
    }
    
    // Function to remove liquidity
    function removeLiquidity(
        uint256 tokenId,
        uint128 liquidityPercentage
    ) external onlyRole(LIQUIDITY_MANAGER_ROLE) nonReentrant {
        // Get position details
        (, , address token0, address token1, , , , uint128 liquidity, , , , ) = positionManager.positions(tokenId);
        
        // Calculate liquidity to remove
        uint128 liquidityToRemove = uint128(uint256(liquidity) * liquidityPercentage / 100);
        
        // Create decreaseLiquidity params
        INonfungiblePositionManager.DecreaseLiquidityParams memory params = INonfungiblePositionManager.DecreaseLiquidityParams({
            tokenId: tokenId,
            liquidity: liquidityToRemove,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        });
        
        // Remove liquidity
        positionManager.decreaseLiquidity(params);
        
        // Collect fees
        INonfungiblePositionManager.CollectParams memory collectParams = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: msg.sender,
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });
        
        // Collect tokens
        (uint256 amount0, uint256 amount1) = positionManager.collect(collectParams);
        
        // Map amounts back to token types for the event
        uint256 abyAmount = token0 == address(abyToken) ? amount0 : amount1;
        uint256 usdcAmount = token0 == address(usdcToken) ? amount0 : amount1;
        
        emit LiquidityRemoved(tokenId, abyAmount, usdcAmount);
    }
    
    // Function to collect fees
    function collectFees(uint256 tokenId) external onlyRole(LIQUIDITY_MANAGER_ROLE) nonReentrant {
        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: msg.sender,
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });
        
        positionManager.collect(params);
    }
}