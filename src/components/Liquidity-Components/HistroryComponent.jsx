import {
  Plus,
  ArrowDownUp,
  Activity,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  X,
  Download,
  Copy,
  Info,
  TrendingUp,
  Droplets,
  Zap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { useDarkMode } from "../../contexts/themeContext";
import { useActiveAccount } from "thirdweb/react";

const HistoryComponent = () => {
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  const address = account?.address;

  const { refreshHistory, loading, transactions } = useTransactionHistory();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = useRef(false);

  // Debug logging
  console.log("HistoryComponent - Loading state:", loading);
  console.log("HistoryComponent - Transactions:", transactions);

  // Ensure transactions is always an array
  const transactionList = Array.isArray(transactions) ? transactions : [];

  // Filter transactions
  const filteredTransactions = transactionList
    .filter((tx) => {
      if (!tx) return false;
      if (filterType === "all") return true;
      return String(tx.type || "").toLowerCase() === filterType.toLowerCase();
    })
    .filter((tx) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (tx.hash || "").toLowerCase().includes(searchLower) ||
        (tx.fromAmount || "").toString().includes(searchLower) ||
        (tx.toAmount || "").toString().includes(searchLower) ||
        (tx.fromToken || "").toLowerCase().includes(searchLower) ||
        (tx.toToken || "").toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshHistory();
    } catch (error) {
      console.error("Error refreshing history:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle initial load timeout
  useEffect(() => {
    if (!initialLoadDone.current && loading) {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn("Loading timeout - forcing loading to false");
          initialLoadDone.current = true;
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Copy hash to clipboard
  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Get explorer URL
  const getExplorerUrl = (hash) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown time";

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";

      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format amount
  const formatAmount = (amount) => {
    if (!amount) return "0";
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return "0";
      // Handle very small numbers (like 0.0000000000025)
      if (num < 0.000001) return num.toExponential(2);
      return num.toFixed(6);
    } catch {
      return "0";
    }
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  // Determine if we should show loading
  const showLoading =
    loading && !initialLoadDone.current && transactionList.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">Transaction History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              View all your swap and liquidity transactions
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="group relative p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 transition-all ${
              isRefreshing
                ? "animate-spin"
                : "group-hover:rotate-180 transition-transform duration-500"
            }`}
          />
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className={`rounded-xl border p-3 ${glassCardStyle}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hash, token, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${
              showFilters
                ? "bg-purple-500/20 text-purple-600"
                : "hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Type:
              </span>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === "all"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("swap")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === "swap"
                    ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <ArrowDownUp className="w-3 h-3" />
                Swap
              </button>
              <button
                onClick={() => setFilterType("liquidity")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  filterType === "liquidity"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Droplets className="w-3 h-3" />
                Liquidity
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {!showLoading && filteredTransactions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-3 rounded-xl border ${glassCardStyle}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-lg font-bold">{filteredTransactions.length}</p>
          </div>
          <div className={`p-3 rounded-xl border ${glassCardStyle}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Swaps</p>
            <p className="text-lg font-bold text-yellow-600">
              {filteredTransactions.filter((t) => t?.type === "swap").length}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${glassCardStyle}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Liquidity
            </p>
            <p className="text-lg font-bold text-green-600">
              {
                filteredTransactions.filter((t) => t?.type === "liquidity")
                  .length
              }
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {showLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-500/30 rounded-full animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading transactions...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!showLoading && filteredTransactions.length === 0 && (
        <div
          className={`text-center py-12 rounded-xl border ${glassCardStyle}`}
        >
          <div className="relative inline-block">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {searchTerm || filterType !== "all" ? (
                <Search className="w-8 h-8 text-slate-400" />
              ) : (
                <Clock className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="absolute inset-0 animate-ping">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20" />
            </div>
          </div>
          <h4 className="text-lg font-semibold mb-2">
            {searchTerm || filterType !== "all"
              ? "No Matching Transactions"
              : "No Transactions Yet"}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filters"
              : "Start swapping or adding liquidity to see your history"}
          </p>
          {(searchTerm || filterType !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Transaction List */}
      {!showLoading && filteredTransactions.length > 0 && (
        <div className="space-y-2">
          {filteredTransactions.map((tx, index) => (
            <div
              key={tx?.id || index}
              className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${cardStyle}`}
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-opacity" />

              <div className="relative">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Transaction Icon */}
                    <div
                      className={`p-2 rounded-lg ${
                        tx?.type === "swap"
                          ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
                          : "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                      }`}
                    >
                      {tx?.type === "swap" ? (
                        <ArrowDownUp
                          className={`w-4 h-4 ${
                            tx?.type === "swap"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        />
                      ) : (
                        <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          {tx?.type === "swap" ? "Token Swap" : "Add Liquidity"}
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx?.status === "confirmed"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                          }`}
                        >
                          {tx?.status === "confirmed" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {tx?.status || "pending"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTimestamp(tx?.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Time (desktop) */}
                  <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                    {tx?.timestamp
                      ? new Date(tx.timestamp).toLocaleString()
                      : "Unknown"}
                  </span>
                </div>

                {/* Transaction Details */}
                <div className="ml-11 mb-3">
                  {tx?.type === "swap" ? (
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-mono font-semibold">
                        {formatAmount(tx?.fromAmount)}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tx?.fromToken || "Unknown"}
                      </span>
                      <ArrowDownUp className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-mono font-semibold">
                        {formatAmount(tx?.toAmount)}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tx?.toToken || "Unknown"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm">Added</span>
                      <span className="text-sm font-mono font-semibold">
                        {formatAmount(tx?.fromAmount)}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tx?.fromToken || "Unknown"}
                      </span>
                      <Plus className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-mono font-semibold">
                        {formatAmount(tx?.toAmount)}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tx?.toToken || "Unknown"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Row */}
                <div className="ml-11 flex items-center justify-between">
                  {/* Hash with copy */}
                  {tx?.hash && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tx.hash)}
                          className="hover:text-yellow-500 transition-colors"
                          title="Copy hash"
                        >
                          {copiedHash === tx.hash ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Explorer Link */}
                  {tx?.hash && (
                    <a
                      href={getExplorerUrl(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors group/link"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Button */}
      {!showLoading && filteredTransactions.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
            onClick={() => {
              alert("Export feature coming soon!");
            }}
          >
            <Download className="w-4 h-4" />
            Export History
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryComponent;
