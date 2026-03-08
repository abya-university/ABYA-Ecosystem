import { useState, useEffect } from "react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import {
  Droplets,
  Coins,
  Info,
  ExternalLink,
  RefreshCw,
  Wallet,
  Zap,
  Shield,
  Sparkles,
  Loader,
  X,
  Copy,
  Check,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import { ethers } from "ethers";
import CONTRACT_ABI from "../../artifacts/fakeLiquidityArtifacts/Add_Swap_Contract.sol/Add_Swap_Contract.json";
import USDC_ABI from "../../artifacts/fakeLiquidityArtifacts/UsdCoin.sol/UsdCoin.json";
import ABYTKN_ABI from "../../artifacts/fakeLiquidityArtifacts/ABYATKN.sol/ABYATKN.json";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../services/client";
import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { toast } from "react-toastify";
import { useDarkMode } from "../../contexts/themeContext";
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
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN1,
    decimals: 6,
    icon: Droplets,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30",
    description: "Stablecoin for testing and development",
  },
  ABYTKN: {
    symbol: "ABYTKN",
    name: "ABYA Token",
    address: CONTRACT_CONFIG.ADDRESSES.TOKEN0,
    decimals: 18,
    icon: Coins,
    color: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/30",
    description: "Native token for the ABYA ecosystem",
  },
};

const MintComponent = () => {
  const { darkMode } = useDarkMode();
  const [mintData, setMintData] = useState({
    usdcAmount: "",
    abytknAmount: "",
  });
  const [txHash, setTxHash] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [activeToken, setActiveToken] = useState(null);

  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;
  const { loadBalances, loadPoolInfo, balances } = useTransactionHistory();
  const [loadingUSDC, setLoadingUSDC] = useState(false);
  const [loadingABYTKN, setLoadingABYTKN] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBalances();
    await loadPoolInfo();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const mintUSDCTokens = async (amount) => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount to mint");
      return;
    }

    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setLoadingUSDC(true);
    setActiveToken("USDC");
    setTxHash(null);

    const toastId = toast.loading("Minting USDC tokens...");

    try {
      // Initialize USDC contract
      const usdcContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN1, // USDC address
        abi: usdcAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const parsedAmount = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals

      // Prepare and send mint transaction
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: "mint",
        params: [address, parsedAmount],
      });

      const tx = await sendTransaction({ transaction, account });
      setTxHash(tx.transactionHash);

      toast.update(toastId, {
        render: `Successfully minted ${amount} USDC!`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      loadBalances(); // Refresh balances
      setMintData((prev) => ({
        ...prev,
        usdcAmount: "",
      }));
    } catch (error) {
      console.error("USDC Minting error:", error);
      let errorMessage = "Failed to mint USDC";

      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (error.message?.includes("execution reverted")) {
        errorMessage =
          "Contract execution reverted - you may not have minting permissions";
      } else {
        errorMessage += `: ${error.message}`;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingUSDC(false);
      setActiveToken(null);
    }
  };

  const mintABYATokens = async (amount) => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount to mint");
      return;
    }

    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    setLoadingABYTKN(true);
    setActiveToken("ABYTKN");
    setTxHash(null);

    const toastId = toast.loading("Minting ABYTKN tokens...");

    try {
      // Initialize ABYTKN contract
      const abytknContract = getContract({
        address: CONTRACT_CONFIG.ADDRESSES.TOKEN0, // ABYTKN address
        abi: abyatknAbi,
        client,
        chain: CONTRACT_CONFIG.CHAIN,
      });

      const parsedAmount = ethers.parseEther(amount.toString()); // ABYTKN has 18 decimals

      // Prepare and send mint transaction
      const transaction = prepareContractCall({
        contract: abytknContract,
        method: "mint",
        params: [address, parsedAmount],
      });

      const tx = await sendTransaction({ transaction, account });
      setTxHash(tx.transactionHash);

      toast.update(toastId, {
        render: `Successfully minted ${amount} ABYTKN!`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      loadBalances(); // Refresh balances
      setMintData((prev) => ({
        ...prev,
        abytknAmount: "",
      }));
    } catch (error) {
      console.error("ABYTKN Minting error:", error);
      let errorMessage = "Failed to mint ABYTKN";

      const msg = error?.message ?? String(error);
      if (msg.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (msg.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas";
      } else if (msg.includes("execution reverted")) {
        errorMessage =
          "Contract execution reverted - you may not have minting permissions";
      } else {
        errorMessage += `: ${msg}`;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingABYTKN(false);
      setActiveToken(null);
    }
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">Token Minting</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mint test tokens for development and testing
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          title="Refresh balances"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              refreshing
                ? "animate-spin"
                : "group-hover:rotate-180 transition-transform duration-500"
            }`}
          />
        </button>
      </div>

      {/* Info Card */}
      <div className={`rounded-xl border p-4 ${glassCardStyle}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Testnet Faucet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mint test tokens for development purposes. These tokens have no
              real value and are only for testing on Sepolia testnet.
            </p>
          </div>
        </div>
      </div>

      {/* USDC Minting Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${TOKENS.USDC.color} opacity-0 group-hover:opacity-5 transition-opacity`}
        />

        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${TOKENS.USDC.color} bg-opacity-20`}
            >
              <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <span>Mint USDC</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
                  Test Token
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {TOKENS.USDC.description}
              </p>
            </div>
          </div>

          {/* Current Balance */}
          {isConnected && (
            <div className="mb-4 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Current Balance
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                {balances.USDC || "0.00"} USDC
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* Amount Input */}
            <div className="relative group">
              <input
                type="number"
                placeholder="Enter amount to mint"
                value={mintData.usdcAmount}
                onChange={(e) =>
                  setMintData({
                    ...mintData,
                    usdcAmount: e.target.value,
                  })
                }
                className={`w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-24 ${
                  activeToken === "USDC" && loadingUSDC
                    ? "border-blue-500/50 ring-2 ring-blue-500/20"
                    : "border-transparent"
                }`}
              />

              {/* Quick Amount Buttons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setMintData((prev) => ({
                        ...prev,
                        usdcAmount: preset.toString(),
                      }))
                    }
                    className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={() => mintUSDCTokens(mintData.usdcAmount)}
              disabled={!isConnected || loadingUSDC || !mintData.usdcAmount}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loadingUSDC && activeToken === "USDC" ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Minting USDC...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Mint USDC
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ABYTKN Minting Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${TOKENS.ABYTKN.color} opacity-0 group-hover:opacity-5 transition-opacity`}
        />

        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${TOKENS.ABYTKN.color} bg-opacity-20`}
            >
              <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <span>Mint ABYTKN</span>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                  Native Token
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {TOKENS.ABYTKN.description}
              </p>
            </div>
          </div>

          {/* Current Balance */}
          {isConnected && (
            <div className="mb-4 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Current Balance
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                {balances.ABYTKN || "0.00"} ABYTKN
              </span>
            </div>
          )}

          <div className="space-y-4">
            {/* Amount Input */}
            <div className="relative group">
              <input
                type="number"
                placeholder="Enter amount to mint"
                value={mintData.abytknAmount}
                onChange={(e) =>
                  setMintData({
                    ...mintData,
                    abytknAmount: e.target.value,
                  })
                }
                className={`w-full px-4 py-4 bg-slate-100 dark:bg-slate-800 border-2 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all pr-24 ${
                  activeToken === "ABYTKN" && loadingABYTKN
                    ? "border-yellow-500/50 ring-2 ring-yellow-500/20"
                    : "border-transparent"
                }`}
              />

              {/* Quick Amount Buttons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setMintData((prev) => ({
                        ...prev,
                        abytknAmount: preset.toString(),
                      }))
                    }
                    className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={() => mintABYATokens(mintData.abytknAmount)}
              disabled={!isConnected || loadingABYTKN || !mintData.abytknAmount}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loadingABYTKN && activeToken === "ABYTKN" ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Minting ABYTKN...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Mint ABYTKN
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className={`rounded-xl border p-4 ${glassCardStyle}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600">
                Transaction Confirmed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(txHash)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Copy hash"
              >
                {copiedHash === txHash ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="View on Etherscan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-2 break-all">
            {txHash}
          </p>
        </div>
      )}

      {/* Note Card */}
      <div
        className={`rounded-xl border p-4 bg-yellow-500/5 border-yellow-500/20 ${glassCardStyle}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Shield className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Important Note
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Make sure your token contracts have minting functionality enabled
              and you have the required permissions. These are testnet tokens
              only and have no real value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintComponent;
