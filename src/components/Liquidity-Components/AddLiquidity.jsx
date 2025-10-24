import { ethers } from "ethers";
import {
  Plus,
  Activity,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import CONTRACT_ABI from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import USDC_ABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import ABYTKN_ABI from "../../artifacts/fakeLiquidityArtifacts/ABYATKN.sol/ABYATKN.json";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { client } from "../../services/client";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { defineChain } from "thirdweb/chains";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

// Constants - Aligned with our context configuration
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_SEPOLIA_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_ADDRESS, // ABYTKN (token0)
    TOKEN1: import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS, // USDC (token1)
    UNISWAP_POOL: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_USDC_500,
  },
  CHAIN: defineChain(11155111), // Sepolia
};

const AddLiquidity = () => {
  const [error, setError] = useState(false);
  const [txHash, setTxHash] = useState("");
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    refreshHistory,
    loadBalances,
    loadPoolInfo,
    balances,
    isLoadingPrice,
    isInitialRatio,
    refreshPoolPrice,
    poolPrice,
    calculateRatioWithPoolPrice,
  } = useTransactionHistory();

  // Liquidity state - using clear token names
  const [liquidityData, setLiquidityData] = useState({
    abytknAmount: "", // ABYTKN amount
    usdcAmount: "", // USDC amount
  });

  // Update useEffect to use stable references
  useEffect(() => {
    if (isConnected) {
      loadBalances();
      loadPoolInfo();
      const interval = setInterval(() => {
        loadBalances();
        loadPoolInfo();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, address, loadBalances, loadPoolInfo]);

  // Handle add liquidity
  const handleAddLiquidity = async () => {
    console.log("Liquidity Data:", liquidityData);

    if (
      !liquidityData.abytknAmount ||
      isNaN(parseFloat(liquidityData.abytknAmount)) ||
      !liquidityData.usdcAmount ||
      isNaN(parseFloat(liquidityData.usdcAmount))
    ) {
      setError("Please enter valid amounts for both tokens");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!client || !address) {
        setError("No client available or wallet not connected");
        setLoading(false);
        return;
      }

      // Initialize contracts
      const contract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        abi: contractAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const abytknContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN0,
        abi: abyatknAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const usdcContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN1,
        abi: usdcAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      // Get token decimals
      const [abytknDecimals, usdcDecimals] = await Promise.all([
        readContract({
          contract: abytknContract,
          method: "decimals",
        }),
        readContract({
          contract: usdcContract,
          method: "decimals",
        }),
      ]);

      console.log("Token decimals:", {
        ABYTKN: abytknDecimals,
        USDC: usdcDecimals,
      });

      // Prepare amounts based on contract token order
      // Contract expects: token0 (ABYTKN), token1 (USDC)
      const amount0Desired = ethers.parseUnits(
        liquidityData.abytknAmount.toString(),
        abytknDecimals
      );
      const amount1Desired = ethers.parseUnits(
        liquidityData.usdcAmount.toString(),
        usdcDecimals
      );

      console.log("Liquidity amounts:", {
        ABYTKN: {
          value: ethers.formatUnits(amount0Desired, abytknDecimals),
          raw: amount0Desired.toString(),
        },
        USDC: {
          value: ethers.formatUnits(amount1Desired, usdcDecimals),
          raw: amount1Desired.toString(),
        },
      });

      // Check balances
      const [abytknBalance, usdcBalance] = await Promise.all([
        readContract({
          contract: abytknContract,
          method: "balanceOf",
          params: [address],
        }),
        readContract({
          contract: usdcContract,
          method: "balanceOf",
          params: [address],
        }),
      ]);

      console.log("Current balances:", {
        ABYTKN: ethers.formatUnits(abytknBalance, abytknDecimals),
        USDC: ethers.formatUnits(usdcBalance, usdcDecimals),
      });

      // Check if balances are sufficient
      if (abytknBalance < amount0Desired) {
        setError(`Insufficient ABYTKN balance`);
        setLoading(false);
        return;
      }

      if (usdcBalance < amount1Desired) {
        setError(`Insufficient USDC balance`);
        setLoading(false);
        return;
      }

      // Check and approve allowances
      const [allowanceABYTKN, allowanceUSDC] = await Promise.all([
        readContract({
          contract: abytknContract,
          method: "allowance",
          params: [address, CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT],
        }),
        readContract({
          contract: usdcContract,
          method: "allowance",
          params: [address, CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT],
        }),
      ]);

      console.log("Current allowances:", {
        ABYTKN: ethers.formatUnits(allowanceABYTKN, abytknDecimals),
        USDC: ethers.formatUnits(allowanceUSDC, usdcDecimals),
      });

      // Approve ABYTKN if needed
      if (allowanceABYTKN < amount0Desired) {
        console.log("Approving ABYTKN...");
        const approveABYTKNTx = prepareContractCall({
          contract: abytknContract,
          method: "approve",
          params: [
            CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
            ethers.MaxUint256,
          ],
        });
        await sendTransaction(approveABYTKNTx);
        console.log("ABYTKN approved");
      }

      // Approve USDC if needed
      if (allowanceUSDC < amount1Desired) {
        console.log("Approving USDC...");
        const approveUSDCTx = prepareContractCall({
          contract: usdcContract,
          method: "approve",
          params: [
            CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
            ethers.MaxUint256,
          ],
        });
        await sendTransaction(approveUSDCTx);
        console.log("USDC approved");
      }

      // Add liquidity
      console.log("Adding liquidity...");

      try {
        // Estimate gas
        const gasEstimate = await prepareContractCall({
          contract,
          method: "addLiquidity",
          params: [amount0Desired, amount1Desired],
        }).then((tx) => tx.gasLimit);

        console.log("Gas estimate:", gasEstimate.toString());

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * 120n) / 100n;

        const tx = await sendTransaction(
          prepareContractCall({
            contract,
            method: "addLiquidity",
            params: [amount0Desired, amount1Desired],
            overrides: { gasLimit },
          })
        );

        setTxHash(tx.transactionHash);
        console.log("Transaction sent:", tx.transactionHash);

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 1) {
          setSuccess("Liquidity added successfully!");
          setLiquidityData({
            abytknAmount: "",
            usdcAmount: "",
          });
          loadBalances();
          if (typeof refreshHistory === "function") {
            refreshHistory();
          }
        } else {
          setError("Transaction failed");
        }
      } catch (gasError) {
        console.warn("Gas estimation failed:", gasError);

        // If gas estimation fails, try with fixed gas limit
        const tx = await sendTransaction(
          prepareContractCall({
            contract,
            method: "addLiquidity",
            params: [amount0Desired, amount1Desired],
            overrides: { gasLimit: 1500000n },
          })
        );

        setTxHash(tx.transactionHash);
        console.log(
          "Transaction sent with fixed gas limit:",
          tx.transactionHash
        );

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 1) {
          setSuccess("Liquidity added successfully!");
          setLiquidityData({
            abytknAmount: "",
            usdcAmount: "",
          });
          loadBalances();
          if (typeof refreshHistory === "function") {
            refreshHistory();
          }
        } else {
          setError("Transaction failed");
        }
      }
    } catch (error) {
      console.error("Add liquidity failed:", error);
      let errorMsg = "Failed to add liquidity";

      if (error.reason) {
        errorMsg += `: ${error.reason}`;
      } else if (error.message) {
        if (error.message.includes("user rejected")) {
          errorMsg = "Transaction rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMsg = "Insufficient funds for gas";
        } else if (error.message.includes("execution reverted")) {
          errorMsg = "Transaction reverted by contract";
          if (error.data) {
            errorMsg += ` - ${error.data}`;
          }
        } else {
          errorMsg += `: ${error.message}`;
        }
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
    }
  };

  // Set max balance
  const setMaxBalance = (tokenSymbol) => {
    const balance = balances[tokenSymbol];
    if (tokenSymbol === "ABYTKN") {
      handleABYTKNAmountChangeWithPoolPrice(balance, poolPrice);
    } else if (tokenSymbol === "USDC") {
      handleUSDCAmountChangeWithPoolPrice(balance, poolPrice);
    }
  };

  // Handle ABYTKN amount change
  const handleABYTKNAmountChangeWithPoolPrice = (value, poolPrice) => {
    const newLiquidityData = {
      abytknAmount: value,
      usdcAmount:
        value && poolPrice ? (parseFloat(value) * poolPrice).toFixed(6) : "",
    };
    setLiquidityData(newLiquidityData);
  };

  // Handle USDC amount change
  const handleUSDCAmountChangeWithPoolPrice = (value, poolPrice) => {
    const newLiquidityData = {
      usdcAmount: value,
      abytknAmount:
        value && poolPrice ? (parseFloat(value) / poolPrice).toFixed(6) : "",
    };
    setLiquidityData(newLiquidityData);
  };

  // Calculate ratio validation
  const ratioValidation = calculateRatioWithPoolPrice?.(
    liquidityData.abytknAmount,
    liquidityData.usdcAmount,
    poolPrice
  );

  return (
    <>
      <div className="space-y-6">
        {/* Token Order Info - Add this for clarity */}
        <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-yellow-600 dark:text-yellow-500" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-500 font-medium">
                Pool Token Order
              </p>
              <p className="text-xs text-yellow-700 dark:text-gray-100">
                Contract Token0: ABYTKN • Contract Token1: USDC
              </p>
            </div>
          </div>
        </div>

        {/* Pool Price Display */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-gray-800 dark:to-gray-700 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-100">
                <strong>Current Pool Price:</strong>{" "}
                {isLoadingPrice ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    {poolPrice.toFixed(2)} ABYTKN per USDC
                    {isInitialRatio && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-500 ml-2">
                        (Initial Ratio - Pool may not exist yet)
                      </span>
                    )}
                  </>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-100 mt-1">
                Fee Tier: 0.05% (500) • Full Range Liquidity
              </p>
            </div>
            <button
              onClick={refreshPoolPrice}
              disabled={isLoadingPrice}
              className="p-2 bg-yellow-100 dark:bg-gray-700 hover:bg-yellow-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh pool price"
            >
              <RefreshCw
                size={16}
                className={`${
                  isLoadingPrice ? "animate-spin" : ""
                } text-gray-800 dark:text-gray-100`}
              />
            </button>
          </div>
        </div>

        {/* USDC Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-100">
              USDC Amount
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                (Contract Token1)
              </span>
            </label>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {balances.TOKEN0}
                </span>
                <button
                  onClick={() => setMaxBalance("TOKEN0")}
                  className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded-md hover:bg-yellow-200 dark:hover:bg-gray-600 transition-colors"
                >
                  MAX
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
              value={liquidityData.token0Amount}
              onChange={(e) =>
                handleUSDCAmountChangeWithPoolPrice(e.target.value, poolPrice)
              }
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-24 text-gray-800 dark:text-gray-100"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
              USDC
            </div>
          </div>
        </div>

        {/* ABYTKN Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-100">
              ABYTKN Amount
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                (Contract Token0)
              </span>
            </label>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {balances.TOKEN1}
                </span>
                <button
                  onClick={() => setMaxBalance("TOKEN1")}
                  className="text-xs bg-yellow-100 dark:bg-gray-700 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded-md hover:bg-yellow-200 dark:hover:bg-gray-600 transition-colors"
                >
                  MAX
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.0"
              value={liquidityData.token1Amount}
              onChange={(e) =>
                handleABYTKNAmountChangeWithPoolPrice(e.target.value, poolPrice)
              }
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-24 text-gray-800 dark:text-gray-100"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
              ABYTKN
            </div>
          </div>
        </div>

        {/* Enhanced Ratio Validation Display */}
        {liquidityData.token0Amount && liquidityData.token1Amount && (
          <div className="space-y-3">
            {(() => {
              const ratioValidation = calculateRatioWithPoolPrice(
                liquidityData.token0Amount,
                liquidityData.token1Amount,
                poolPrice
              );

              if (!ratioValidation) return null;

              const isValid = ratioValidation.isValidRatio || isInitialRatio;

              return (
                <div
                  className={`border rounded-xl p-4 ${
                    isValid
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        isValid ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p
                            className={`font-semibold ${
                              isValid
                                ? "text-green-800 dark:text-green-400"
                                : "text-red-800 dark:text-red-400"
                            }`}
                          >
                            Your Ratio
                          </p>
                          <p
                            className={
                              isValid
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300"
                            }
                          >
                            {ratioValidation.ratio.toFixed(2)} ABYTKN/USDC
                          </p>
                        </div>
                        <div>
                          <p
                            className={`font-semibold ${
                              isValid
                                ? "text-green-800 dark:text-green-400"
                                : "text-red-800 dark:text-red-400"
                            }`}
                          >
                            Pool Price
                          </p>
                          <p
                            className={
                              isValid
                                ? "text-green-700 dark:text-green-300"
                                : "text-red-700 dark:text-red-300"
                            }
                          >
                            {poolPrice.toFixed(2)} ABYTKN/USDC
                          </p>
                        </div>
                      </div>

                      {!isValid && !isInitialRatio && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <p className="text-red-800 dark:text-red-400 text-sm font-semibold">
                            Price Difference: {ratioValidation.priceDifference}%
                          </p>
                          <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                            Consider adjusting your amounts:
                          </p>
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="text-red-600 dark:text-red-400">
                              • For {liquidityData.token0Amount} USDC → Use{" "}
                              {ratioValidation.suggestedToken1Amount} ABYTKN
                            </p>
                            <p className="text-red-600 dark:text-red-400">
                              • For {liquidityData.token1Amount} ABYTKN → Use{" "}
                              {ratioValidation.suggestedToken0Amount} USDC
                            </p>
                          </div>
                        </div>
                      )}

                      {isValid && (
                        <div className="mt-2">
                          <p
                            className={`text-xs ${
                              isValid
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isInitialRatio
                              ? "✅ Using initial pool ratio (pool may not exist yet)"
                              : "✅ Ratio matches current pool price within tolerance"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Quick Ratio Buttons */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-3">
            Quick Add
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { usdc: "100", label: "$100" },
              { usdc: "500", label: "$500" },
              { usdc: "1000", label: "$1000" },
            ].map((preset, index) => (
              <button
                key={index}
                onClick={() =>
                  handleUSDCAmountChangeWithPoolPrice(preset.usdc, poolPrice)
                }
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Liquidity Button */}
        <button
          onClick={handleAddLiquidity}
          disabled={
            !isConnected ||
            loading ||
            !liquidityData.token0Amount ||
            !liquidityData.token1Amount ||
            (!calculateRatioWithPoolPrice(
              liquidityData.token0Amount,
              liquidityData.token1Amount,
              poolPrice
            )?.isValidRatio &&
              !isInitialRatio)
          }
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-yellow-700 dark:hover:from-yellow-700 dark:hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 hover:cursor-pointer"
        >
          {loading ? (
            <>
              <Activity className="animate-spin" size={20} />
              Adding Liquidity...
            </>
          ) : isLoadingPrice ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Loading Pool Price...
            </>
          ) : !calculateRatioWithPoolPrice(
              liquidityData.token0Amount,
              liquidityData.token1Amount,
              poolPrice
            )?.isValidRatio &&
            !isInitialRatio &&
            liquidityData.token0Amount &&
            liquidityData.token1Amount ? (
            "Adjust Ratio to Match Pool Price"
          ) : (
            <>
              <Plus size={20} />
              Add Liquidity
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg shadow-lg">
          <AlertCircle size={20} className="inline-block mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg shadow-lg">
          <CheckCircle size={20} className="inline-block mr-2" />
          {success}
        </div>
      )}
    </>
  );
};

export default AddLiquidity;
