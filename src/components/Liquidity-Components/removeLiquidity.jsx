import React, { useState, useEffect } from "react";
import {
  Minus,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  Wallet,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Percent,
  DollarSign,
  TrendingDown,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useUserPositions } from "../../contexts/fake-liquidity-test-contexts/userPositionContext";
import { useDarkMode } from "../../contexts/themeContext";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";

const RemoveLiquidity = () => {
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  const address = account?.address;

  const {
    positions,
    loading,
    error,
    removeLiquidity,
    refreshPositions,
    getPositionFees,
    getPositionDetails,
  } = useUserPositions();

  const [positionDetails, setPositionDetails] = useState(null);
  const [fees, setFees] = useState({ token0: "0", token1: "0" });
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [percentToRemove, setPercentToRemove] = useState(100);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch positions on component mount
  useEffect(() => {
    console.log("Remove Liquidity component mounted");
    refreshPositions();
  }, [refreshPositions]);

  // Debug effect to track positions changes
  useEffect(() => {
    console.log("Positions updated:", {
      count: positions.length,
      loading,
      error,
      positions: positions,
    });
  }, [positions, loading, error]);

  // When a position is selected, get its details
  useEffect(() => {
    const fetchPositionDetails = async () => {
      if (selectedPositionId) {
        const details = await getPositionDetails(selectedPositionId);
        setPositionDetails(details);

        const feesData = await getPositionFees(selectedPositionId);
        setFees(feesData);
      } else {
        setPositionDetails(null);
        setFees({ token0: "0", token1: "0" });
      }
    };

    fetchPositionDetails();
  }, [selectedPositionId, getPositionDetails, getPositionFees]);

  // Handle position selection
  const handleSelectPosition = (tokenId) => {
    setSelectedPositionId(tokenId);
    setPercentToRemove(100);
    setShowDetails(true);
  };

  // Handle removing liquidity
  const handleRemoveLiquidity = async () => {
    if (!selectedPositionId) return;

    setRemoving(true);
    const toastId = toast.loading("Removing liquidity...");

    try {
      // Convert percent to a decimal amount
      const liquidityAmount = (percentToRemove / 100).toString();

      const result = await removeLiquidity(selectedPositionId, liquidityAmount);

      if (result.success) {
        toast.update(toastId, {
          render: `Successfully removed ${percentToRemove}% liquidity`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
        refreshPositions();
        setTimeout(() => {
          setSelectedPositionId(null);
        }, 5000);
      } else {
        toast.update(toastId, {
          render: result.error || "Failed to remove liquidity",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.update(toastId, {
        render: error.message || "An error occurred",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setRemoving(false);
    }
  };

  // Calculate estimated amounts
  const estimatedToken0 = positionDetails
    ? (parseFloat(positionDetails.token0 || "0") * percentToRemove) / 100
    : 0;
  const estimatedToken1 = positionDetails
    ? (parseFloat(positionDetails.token1 || "0") * percentToRemove) / 100
    : 0;

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20">
            <Minus className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold">Remove Liquidity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Withdraw your liquidity position and earned fees
            </p>
          </div>
        </div>
        <button
          onClick={refreshPositions}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Refresh positions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className={`rounded-xl border p-4 bg-red-500/10 border-red-500/20 ${glassCardStyle}`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Position Selection - Show if positions exist regardless of loading state */}
      {positions.length > 0 && !selectedPositionId && (
        <div className={`rounded-xl border p-4 ${glassCardStyle}`}>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            Select Position to Remove
          </h4>
          <div className="space-y-2">
            {positions.map((position) => (
              <button
                key={position.tokenId}
                onClick={() => handleSelectPosition(position.tokenId)}
                className="w-full group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-rose-500/0 group-hover:from-red-500/5 group-hover:to-rose-500/5 transition-opacity" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Token Icons */}
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white dark:border-slate-800" />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 border-2 border-white dark:border-slate-800" />
                    </div>

                    <div>
                      <p className="font-semibold">
                        Position #{position.tokenId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Liquidity:{" "}
                        {parseFloat(position.liquidity).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {parseFloat(position.token0 || "0").toFixed(4)} /{" "}
                      {parseFloat(position.token1 || "0").toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ABYTKN / USDC
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State - Show only if no positions exist and loading is true */}
      {positions.length === 0 && loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-red-500/30 rounded-full animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading your positions...
          </p>
        </div>
      )}

      {/* No Positions State */}
      {!loading && positions.length === 0 && (
        <div
          className={`text-center py-12 rounded-xl border ${glassCardStyle}`}
        >
          <div className="relative inline-block">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <div className="absolute inset-0 animate-ping">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20" />
            </div>
          </div>
          <h4 className="text-lg font-semibold mb-2">No Liquidity Positions</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            You haven't added any liquidity yet.
          </p>
          <button
            onClick={refreshPositions}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}

      {/* Selected Position Details */}
      {positionDetails && selectedPositionId && (
        <div className={`rounded-2xl border overflow-hidden ${cardStyle}`}>
          {/* Position Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-500/5 to-rose-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Minus className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    Position #{positionDetails.tokenId}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ABYTKN / USDC • Fee Tier 0.05%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPositionId(null)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Position Overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Total Liquidity
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {parseFloat(positionDetails.liquidity).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Pool Share
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  0.12%
                </p>
              </div>
            </div>

            {/* Current Holdings */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Current Holdings
                </p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500" />
                    <span className="text-sm">ABYTKN</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {parseFloat(positionDetails.token0 || "0").toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <span className="text-sm">USDC</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">
                    {parseFloat(positionDetails.token1 || "0").toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Earned Fees */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  Earned Fees
                </p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    ABYTKN Fees
                  </span>
                  <span className="font-mono text-sm font-semibold text-green-600">
                    {parseFloat(fees.token0).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    USDC Fees
                  </span>
                  <span className="font-mono text-sm font-semibold text-green-600">
                    {parseFloat(fees.token1).toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Removal Amount Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount to Remove
                </label>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {percentToRemove}%
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={percentToRemove}
                onChange={(e) => setPercentToRemove(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />

              {/* Quick Percent Buttons */}
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setPercentToRemove(percent)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      percentToRemove === percent
                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Returns */}
            <div className={`rounded-xl border p-3 ${glassCardStyle}`}>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                You will receive (estimated)
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    ABYTKN
                  </span>
                  <span className="font-mono font-semibold">
                    {estimatedToken0.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    USDC
                  </span>
                  <span className="font-mono font-semibold">
                    {estimatedToken1.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveLiquidity}
              disabled={removing}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {removing ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Remove {percentToRemove}% Liquidity
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
    </div>
  );
};

export default RemoveLiquidity;
