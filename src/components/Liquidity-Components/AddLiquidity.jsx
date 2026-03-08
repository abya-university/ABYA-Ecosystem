import { ethers } from "ethers";
import {
  Plus,
  Activity,
  Info,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Settings,
  X,
  ArrowDown,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Droplets,
  Zap,
  Wallet,
  Shield,
  Award,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
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
import { useDarkMode } from "../../contexts/themeContext";
import CONTRACT_ADDRESSES from "../../constants/addresses";

const contractAbi = CONTRACT_ABI.abi;
const usdcAbi = USDC_ABI.abi;
const abyatknAbi = ABYTKN_ABI.abi;

// Constants - Aligned with our context configuration
const CONTRACT_CONFIG = {
  ADDRESSES: {
    ADD_SWAP_CONTRACT: CONTRACT_ADDRESSES.Liquidity,
    TOKEN0: CONTRACT_ADDRESSES.ABYTKN, // ABYTKN (token0)
    TOKEN1: CONTRACT_ADDRESSES.USDC, // USDC (token1)
    UNISWAP_POOL: CONTRACT_ADDRESSES.ABYTKN_USDC_POOL,
  },
  CHAIN: defineChain(11155111), // Sepolia
};

// Token configuration
const TOKENS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN1,
    decimals: 6,
    icon: "/icons/usdc.svg",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
  },
  ABYTKN: {
    symbol: "ABYTKN",
    name: "ABYA Token",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN0,
    decimals: 18,
    icon: "/icons/abytkn.svg",
    color: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/30",
  },
};

const AddLiquidity = () => {
  const { darkMode } = useDarkMode();
  const [txHash, setTxHash] = useState("");
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTokenInput, setActiveTokenInput] = useState(null); // 'usdc' or 'abytkn'

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
    usdcAmount: "", // USDC amount (token1)
    abytknAmount: "", // ABYTKN amount (token0)
  });

  // Settings state
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [slippagePresets] = useState([0.1, 0.5, 1.0]);
  const [deadline, setDeadline] = useState(20); // minutes

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
    if (
      !liquidityData.usdcAmount ||
      isNaN(parseFloat(liquidityData.usdcAmount)) ||
      !liquidityData.abytknAmount ||
      isNaN(parseFloat(liquidityData.abytknAmount))
    ) {
      toast.error("Please enter valid amounts for both tokens");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Adding liquidity...");

    try {
      if (!client || !address) {
        toast.error("No client available or wallet not connected");
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

      // Override decimals based on known token addresses
      // (in case contract returns wrong values)
      const finalAbytknDecimals =
        abytknDecimals === 6 && usdcDecimals === 18
          ? 18 // Standard case
          : 18; // ABYTKN is always 18
      const finalUsdcDecimals =
        usdcDecimals === 18 && abytknDecimals === 6
          ? 6 // Standard case - swap was needed
          : 6; // USDC is always 6

      console.log(
        `Decimals Read - ABYTKN: ${abytknDecimals}, USDC: ${usdcDecimals}`,
      );
      console.log(
        `Decimals Final - ABYTKN: ${finalAbytknDecimals}, USDC: ${finalUsdcDecimals}`,
      );

      // Prepare amounts based on contract token order
      // Contract expects: token0 (ABYTKN), token1 (USDC)
      const amount0Desired = ethers.parseUnits(
        liquidityData.abytknAmount.toString(),
        finalAbytknDecimals,
      );
      const amount1Desired = ethers.parseUnits(
        liquidityData.usdcAmount.toString(),
        finalUsdcDecimals,
      );

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

      // Debug logging
      console.log("ABYTKN Balance:", abytknBalance.toString());
      console.log("Amount0Desired (ABYTKN):", amount0Desired.toString());
      console.log("USDC Balance:", usdcBalance.toString());
      console.log("Amount1Desired (USDC):", amount1Desired.toString());

      // Check if balances are sufficient
      if (abytknBalance < amount0Desired) {
        toast.error(
          `Insufficient ABYTKN balance. Have: ${abytknBalance.toString()}, Need: ${amount0Desired.toString()}`,
        );
        setLoading(false);
        return;
      }

      if (usdcBalance < amount1Desired) {
        toast.error(
          `Insufficient USDC balance. Have: ${usdcBalance.toString()}, Need: ${amount1Desired.toString()}`,
        );
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

      console.log(
        "Allowances before approve - ABYTKN:",
        allowanceABYTKN.toString(),
        "USDC:",
        allowanceUSDC.toString(),
      );

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
        await sendTransaction({ transaction: approveABYTKNTx, account });
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
        await sendTransaction({ transaction: approveUSDCTx, account });
      }

      // Add liquidity
      try {
        // Prepare the transaction
        const addLiquidityTx = prepareContractCall({
          contract,
          method: "addLiquidity",
          params: [amount0Desired, amount1Desired],
        });

        console.log("Sending addLiquidity transaction...");

        const txResult = await sendTransaction({
          transaction: addLiquidityTx,
          account,
        });

        console.log("Transaction result:", txResult);
        setTxHash(txResult.transactionHash);

        // Check if transaction was successful
        if (txResult.transactionHash) {
          toast.update(toastId, {
            render: "Liquidity added successfully!",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          });
          setLiquidityData({
            usdcAmount: "",
            abytknAmount: "",
          });
          loadBalances();
          if (typeof refreshHistory === "function") {
            refreshHistory();
          }
        } else {
          toast.update(toastId, {
            render: "Transaction failed",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
      } catch (gasError) {
        // If transaction fails, try again without gas estimation
        console.log("Transaction failed, retrying...", gasError);
        try {
          const txResult = await sendTransaction({
            transaction: prepareContractCall({
              contract,
              method: "addLiquidity",
              params: [amount0Desired, amount1Desired],
            }),
            account,
          });

          console.log("Retry transaction result:", txResult);
          setTxHash(txResult.transactionHash);

          if (txResult.transactionHash) {
            toast.update(toastId, {
              render: "Liquidity added successfully!",
              type: "success",
              isLoading: false,
              autoClose: 5000,
            });
            setLiquidityData({
              usdcAmount: "",
              abytknAmount: "",
            });
            loadBalances();
            if (typeof refreshHistory === "function") {
              refreshHistory();
            }
          } else {
            toast.update(toastId, {
              render: "Transaction failed",
              type: "error",
              isLoading: false,
              autoClose: 5000,
            });
          }
        } catch (retryError) {
          throw retryError;
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

      toast.update(toastId, {
        render: errorMsg,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Set max balance
  const setMaxBalance = (tokenSymbol) => {
    const balance = balances[tokenSymbol];
    if (tokenSymbol === "USDC") {
      handleUSDCAmountChange(balance);
    } else if (tokenSymbol === "ABYTKN") {
      handleABYTKNAmountChange(balance);
    }
  };

  // Handle USDC amount change
  const handleUSDCAmountChange = (value) => {
    setActiveTokenInput("usdc");
    const newLiquidityData = {
      usdcAmount: value,
      abytknAmount:
        value && poolPrice ? (parseFloat(value) * poolPrice).toFixed(18) : "",
    };
    setLiquidityData(newLiquidityData);
  };

  // Handle ABYTKN amount change
  const handleABYTKNAmountChange = (value) => {
    setActiveTokenInput("abytkn");
    const newLiquidityData = {
      abytknAmount: value,
      usdcAmount:
        value && poolPrice ? (parseFloat(value) / poolPrice).toFixed(6) : "",
    };
    setLiquidityData(newLiquidityData);
  };

  // Calculate ratio validation
  const ratioValidation =
    liquidityData.usdcAmount && liquidityData.abytknAmount
      ? calculateRatioWithPoolPrice?.(
          liquidityData.usdcAmount,
          liquidityData.abytknAmount,
          poolPrice,
        )
      : null;

  const isValidRatio = ratioValidation?.isValidRatio || isInitialRatio;

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

          <div className="space-y-4">
            {/* Slippage Tolerance */}
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

            {/* Transaction Deadline */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Transaction Deadline
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={deadline}
                  onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Liquidity Interface */}
      <div className={`rounded-2xl border p-6 ${cardStyle}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Droplets className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">Add Liquidity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide liquidity to earn trading fees
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={refreshPoolPrice}
              disabled={isLoadingPrice}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh pool price"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingPrice ? "animate-spin" : ""}`}
              />
            </button>
            {/* Settings Button */}
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
        </div>

        {/* Pool Info Card */}
        <div className={`mb-6 rounded-xl border p-4 ${glassCardStyle}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white dark:border-slate-800" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 border-2 border-white dark:border-slate-800" />
              </div>
              <div>
                <p className="font-semibold">ABYTKN / USDC</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fee Tier: 0.05%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Pool Price</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {isLoadingPrice ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${poolPrice.toFixed(4)}`
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ABYTKN per USDC
              </p>
            </div>
          </div>
        </div>

        {/* USDC Input */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Deposit
            </label>
            {isConnected && (
              <button
                onClick={() => setMaxBalance("USDC")}
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline flex items-center gap-1"
              >
                <Wallet className="w-3 h-3" />
                Balance: {balances.USDC || "0.00"}
              </button>
            )}
          </div>

          <div className="relative group">
            <input
              type="number"
              placeholder="0.0"
              value={liquidityData.usdcAmount}
              onChange={(e) => handleUSDCAmountChange(e.target.value)}
              className={`w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border-2 rounded-xl text-xl font-semibold focus:outline-none focus:border-yellow-500/50 pr-36 transition-all ${
                activeTokenInput === "usdc"
                  ? "border-yellow-500/50"
                  : "border-transparent"
              }`}
            />

            {/* Token Selector */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setMaxBalance("USDC")}
                className="px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                MAX
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span className="font-semibold">USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="relative flex justify-center my-2">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-700" />
          <div className="relative p-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full">
            <Plus className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* ABYTKN Input */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              and
            </label>
            {isConnected && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                Balance: {balances.ABYTKN || "0.00"}
              </span>
            )}
          </div>

          <div className="relative group">
            <input
              type="number"
              placeholder="0.0"
              value={liquidityData.abytknAmount}
              onChange={(e) => handleABYTKNAmountChange(e.target.value)}
              className={`w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border-2 rounded-xl text-xl font-semibold focus:outline-none focus:border-yellow-500/50 pr-36 transition-all ${
                activeTokenInput === "abytkn"
                  ? "border-yellow-500/50"
                  : "border-transparent"
              }`}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setMaxBalance("ABYTKN")}
                className="px-2 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 transition-colors"
              >
                MAX
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
                <span className="font-semibold">ABYTKN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratio Validation Display */}
        {liquidityData.usdcAmount && liquidityData.abytknAmount && (
          <div
            className={`mb-6 rounded-xl border p-4 transition-all ${
              isValidRatio
                ? "bg-green-500/5 border-green-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  isValidRatio
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500 animate-pulse"
                }`}
              />
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isValidRatio
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      Your Ratio
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        isValidRatio
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {ratioValidation?.ratio.toFixed(4) || "0.0000"}{" "}
                      ABYTKN/USDC
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Pool Price
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {poolPrice.toFixed(4)} ABYTKN/USDC
                    </p>
                  </div>
                </div>

                {!isValidRatio && !isInitialRatio && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Price Difference: {ratioValidation?.priceDifference}%
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400">
                      <p>
                        • For {liquidityData.usdcAmount} USDC → Use{" "}
                        {ratioValidation?.suggestedToken1Amount} ABYTKN
                      </p>
                      <p>
                        • For {liquidityData.abytknAmount} ABYTKN → Use{" "}
                        {ratioValidation?.suggestedToken0Amount} USDC
                      </p>
                    </div>
                  </div>
                )}

                {isValidRatio && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>
                      {isInitialRatio
                        ? "Using initial pool ratio (pool may not exist yet)"
                        : "Ratio matches current pool price"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Presets */}
        <div className={`mb-6 rounded-xl border p-4 ${glassCardStyle}`}>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
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
                onClick={() => handleUSDCAmountChange(preset.usdc)}
                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Impact Warning */}
        {liquidityData.usdcAmount &&
          liquidityData.abytknAmount &&
          !isValidRatio &&
          !isInitialRatio && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                    High Price Impact
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Your liquidity ratio doesn't match the current pool price.
                    This may result in significant price impact or failed
                    transaction. Adjust your amounts using the suggestions
                    above.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Liquidity Details */}
        {liquidityData.usdcAmount && liquidityData.abytknAmount && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mb-4 flex items-center justify-between text-sm"
          >
            <span className="font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              Liquidity Details
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {showDetails &&
          liquidityData.usdcAmount &&
          liquidityData.abytknAmount && (
            <div className="mb-6 space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Your Share of Pool
                </span>
                <span className="font-medium">~0.12%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Estimated APR
                </span>
                <span className="font-medium text-green-600">12.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Pooled USDC
                </span>
                <span className="font-medium">
                  {liquidityData.usdcAmount} USDC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Pooled ABYTKN
                </span>
                <span className="font-medium">
                  {liquidityData.abytknAmount} ABYTKN
                </span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Share of Pool
                </span>
                <span className="font-medium">0.12%</span>
              </div>
            </div>
          )}

        {/* Add Liquidity Button */}
        <button
          onClick={handleAddLiquidity}
          disabled={
            !isConnected ||
            loading ||
            !liquidityData.usdcAmount ||
            !liquidityData.abytknAmount ||
            (!isValidRatio && !isInitialRatio)
          }
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Activity className="animate-spin" size={18} />
              Adding Liquidity...
            </>
          ) : isLoadingPrice ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Loading Pool Price...
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !liquidityData.usdcAmount || !liquidityData.abytknAmount ? (
            "Enter Amounts"
          ) : !isValidRatio && !isInitialRatio ? (
            "Adjust Ratio to Match Pool Price"
          ) : (
            <>
              <Plus size={18} />
              Add Liquidity
            </>
          )}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
          By adding liquidity, you'll earn 0.05% of all trades on this pair
          proportional to your share of the pool.
        </p>
      </div>
    </div>
  );
};

export default AddLiquidity;
