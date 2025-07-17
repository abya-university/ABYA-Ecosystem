import React, { useState, useEffect } from "react";
import { ArrowDownUp, Activity, Settings } from "lucide-react";
import { useEthersSigner } from "../../components/useClientSigner";
import { useAccount } from "wagmi";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";

import { ethers } from "ethers";
import USDC_ABI from "../../artifacts/fake-liquidity-abis/usdc.json";
import ABYTKN_ABI from "../../artifacts/fake-liquidity-abis/abyatkn.json";

import CONTRACT_ABI from "../../artifacts/fake-liquidity-abis/add_swap_contract.json";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

const SwapComponent = () => {
  const [activeTab, setActiveTab] = useState("swap");
  const [loadingg, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const signerPromise = useEthersSigner();
  const { isConnected, address } = useAccount();
  const {
    transactions,
    loading,
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

  // Swap state
  const [swapData, setSwapData] = useState({
    inputToken: "",
    outputToken: "",
    inputAmount: "",
    outputAmount: "",
    inputTokenSymbol: "TOKEN0",
    outputTokenSymbol: "TOKEN1",
    priceImpact: 0,
    minimumReceived: "0",
  });

  // Contract addresses
  const CONTRACT_ADDRESSES = {
    ADD_SWAP_CONTRACT: import.meta.env.VITE_APP_ADD_SWAP_CONTRACT,
    TOKEN0: import.meta.env.VITE_APP_USDC_ADDRESS, // USDC
    TOKEN1: import.meta.env.VITE_APP_ABYATKN_ADDRESS, // ABYTKN
    UNISWAP_POOL: import.meta.env.VITE_APP_ABYATKN_USDC_500, // Uniswap pool address
  };

  // Update output amount when input changes
  useEffect(() => {
    const updateOutputAmount = async () => {
      if (
        swapData.inputAmount &&
        swapData.inputTokenSymbol !== swapData.outputTokenSymbol
      ) {
        const result = await calculateOutputAmount(
          swapData.inputAmount,
          swapData.inputTokenSymbol,
          swapData.outputTokenSymbol
        );

        setSwapData((prev) => ({
          ...prev,
          outputAmount: result.output,
          priceImpact: result.impact,
          minimumReceived: result.minReceived,
        }));
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
    slippageTolerance,
  ]);

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

  // Handle swap
  const handleSwap = async () => {
    console.log("Swap Data:", swapData);

    // Validate required fields using symbols
    if (
      !swapData.inputAmount ||
      !swapData.inputTokenSymbol ||
      !swapData.outputTokenSymbol
    ) {
      setError("Please fill in all swap fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Map symbols to token addresses
    const inputToken =
      swapData.inputTokenSymbol === "TOKEN0"
        ? CONTRACT_ADDRESSES.TOKEN0
        : CONTRACT_ADDRESSES.TOKEN1;
    const outputToken =
      swapData.outputTokenSymbol === "TOKEN0"
        ? CONTRACT_ADDRESSES.TOKEN0
        : CONTRACT_ADDRESSES.TOKEN1;

    setLoading(true);

    try {
      const signer = await signerPromise;
      if (!signer) return;

      const amountToSwap = ethers.parseUnits(swapData.inputAmount, 18);

      // First approve the input token
      const inputTokenAbi =
        swapData.inputTokenSymbol === "TOKEN0" ? USDC_ABI.abi : ABYTKN_ABI.abi;
      const inputTokenContract = new ethers.Contract(
        inputToken,
        inputTokenAbi,
        signer
      );

      // Check and approve if needed
      const allowance = await inputTokenContract.allowance(
        address,
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT
      );
      // If allowance is less than amount to swap, approve more
      if (allowance < amountToSwap) {
        console.log("Approving tokens for swapping...");

        // Approve a large amount to avoid future approvals
        const MAX_UINT256 = ethers.MaxUint256;

        try {
          const approveTx = await inputTokenContract.approve(
            CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
            MAX_UINT256
          );

          console.log("Approval transaction sent:", approveTx.hash);
          await approveTx.wait();
          console.log("Token approved successfully");

          // Check allowance after approval
          const newAllowance = await inputTokenContract.allowance(
            address,
            CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT
          );
          console.log("New allowance:", ethers.formatUnits(newAllowance, 18));
        } catch (approvalError) {
          console.error("Approval failed:", approvalError);
          setError("Failed to approve token: " + approvalError.message);
          setLoading(false);
          return;
        }
      }

      // Then perform the swap
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.ADD_SWAP_CONTRACT,
        contractAbi,
        signer
      );

      const balance = await inputTokenContract.balanceOf(address);
      if (balance < amountToSwap) {
        setError(`Insufficient ${swapData.inputTokenSymbol} balance`);
        setLoading(false);
        return;
      }

      // Try to estimate gas first to catch errors early
      // try {
      //   const gasEstimate = await contract.estimateGas.swapExactInputSingle(
      //     inputToken,
      //     outputToken,
      //     amountToSwap
      //   );
      //   console.log("Gas estimate:", gasEstimate.toString());
      // } catch (gasError) {
      //   console.error("Gas estimation error:", gasError);
      //   // Continue anyway, we'll handle errors in the main try/catch
      // }

      const tx = await contract.swapExactInputSingle(
        inputToken,
        outputToken,
        amountToSwap
      );

      setTxHash(tx.hash);
      await tx.wait();

      // try {
      //   // Assume the contract has a function called recordTransaction
      //   const recordTxResponse = await contract.addTransactionToHistory(
      //     TRANSACTION_TYPES.SWAP, // transaction type
      //     swapData.inputTokenSymbol, // token0 symbol
      //     swapData.outputTokenSymbol, // token1 symbol
      //     amountToSwap, // token0 amount (parsed for blockchain)
      //     swapData.outputAmount, // token1 amount (parsed for blockchain)
      //     tx.hash // transaction hash
      //   );

      //   await recordTxResponse.wait();
      //   console.log(
      //     "Transaction recorded on blockchain:",
      //     recordTxResponse.hash
      //   );
      //   refreshHistory();
      // } catch (recordError) {
      //   console.error(
      //     "Failed to record transaction on blockchain:",
      //     recordError
      //   );
      //   setSuccess("Swap completed successfully!");
      // }

      setSwapData({ ...swapData, inputAmount: "", outputAmount: "0" });
      loadBalances();
    } catch (error) {
      setError("Swap failed: " + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
        setTxHash("");
      }, 5000);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchPoolPrice();
    }
  }, [isConnected]);

  // Swap input/output tokens
  const swapTokens = () => {
    setSwapData({
      ...swapData,
      inputToken: swapData.outputToken,
      outputToken: swapData.inputToken,
      inputTokenSymbol: swapData.outputTokenSymbol,
      outputTokenSymbol: swapData.inputTokenSymbol,
      inputAmount: swapData.outputAmount,
      outputAmount: swapData.inputAmount,
    });
  };

  // Set max balance
  const setMaxBalance = (tokenSymbol) => {
    const balance = balances[tokenSymbol];
    if (activeTab === "swap") {
      setSwapData({ ...swapData, inputAmount: balance });
    } else if (activeTab === "liquidity") {
      if (tokenSymbol === "TOKEN0") {
        const maxAmount = balances.TOKEN0;
        handleUSDCAmountChangeWithPoolPrice(maxAmount, poolPrice);
        setLiquidityData({ ...liquidityData, token0Amount: balance });
      } else {
        const maxAmount = balances.TOKEN1;
        handleABYTKNAmountChangeWithPoolPrice(maxAmount, poolPrice);
        setLiquidityData({ ...liquidityData, token1Amount: balance });
      }
    }
  };

  return (
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
        disabled={!isConnected || loadingg || !swapData.inputAmount}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {loadingg ? (
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

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">{success}</span>
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
  );
};
export default SwapComponent;
