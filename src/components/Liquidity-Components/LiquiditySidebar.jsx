import {
  AlertCircle,
  CheckCircle,
  Info,
  Wallet,
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
  ExternalLink,
  Layers,
  PieChart,
  Zap,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useDarkMode } from "../../contexts/themeContext";

const LiquiditySidebar = () => {
  const { darkMode } = useDarkMode();
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    balances,
    poolInfo,
    txHash,
    allTransactions,
    loadingAllTransactions,
    loadBalances,
    loadPoolInfo,
  } = useTransactionHistory();
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!account;

  // Get the latest transaction (sorted by timestamp)
  const latestTransaction =
    allTransactions && allTransactions.length > 0
      ? [...allTransactions].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        )[0]
      : null;

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBalances(), loadPoolInfo()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (!num || num === "0") return "0.00";
    const n = parseFloat(num);
    if (n > 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n > 1e3) return (n / 1e3).toFixed(2) + "K";
    return n.toFixed(2);
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          title="Refresh data"
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

      {/* Token Balances Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold">Your Balances</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(balances).map(([token, balance], index) => {
              const isUSDC = token === "USDC" || token === "TOKEN0";
              const isABYTKN = token === "ABYTKN" || token === "TOKEN1";
              const tokenColor = isUSDC
                ? "from-blue-500 to-cyan-500"
                : isABYTKN
                ? "from-yellow-500 to-amber-500"
                : "from-purple-500 to-pink-500";

              return (
                <div
                  key={token}
                  className="group flex flex-col gap-2 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${tokenColor}`}
                      />
                      <span className="text-sm font-medium">
                        {token === "TOKEN0"
                          ? "USDC"
                          : token === "TOKEN1"
                          ? "ABYTKN"
                          : token}
                      </span>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        parseFloat(balance) > 0
                          ? "bg-green-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold break-words">
                    {parseFloat(balance).toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>

          {isConnected && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Value</span>
                <span className="font-semibold text-green-600">
                  $
                  {Object.entries(balances)
                    .reduce((acc, [_, bal]) => acc + (parseFloat(bal) || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pool Information Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">Pool Overview</h3>
            </div>
            <button
              onClick={() => setShowPoolInfo(!showPoolInfo)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
              title={showPoolInfo ? "Show less" : "Show more"}
            >
              <Info className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 transition-colors" />
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Liquidity
              </p>
              <p className="text-sm font-bold text-green-600">
                ${formatNumber(poolInfo.liquidity)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Volume (24h)
              </p>
              <p className="text-sm font-bold text-blue-600">
                ${formatNumber(poolInfo.volume24h)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Fees (24h)
              </p>
              <p className="text-sm font-bold text-yellow-600">
                ${formatNumber(poolInfo.fees24h)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                APR
              </p>
              <p className="text-sm font-bold text-purple-600">
                {poolInfo.apr}%
              </p>
            </div>
          </div>

          {/* Token Prices */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  USDC Price
                </span>
              </div>
              <span className="font-mono font-semibold">
                ${formatNumber(poolInfo.token1Price)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  ABYTKN Price
                </span>
              </div>
              <span className="font-mono font-semibold">
                ${formatNumber(poolInfo.token0Price)}
              </span>
            </div>
          </div>

          {/* Expandable Details */}
          {showPoolInfo && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 animate-slideDown">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tick</span>
                <span className="font-mono font-semibold">{poolInfo.tick}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Sqrt Price X96
                </span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {poolInfo.sqrtPriceX96?.slice(0, 10)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Fee Tier
                </span>
                <span className="font-semibold text-green-600">0.05%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Status Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold">Latest Transaction</h3>
          </div>

          {latestTransaction || txHash ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-600">
                    {latestTransaction
                      ? `${
                          latestTransaction.type?.charAt(0).toUpperCase() +
                          latestTransaction.type?.slice(1)
                        } Transaction`
                      : "Transaction Successful"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate">
                      {(latestTransaction?.hash || txHash).slice(0, 10)}...
                      {(latestTransaction?.hash || txHash).slice(-8)}
                    </span>
                    <a
                      href={`https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com/tx/${
                        latestTransaction?.hash || txHash
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors group"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-3 h-3 group-hover:text-yellow-500" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <span>Transaction Details</span>
                <ArrowUpRight
                  className={`w-4 h-4 transition-transform ${
                    showDetails ? "rotate-90" : ""
                  }`}
                />
              </button>

              {showDetails && (
                <div className="space-y-2 text-sm animate-slideDown">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-medium">
                      {latestTransaction?.timestamp
                        ? new Date(
                            latestTransaction.timestamp,
                          ).toLocaleTimeString()
                        : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  {latestTransaction && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type</span>
                        <span className="font-medium capitalize">
                          {latestTransaction.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tokens</span>
                        <span className="font-medium">
                          {latestTransaction.fromToken} →{" "}
                          {latestTransaction.toToken}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-green-600">
                      {latestTransaction?.status || "Confirmed"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : loadingAllTransactions ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-green-500 rounded-full animate-spin" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Loading...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Fetching transaction history
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No Recent Transactions
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Your transactions will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Card */}
      <div className={`rounded-2xl border p-4 ${glassCardStyle}`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-semibold">Quick Stats</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">24h Transactions</span>
            <span className="font-medium">1,234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Active Users</span>
            <span className="font-medium">567</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Value Locked</span>
            <span className="font-medium text-green-600">$2.45M</span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {isConnected && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      )}
    </div>
  );
};

export default LiquiditySidebar;
