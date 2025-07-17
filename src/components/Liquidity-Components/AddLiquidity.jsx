import { ethers } from "ethers";
import USDC_ABI from "../../artifacts/fake-liquidity-abis/usdc.json";
import ABYTKN_ABI from "../../artifacts/fake-liquidity-abis/abyatkn.json";
import {
  Plus,
  Activity,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

import CONTRACT_ABI from "../../artifacts/fake-liquidity-abis/add_swap_contract.json";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

const AddLiquidity = () => {
  const [error, setError] = useState(false);
  const [txHash, setTxHash] = useState("");
  const { address, isConnected } = useAccount();
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

  // Liquidity state
  const [liquidityData, setLiquidityData] = useState({
    token0Amount: "",
    token1Amount: "",
    token0Symbol: "TOKEN0",
    token1Symbol: "TOKEN1",
  });

  // Contract addresses
  const CONTRACT_ADDRESSES = {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS, // USDC
    TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS, // ABYTKN
    UNISWAP_POOL: import.meta.env.VITE_APP_ABYATKN_USDC_500, // Uniswap pool address
  };

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
  }, [isConnected, address, loadBalances]);

  // Handle add liquidity
  const handleAddLiquidity = async () => {
    console.log("Liquidity Data:", liquidityData);

    if (
      !liquidityData.token0Amount ||
      isNaN(parseFloat(liquidityData.token0Amount)) ||
      !liquidityData.token1Amount ||
      isNaN(parseFloat(liquidityData.token1Amount))
    ) {
      setError("Please enter valid amounts for both tokens");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    try {
      const signer = await signerPromise;
      if (!signer) {
        setError("No signer available");
        setLoading(false);
        return;
      }

      // Initialize the contract
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contractAbi,
        signer
      );

      // Get contract token addresses
      const contractToken0Address = await contract.token0();
      const contractToken1Address = await contract.token1();

      console.log("Token addresses:", {
        contract: {
          token0: contractToken0Address,
          token1: contractToken1Address,
        },
        config: {
          token0: CONTRACT_ADDRESSES.TOKEN0,
          token1: CONTRACT_ADDRESSES.TOKEN1,
        },
      });

      // Get token contracts
      const token0Contract = new ethers.Contract(
        contractToken0Address,
        USDC_ABI.abi, // Using as generic ERC20 ABI
        signer
      );

      const token1Contract = new ethers.Contract(
        contractToken1Address,
        ABYTKN_ABI.abi, // Using as generic ERC20 ABI
        signer
      );

      // Get token details
      const token0Symbol = await token0Contract.symbol();
      const token1Symbol = await token1Contract.symbol();
      const token0Decimals = await token0Contract.decimals();
      const token1Decimals = await token1Contract.decimals();

      console.log("Token details:", {
        token0: {
          address: contractToken0Address,
          symbol: token0Symbol,
          decimals: token0Decimals,
        },
        token1: {
          address: contractToken1Address,
          symbol: token1Symbol,
          decimals: token1Decimals,
        },
      });

      // Determine which token is which in contract vs UI
      const token0IsUsdc =
        contractToken0Address.toLowerCase() ===
        CONTRACT_ADDRESSES.TOKEN0.toLowerCase();

      // Prepare the amounts based on token order
      let amount0Desired, amount1Desired;
      if (token0IsUsdc) {
        amount0Desired = ethers.parseUnits(
          liquidityData.token0Amount.toString(),
          token0Decimals
        );
        amount1Desired = ethers.parseUnits(
          liquidityData.token1Amount.toString(),
          token1Decimals
        );
      } else {
        amount0Desired = ethers.parseUnits(
          liquidityData.token1Amount.toString(),
          token0Decimals
        );
        amount1Desired = ethers.parseUnits(
          liquidityData.token0Amount.toString(),
          token1Decimals
        );
      }

      console.log("Liquidity amounts:", {
        amount0: {
          token: token0Symbol,
          value: ethers.formatUnits(amount0Desired, token0Decimals),
        },
        amount1: {
          token: token1Symbol,
          value: ethers.formatUnits(amount1Desired, token1Decimals),
        },
      });

      // Check balances
      const balance0 = await token0Contract.balanceOf(address);
      const balance1 = await token1Contract.balanceOf(address);

      console.log("Current balances:", {
        [token0Symbol]: ethers.formatUnits(balance0, token0Decimals),
        [token1Symbol]: ethers.formatUnits(balance1, token1Decimals),
      });

      // Check if balances are sufficient
      if (balance0 < amount0Desired) {
        setError(`Insufficient ${token0Symbol} balance`);
        setLoading(false);
        return;
      }

      if (balance1 < amount1Desired) {
        setError(`Insufficient ${token1Symbol} balance`);
        setLoading(false);
        return;
      }

      // Check and approve allowances
      const allowance0 = await token0Contract.allowance(
        address,
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT
      );
      const allowance1 = await token1Contract.allowance(
        address,
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT
      );

      console.log("Current allowances:", {
        [token0Symbol]: ethers.formatUnits(allowance0, token0Decimals),
        [token1Symbol]: ethers.formatUnits(allowance1, token1Decimals),
      });

      // Approve token0 if needed
      if (allowance0 < amount0Desired) {
        console.log(`Approving ${token0Symbol}...`);
        const tx0 = await token0Contract.approve(
          CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
          ethers.MaxUint256
        );
        await tx0.wait();
        console.log(`${token0Symbol} approved`);
      }

      // Approve token1 if needed
      if (allowance1 < amount1Desired) {
        console.log(`Approving ${token1Symbol}...`);
        const tx1 = await token1Contract.approve(
          CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
          ethers.MaxUint256
        );
        await tx1.wait();
        console.log(`${token1Symbol} approved`);
      }

      // Add liquidity
      console.log("Adding liquidity...");

      // Try to estimate gas first
      try {
        const gasEstimate = await contract.estimateGas.addLiquidity(
          amount0Desired,
          amount1Desired
        );
        console.log("Gas estimate:", gasEstimate.toString());

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * 120n) / 100n;

        const tx = await contract.addLiquidity(amount0Desired, amount1Desired, {
          gasLimit: gasLimit,
        });

        setTxHash(tx.hash);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 1) {
          setSuccess("Liquidity added successfully!");
          setLiquidityData({
            token0Amount: "",
            token1Amount: "",
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
        const tx = await contract.addLiquidity(amount0Desired, amount1Desired, {
          gasLimit: 1500000, // Set high fixed gas limit
        });

        setTxHash(tx.hash);
        console.log("Transaction sent with fixed gas limit:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 1) {
          setSuccess("Liquidity added successfully!");
          setLiquidityData({
            token0Amount: "",
            token1Amount: "",
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

          // Try to extract more information from the error
          if (error.data) {
            errorMsg += ` - ${error.data}`;
          } else if (error.error && error.error.data) {
            errorMsg += ` - ${error.error.data}`;
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
