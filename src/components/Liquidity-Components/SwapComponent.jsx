import { useState, useEffect } from "react";
import {
  ArrowDownUp,
  Settings,
  ChevronDown,
  Loader,
  Info,
  TrendingUp,
  RefreshCw,
  Wallet,
  Zap,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";
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
import { useDarkMode } from "../../contexts/themeContext";
import { toast } from "react-toastify";
import CONTRACT_ADDRESSES from "../../constants/addresses";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

// Constants - Aligned with our configuration
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: CONTRACT_ADDRESSES.Liquidity,
    TOKEN0: CONTRACT_ADDRESSES.ABYTKN, // ABYTKN
    TOKEN1: CONTRACT_ADDRESSES.USDC, // USDC
    UNISWAP_POOL: CONTRACT_ADDRESSES.ABYTKN_USDC_POOL,
  },
  CHAIN: defineChain(11155111), // Sepolia
};

// Token configuration
const TOKENS = {
  ABYTKN: {
    symbol: "ABYTKN",
    name: "ABYA Token",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN0,
    decimals: 18,
    icon: "/icons/abytkn.svg",
    color: "from-yellow-500 to-amber-500",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN1,
    decimals: 6,
    icon: "/icons/usdc.svg",
    color: "from-blue-500 to-cyan-500",
  },
};

const SwapComponent = () => {
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [calculatingOutput, setCalculatingOutput] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState(null); // 'from' or 'to'
  const [showDetails, setShowDetails] = useState(false);

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

  // Slippage settings
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [slippagePresets] = useState([0.1, 0.5, 1.0]);

  // Swap state
  const [swapData, setSwapData] = useState({
    inputAmount: "",
    outputAmount: "",
    inputToken: TOKENS.ABYTKN,
    outputToken: TOKENS.USDC,
    priceImpact: 0,
    minimumReceived: "0",
    route: [],
  });

  // Format raw balance for display (balances from context are already formatted)
  const formatBalance = (balance, tokenSymbol) => {
    if (!balance || balance === "0.0" || balance === "0") return "0";

    try {
      // Balances from context are already formatted (e.g., "2989000.000000000000007993")
      const num = parseFloat(balance);
      if (isNaN(num)) return "0";

      if (num >= 1000) {
        return num.toLocaleString(undefined, {
          maximumFractionDigits: 4,
          minimumFractionDigits: 0,
        });
      }
      return num.toLocaleString(undefined, {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0,
      });
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0";
    }
  };

  // Format raw output amount for display (outputAmount is raw with decimals)
  const formatRawOutput = (rawAmount, tokenSymbol) => {
    if (!rawAmount || rawAmount === "0" || rawAmount === "0.0") return "0.0";

    try {
      const decimals = tokenSymbol === "ABYTKN" ? 18 : 6;
      // Use ethers to format the raw amount
      const formatted = ethers.formatUnits(rawAmount, decimals);
      const num = parseFloat(formatted);

      if (num >= 1000) {
        return num.toLocaleString(undefined, {
          maximumFractionDigits: 4,
          minimumFractionDigits: 0,
        });
      }
      if (num < 0.000001 && num > 0) {
        return num.toExponential(4);
      }
      return num.toLocaleString(undefined, {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0,
      });
    } catch (error) {
      console.error("Error formatting raw output:", error);
      return "0.0";
    }
  };

  // Format amount for display (small numbers)
  const formatDisplayAmount = (value) => {
    if (!value || value === "0" || value === "0.0") return "0";

    try {
      const num = parseFloat(value);
      if (isNaN(num)) return "0";

      if (num > 0 && num < 0.000001) {
        return num.toExponential(4);
      }
      if (num >= 1000) {
        return num.toLocaleString(undefined, {
          maximumFractionDigits: 4,
          minimumFractionDigits: 0,
        });
      }
      return num.toLocaleString(undefined, {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0,
      });
    } catch {
      return "0";
    }
  };

  // Update output amount when input changes
  useEffect(() => {
    const updateOutputAmount = async () => {
      if (
        swapData.inputAmount &&
        parseFloat(swapData.inputAmount) > 0 &&
        swapData.inputToken.symbol !== swapData.outputToken.symbol
      ) {
        setCalculatingOutput(true);
        try {
          const result = await calculateOutputAmount(
            swapData.inputAmount,
            swapData.inputToken.symbol,
            swapData.outputToken.symbol,
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
          toast.error("Failed to calculate output amount");
          setSwapData((prev) => ({
            ...prev,
            outputAmount: "0",
            priceImpact: 0,
            minimumReceived: "0",
          }));
        } finally {
          setCalculatingOutput(false);
        }
      } else {
        setSwapData((prev) => ({
          ...prev,
          outputAmount: "0",
          priceImpact: 0,
          minimumReceived: "0",
        }));
        setCalculatingOutput(false);
      }
    };

    const debounceTimer = setTimeout(updateOutputAmount, 300);
    return () => clearTimeout(debounceTimer);
  }, [
    swapData.inputAmount,
    swapData.inputToken,
    swapData.outputToken,
    calculateOutputAmount,
  ]);

  // Refresh data periodically
  useEffect(() => {
    if (isConnected) {
      loadBalances();
      loadPoolInfo();
      fetchPoolPrice();
      const interval = setInterval(() => {
        loadBalances();
        loadPoolInfo();
        fetchPoolPrice();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isConnected, address, loadBalances, loadPoolInfo, fetchPoolPrice]);

  // Handle swap
  const handleSwap = async () => {
    if (!swapData.inputAmount || parseFloat(swapData.inputAmount) <= 0) {
      toast.error("Please enter a valid input amount");
      return;
    }

    if (!swapData.outputAmount || swapData.outputAmount === "0") {
      toast.error("Please wait for output amount calculation to complete");
      return;
    }

    if (calculatingOutput) {
      toast.warning("Still calculating output amount. Please wait...");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet to continue");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Preparing swap transaction...");

    try {
      const inputTokenAddress = swapData.inputToken.address;
      const outputTokenAddress = swapData.outputToken.address;
      const amountToSwap = ethers.parseUnits(
        swapData.inputAmount,
        swapData.inputToken.decimals,
      );

      // Initialize input token contract
      const inputTokenAbi =
        swapData.inputToken.symbol === "USDC" ? usdcAbi : abyatknAbi;
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
        toast.update(toastId, {
          render: `Insufficient ${
            swapData.inputToken.symbol
          } balance. You have ${ethers.formatUnits(
            balance,
            swapData.inputToken.decimals,
          )} but need ${swapData.inputAmount}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        setLoading(false);
        return;
      }

      // Check and approve allowance
      toast.update(toastId, {
        render: "Checking token approval...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      const allowance = await readContract({
        contract: inputTokenContract,
        method: "allowance",
        params: [address, CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT],
      });

      if (allowance < amountToSwap) {
        toast.update(toastId, {
          render: "Approving token for swap...",
          type: "info",
          isLoading: true,
          autoClose: false,
        });

        const approveTx = prepareContractCall({
          contract: inputTokenContract,
          method: "approve",
          params: [
            CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
            ethers.MaxUint256,
          ],
        });

        const approveResult = await sendTransaction({
          transaction: approveTx,
          account,
        });

        toast.update(toastId, {
          render: `Token approved! Hash: ${approveResult.transactionHash.slice(
            0,
            10,
          )}...`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        toast.update(toastId, {
          render: "Executing swap transaction...",
          type: "info",
          isLoading: true,
          autoClose: false,
        });
      }

      // Execute swap
      const swapContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.ADD_SWAP_CONTRACT,
        abi: contractAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const swapTx = prepareContractCall({
        contract: swapContract,
        method: "swapExactInputSingle",
        params: [inputTokenAddress, outputTokenAddress, amountToSwap],
      });

      console.log("Swap details:", {
        inputToken: swapData.inputToken.symbol,
        inputAmount: swapData.inputAmount,
        inputDecimals: swapData.inputToken.decimals,
        parsedInputAmount: amountToSwap.toString(),
        expectedOutputToken: swapData.outputToken.symbol,
        expectedOutputRaw: swapData.outputAmount,
        expectedOutputDisplay: ethers.formatUnits(
          swapData.outputAmount,
          swapData.outputToken.symbol === "ABYTKN" ? 18 : 6,
        ),
      });

      const swapResult = await sendTransaction({
        transaction: swapTx,
        account,
      });
      setTxHash(swapResult.transactionHash);

      console.log("Swap result:", swapResult);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await loadBalances();
      console.log("New balances:", balances);

      toast.update(toastId, {
        render: (
          <div className="space-y-2">
            <p>
              ✅ Successfully swapped {swapData.inputAmount}{" "}
              {swapData.inputToken.symbol} for{" "}
              {ethers.formatUnits(
                swapData.outputAmount,
                swapData.outputToken.symbol === "ABYTKN" ? 18 : 6,
              )}{" "}
              {swapData.outputToken.symbol}
            </p>
            <p className="text-xs opacity-75">
              Hash: {swapResult.transactionHash.slice(0, 10)}...
              {swapResult.transactionHash.slice(-8)}
            </p>
          </div>
        ),
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      // Reset form
      setSwapData((prev) => ({
        ...prev,
        inputAmount: "",
        outputAmount: "",
        priceImpact: 0,
        minimumReceived: "0",
      }));

      await loadBalances();
      await loadPoolInfo();
      await fetchPoolPrice();
    } catch (error) {
      console.error("Swap failed:", error);
      let errorMessage = "Swap transaction failed";

      if (error.message.includes("user rejected")) {
        errorMessage = "❌ Transaction rejected by user";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "❌ Insufficient funds for gas";
      } else if (error.message.includes("insufficient balance")) {
        errorMessage = `❌ Insufficient ${swapData.inputToken.symbol} balance`;
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "❌ Contract execution reverted";
        if (error.data) {
          errorMessage += `: ${error.data}`;
        }
      } else if (error.message.includes("SlippageTolerance exceeded")) {
        errorMessage = `❌ Slippage tolerance exceeded. Increase your slippage tolerance above ${slippageTolerance}%`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Swap tokens
  const swapTokens = () => {
    setSwapData((prev) => {
      // When swapping, we need to convert the output amount back to input
      // The output amount is raw, so we need to format it for the new input
      let newInputAmount = "";
      if (prev.outputAmount && prev.outputAmount !== "0") {
        const decimals = prev.outputToken.symbol === "ABYTKN" ? 18 : 6;
        newInputAmount = ethers.formatUnits(prev.outputAmount, decimals);
      }

      return {
        ...prev,
        inputToken: prev.outputToken,
        outputToken: prev.inputToken,
        inputAmount: newInputAmount,
        outputAmount: prev.inputAmount
          ? ethers
              .parseUnits(prev.inputAmount, prev.inputToken.decimals)
              .toString()
          : "0",
      };
    });
  };

  // Set max balance
  const setMaxBalance = () => {
    const balance = balances[swapData.inputToken.symbol];
    if (balance && parseFloat(balance) > 0) {
      setSwapData((prev) => ({
        ...prev,
        inputAmount: balance,
      }));
    }
  };

  // Get price impact color
  const getPriceImpactColor = (impact) => {
    if (impact > 5) return "text-red-600 dark:text-red-400";
    if (impact > 2) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-slate-800/50 border-slate-700/50"
    : "bg-white/50 border-slate-200/50";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <div className="space-y-4">
      {/* Settings Panel */}
      {showSettings && (
        <div
          className={`rounded-xl border p-4 animate-slideDown ${glassCardStyle}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Transaction Settings
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Slippage Tolerance
            </label>
            <div className="flex gap-2 mb-2">
              {slippagePresets.map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippageTolerance(value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    slippageTolerance === value
                      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25"
                      : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
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
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Swap Interface */}
      <div className={`rounded-2xl border p-6 ${cardStyle}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold">Swap Tokens</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Best rates with minimal slippage
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-all ${
              showSettings
                ? "bg-yellow-500/20 text-yellow-600"
                : "hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              From
            </label>
            {isConnected && (
              <button
                onClick={setMaxBalance}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline flex items-center gap-1"
              >
                <Wallet className="w-3 h-3" />
                Balance:{" "}
                {formatBalance(
                  balances[swapData.inputToken.symbol],
                  swapData.inputToken.symbol,
                )}
              </button>
            )}
          </div>

          <div className="relative group">
            <input
              type="number"
              placeholder="0.0"
              value={swapData.inputAmount}
              onChange={(e) =>
                setSwapData({ ...swapData, inputAmount: e.target.value })
              }
              className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-xl text-xl font-semibold focus:outline-none focus:border-yellow-500/50 pr-56 transition-all"
            />

            {/* Token Selector */}
            <button
              onClick={() => setShowTokenSelect("from")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${swapData.inputToken.color}`}
              />
              <span className="font-semibold">
                {swapData.inputToken.symbol}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Max Button */}
            <button
              onClick={setMaxBalance}
              className="absolute right-48 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-colors"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="relative flex justify-center my-2">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={swapTokens}
            className="relative p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full hover:border-yellow-500 transition-all group"
          >
            <ArrowDownUp
              size={18}
              className="text-slate-400 group-hover:text-yellow-500 group-hover:rotate-180 transition-all duration-300"
            />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              To
            </label>
            {isConnected && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                Balance:{" "}
                {formatBalance(
                  balances[swapData.outputToken.symbol],
                  swapData.outputToken.symbol,
                )}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="0.0"
              value={
                calculatingOutput
                  ? "Calculating..."
                  : swapData.outputAmount && swapData.outputAmount !== "0"
                  ? formatRawOutput(
                      swapData.outputAmount,
                      swapData.outputToken.symbol,
                    )
                  : "0.0"
              }
              readOnly
              className={`w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xl font-semibold pr-36 cursor-not-allowed transition-colors ${
                calculatingOutput
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />

            {calculatingOutput && (
              <div className="absolute right-40 top-1/2 -translate-y-1/2">
                <Loader className="w-5 h-5 animate-spin text-yellow-500" />
              </div>
            )}

            <button
              onClick={() => setShowTokenSelect("to")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${swapData.outputToken.color}`}
              />
              <span className="font-semibold">
                {swapData.outputToken.symbol}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Swap Details */}
        {swapData.inputAmount && parseFloat(swapData.inputAmount) > 0 && (
          <div className={`mt-4 rounded-xl border p-4 ${glassCardStyle}`}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-sm"
            >
              <span className="font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                Swap Details
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Rate
                  </span>
                  <span className="font-medium">
                    1 {swapData.inputToken.symbol} = {poolPrice || "0.00"}{" "}
                    {swapData.outputToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Price Impact
                  </span>
                  <span
                    className={`font-medium ${getPriceImpactColor(
                      swapData.priceImpact,
                    )}`}
                  >
                    {swapData.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Minimum Received
                  </span>
                  <span className="font-medium">
                    {swapData.minimumReceived &&
                    swapData.minimumReceived !== "0"
                      ? formatRawOutput(
                          swapData.minimumReceived,
                          swapData.outputToken.symbol,
                        )
                      : "0"}{" "}
                    {swapData.outputToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Slippage Tolerance
                  </span>
                  <span className="font-medium">{slippageTolerance}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Route
                  </span>
                  <span className="font-medium flex items-center gap-1">
                    {swapData.inputToken.symbol}{" "}
                    <ArrowRight className="w-3 h-3" />{" "}
                    {swapData.outputToken.symbol}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={
            !isConnected ||
            loading ||
            calculatingOutput ||
            !swapData.inputAmount ||
            parseFloat(swapData.inputAmount) <= 0
          }
          className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={18} />
              Swapping...
            </>
          ) : calculatingOutput ? (
            <>
              <Loader className="animate-spin" size={18} />
              Calculating Output...
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !swapData.inputAmount || parseFloat(swapData.inputAmount) <= 0 ? (
            "Enter Amount"
          ) : (
            <>
              <Zap size={18} />
              Swap
            </>
          )}
        </button>
      </div>

      {/* Token Select Modal */}
      {showTokenSelect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-md w-full rounded-2xl border shadow-2xl overflow-hidden ${glassCardStyle}`}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Select a token</h3>
                <button
                  onClick={() => setShowTokenSelect(null)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {Object.values(TOKENS).map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    if (showTokenSelect === "from") {
                      setSwapData((prev) => ({
                        ...prev,
                        inputToken: token,
                        inputAmount: "",
                      }));
                    } else {
                      setSwapData((prev) => ({
                        ...prev,
                        outputToken: token,
                        outputAmount: "",
                      }));
                    }
                    setShowTokenSelect(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${token.color}`}
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {token.name}
                    </p>
                  </div>
                  {isConnected && (
                    <span className="text-sm font-medium">
                      {formatBalance(balances[token.symbol], token.symbol)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapComponent;
