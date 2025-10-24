import { useState, useEffect } from "react";
import { ArrowDownUp, Activity, Settings } from "lucide-react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { ethers } from "ethers";
import CONTRACT_ABI from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import USDC_ABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import ABYTKN_ABI from "../../artifacts/fakeLiquidityArtifacts/ABYATKN.sol/ABYATKN.json";
import { useActiveAccount } from "thirdweb/react";
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

// Constants - Aligned with our configuration
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_SEPOLIA_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_ADDRESS, // ABYTKN
    TOKEN1: import.meta.env.VITE_APP_SEPOLIA_USDC_ADDRESS, // USDC
    UNISWAP_POOL: import.meta.env.VITE_APP_SEPOLIA_ABYATKN_USDC_500,
  },
  CHAIN: defineChain(11155111), // Sepolia
};

const SwapComponent = () => {
  const [activeTab, setActiveTab] = useState("swap");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const {
    transactions,
    loading: historyLoading,
    refreshHistory,
    loadBalances,
    calculateOutputAmount,
    loadPoolInfo,
    balances,
    poolInfo,
    isLoadingPrice,
    isInitialRatio,
    poolPrice,
    fetchPoolPrice,
  } = useTransactionHistory();

  console.log("Transactions:", transactions);

  // Slippage settings
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");

  // Swap state - using clear token names
  const [swapData, setSwapData] = useState({
    inputAmount: "",
    outputAmount: "",
    inputTokenSymbol: "ABYTKN", // Default to ABYTKN
    outputTokenSymbol: "USDC", // Default to USDC
    priceImpact: 0,
    minimumReceived: "0",
  });

  // Update output amount when input changes
  useEffect(() => {
    const updateOutputAmount = async () => {
      if (
        swapData.inputAmount &&
        parseFloat(swapData.inputAmount) > 0 &&
        swapData.inputTokenSymbol !== swapData.outputTokenSymbol
      ) {
        try {
          const result = await calculateOutputAmount(
            swapData.inputAmount,
            swapData.inputTokenSymbol,
            swapData.outputTokenSymbol
          );

          if (result) {
            setSwapData((prev) => ({
              ...prev,
              outputAmount: result.output,
              priceImpact: result.impact,
              minimumReceived: result.minReceived,
            }));
          }
        } catch (error) {
          console.error("Error calculating output amount:", error);
          setSwapData((prev) => ({
            ...prev,
            outputAmount: "0",
            priceImpact: 0,
            minimumReceived: "0",
          }));
        }
      } else {
        setSwapData((prev) => ({
          ...prev,
          outputAmount: "0",
          priceImpact: 0,
          minimumReceived: "0",
        }));
      }
    };

    updateOutputAmount();
  }, [
    swapData.inputAmount,
    swapData.inputTokenSymbol,
    swapData.outputTokenSymbol,
    calculateOutputAmount,
  ]);

  // Update useEffect to use stable references
  useEffect(() => {
    if (isConnected) {
      loadBalances();
      loadPoolInfo();
      fetchPoolPrice();
      const interval = setInterval(() => {
        loadBalances();
        loadPoolInfo();
        fetchPoolPrice();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, address, loadBalances, loadPoolInfo, fetchPoolPrice]);

  // Handle swap
  const handleSwap = async () => {
    console.log("Swap Data:", swapData);

    // Validate required fields
    if (!swapData.inputAmount || parseFloat(swapData.inputAmount) <= 0) {
      setError("Please enter a valid input amount");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!swapData.outputAmount || parseFloat(swapData.outputAmount) <= 0) {
      setError("Please wait for output amount calculation");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!address) {
      setError("Wallet not connected");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Determine token addresses based on symbols
      const inputTokenAddress =
        swapData.inputTokenSymbol === "ABYTKN"
          ? CONTRACT_CONFIG.ADDRESSES.TOKEN0
          : CONTRACT_CONFIG.ADDRESSES.TOKEN1;

      const outputTokenAddress =
        swapData.outputTokenSymbol === "ABYTKN"
          ? CONTRACT_CONFIG.ADDRESSES.TOKEN0
          : CONTRACT_CONFIG.ADDRESSES.TOKEN1;

      const amountToSwap = ethers.parseUnits(swapData.inputAmount, 18);

      // Initialize input token contract
      const inputTokenAbi =
        swapData.inputTokenSymbol === "USDC" ? usdcAbi : abyatknAbi;
      const inputTokenContract = getContract({
        address: inputTokenAddress,
        abi: inputTokenAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      // Check balance
      const balance = await readContract({
        contract: inputTokenContract,
        method: "balanceOf",
        params: [address],
      });

      if (balance < amountToSwap) {
        setError(`Insufficient ${swapData.inputTokenSymbol} balance`);
        setLoading(false);
        return;
      }

      console.log("Balance check passed:", {
        token: swapData.inputTokenSymbol,
        balance: ethers.formatUnits(balance, 18),
        required: swapData.inputAmount,
      });

      // Check and approve allowance
      const allowance = await readContract({
        contract: inputTokenContract,
        method: "allowance",
        params: [address, CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT],
      });

      console.log("Current allowance:", {
        token: swapData.inputTokenSymbol,
        allowance: ethers.formatUnits(allowance, 18),
        required: ethers.formatUnits(amountToSwap, 18),
      });

      if (allowance < amountToSwap) {
        console.log(`Approving ${swapData.inputTokenSymbol}...`);

        const approveTx = prepareContractCall({
          contract: inputTokenContract,
          method: "approve",
          params: [
            CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
            ethers.MaxUint256,
          ],
        });

        const approveResult = await sendTransaction(approveTx);
        console.log("Approval transaction:", approveResult.transactionHash);

        // Wait for approval to be confirmed
        await approveResult.wait();
        console.log(`${swapData.inputTokenSymbol} approved successfully`);
      }

      // Initialize swap contract
      const swapContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        abi: contractAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      // Perform swap
      console.log("Executing swap...", {
        inputToken: inputTokenAddress,
        outputToken: outputTokenAddress,
        amountIn: amountToSwap.toString(),
        inputSymbol: swapData.inputTokenSymbol,
        outputSymbol: swapData.outputTokenSymbol,
      });

      const swapTx = prepareContractCall({
        contract: swapContract,
        method: "swapExactInputSingle",
        params: [inputTokenAddress, outputTokenAddress, amountToSwap],
      });

      const swapResult = await sendTransaction(swapTx);
      setTxHash(swapResult.transactionHash);

      console.log("Swap transaction sent:", swapResult.transactionHash);

      // Wait for transaction confirmation
      const receipt = await swapResult.wait();
      console.log("Swap transaction confirmed:", receipt);

      if (receipt.status === 1) {
        setSuccess(
          `Successfully swapped ${swapData.inputAmount} ${swapData.inputTokenSymbol} for ${swapData.outputAmount} ${swapData.outputTokenSymbol}!`
        );

        // Reset form
        setSwapData({
          inputAmount: "",
          outputAmount: "",
          inputTokenSymbol: swapData.inputTokenSymbol,
          outputTokenSymbol: swapData.outputTokenSymbol,
          priceImpact: 0,
          minimumReceived: "0",
        });

        // Refresh data
        loadBalances();
        if (typeof refreshHistory === "function") {
          refreshHistory();
        }
      } else {
        setError("Swap transaction failed");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      let errorMessage = "Swap failed";

      if (error.message.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Contract execution reverted";
        // Try to extract revert reason
        if (error.data) {
          errorMessage += `: ${error.data}`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
        setTxHash("");
      }, 5000);
    }
  };

  // Swap input/output tokens
  const swapTokens = () => {
    setSwapData((prev) => ({
      ...prev,
      inputTokenSymbol: prev.outputTokenSymbol,
      outputTokenSymbol: prev.inputTokenSymbol,
      inputAmount: prev.outputAmount,
      outputAmount: prev.inputAmount,
    }));
  };

  // Set max balance for input token
  const setMaxBalance = () => {
    const balance = balances[swapData.inputTokenSymbol];
    if (balance && parseFloat(balance) > 0) {
      setSwapData((prev) => ({
        ...prev,
        inputAmount: balance,
      }));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Transaction Settings
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Slippage Tolerance
              </label>
              <div className="flex gap-2 mb-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippageTolerance(value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      slippageTolerance === value
                        ? "bg-yellow-500 text-white"
                        : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    if (e.target.value)
                      setSlippageTolerance(parseFloat(e.target.value));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <Settings
              size={20}
              className="text-gray-600 dark:text-gray-400 group-hover:text-yellow-500"
            />
          </button>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              From
            </label>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Balance: {balances[swapData.inputTokenSymbol]}
                </span>
                <button
                  onClick={() => setMaxBalance(swapData.inputTokenSymbol)}
                  className="text-xs bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-500/20 transition-colors font-medium"
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
              value={swapData.inputAmount}
              onChange={(e) =>
                setSwapData({
                  ...swapData,
                  inputAmount: e.target.value,
                })
              }
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-32 text-gray-900 dark:text-gray-100"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <select
                value={swapData.inputTokenSymbol}
                onChange={(e) => {
                  const symbol = e.target.value;
                  setSwapData({
                    ...swapData,
                    inputTokenSymbol: symbol,
                    inputToken:
                      symbol === "TOKEN0"
                        ? CONTRACT_ADDRESSES.TOKEN0
                        : CONTRACT_ADDRESSES.TOKEN1,
                  });
                }}
                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-gray-100"
              >
                <option value="TOKEN0">TOKEN0(USDC)</option>
                <option value="TOKEN1">TOKEN1(ABYTKN)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapTokens}
            className="p-3 bg-yellow-100 dark:bg-yellow-500/10 hover:bg-yellow-200 dark:hover:bg-yellow-500/20 rounded-full transition-all duration-200 hover:scale-110 group"
          >
            <ArrowDownUp
              size={20}
              className="text-yellow-600 dark:text-yellow-400 group-hover:rotate-180 transition-transform duration-300"
            />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              To
            </label>
            {isConnected && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Balance: {balances[swapData.outputTokenSymbol]}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="0.0"
              value={swapData?.outputAmount}
              readOnly
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-500 dark:text-gray-400 pr-32 cursor-not-allowed"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <select
                value={swapData?.outputTokenSymbol}
                onChange={(e) => {
                  const symbol = e.target.value;
                  setSwapData({
                    ...swapData,
                    outputTokenSymbol: symbol,
                    outputToken:
                      symbol === "TOKEN0"
                        ? CONTRACT_ADDRESSES.TOKEN0
                        : CONTRACT_ADDRESSES.TOKEN1,
                  });
                }}
                className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-gray-100"
              >
                <option value="TOKEN1">TOKEN1(ABYTKN)</option>
                <option value="TOKEN0">TOKEN0(USDC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {swapData.inputAmount && parseFloat(swapData.inputAmount) > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Price Impact
              </span>
              <span
                className={`font-medium ${
                  swapData.priceImpact > 3
                    ? "text-red-600 dark:text-red-400"
                    : swapData.priceImpact > 1
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {swapData?.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Minimum Received
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {swapData.minimumReceived} {swapData.outputTokenSymbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Slippage Tolerance
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {slippageTolerance}%
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!isConnected || loading || !swapData.inputAmount}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <>
              <Activity className="animate-spin" size={20} />
              Swapping...
            </>
          ) : (
            <>
              <ArrowDownUp size={20} />
              Swap Tokens
            </>
          )}
        </button>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {txHash && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                Transaction Hash: {txHash}
              </span>
            </div>
          </div>
        )}
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
export default SwapComponent;
