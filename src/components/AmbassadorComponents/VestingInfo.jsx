import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Lock, Unlock, Gift, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { useDarkMode } from "../../contexts/themeContext";
import { useVesting } from "../../contexts/VestingContext";

/**
 * VestingInfo Component
 * Displays vesting data with stats, progress bar, and claim button
 *
 * @param {Object} props
 * @param {String} props.ambassadorAddress - Optional address to fetch data for (defaults to connected account)
 * @param {Boolean} props.showClaimButton - Show/hide claim button (default: true)
 * @param {Boolean} props.compact - Show compact version without full details (default: false)
 */
export default function VestingInfo({
  ambassadorAddress,
  showClaimButton = true,
  compact = false,
}) {
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  const {
    vestingData,
    vestingSchedule,
    claimVestedTokens,
    getVestingInfo,
    getVestingSchedule,
    loadingClaimTokens,
    loadingVestingInfo,
    loadingVestingSchedule,
    error: vestingError,
  } = useVesting();

  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const targetAddress = ambassadorAddress || account?.address;

  // Fetch vesting data on mount or when target address changes
  useEffect(() => {
    if (targetAddress && !hasLoadedOnce) {
      setIsLoading(true);
      Promise.allSettled([
        getVestingInfo(targetAddress),
        getVestingSchedule(targetAddress),
      ]).finally(() => {
        setIsLoading(false);
        setHasLoadedOnce(true);
      });
    }
  }, [targetAddress]); // Remove function dependencies to prevent infinite loops

  const handleClaimTokens = async () => {
    await claimVestedTokens();
    // Refresh data after claiming
    if (targetAddress) {
      await getVestingInfo(targetAddress);
    }
  };

  // Format token amounts - safely handle BigInt
  const formatTokens = (amount) => {
    if (!amount) return "0";
    try {
      const bigIntAmount =
        typeof amount === "bigint" ? amount : BigInt(amount.toString());
      const num = Number(bigIntAmount) / 1e18;
      if (isNaN(num)) return "0";
      return num.toFixed(2);
    } catch (error) {
      console.error("Error formatting tokens:", error);
      return "0";
    }
  };

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  const loading = isLoading || loadingVestingInfo || loadingVestingSchedule;

  if (compact) {
    // Compact version - just show key stats
    return (
      <div className={`space-y-3 rounded-2xl border p-4 ${cardStyle}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-yellow-500" />
            <p className="text-sm font-medium">Vesting Status</p>
          </div>
          {loading ? (
            <div className="h-4 w-16 animate-pulse rounded bg-slate-300 dark:bg-slate-600" />
          ) : (
            <p className="text-sm font-semibold">
              {formatTokens(vestingData.vested)} ABYT
            </p>
          )}
        </div>

        {vestingSchedule.percentVested !== null && (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                style={{
                  width: `${Math.min(
                    Number(vestingSchedule.percentVested) / 100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(Number(vestingSchedule.percentVested) / 100).toFixed(1)}% vested
            </p>
          </div>
        )}

        {showClaimButton && !compact && (
          <button
            onClick={handleClaimTokens}
            disabled={
              loadingClaimTokens ||
              !vestingData.vested ||
              Number(vestingData.vested) === 0
            }
            className="w-full rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-slate-900 transition duration-200 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-500/60 disabled:text-slate-700"
          >
            {loadingClaimTokens ? "Claiming..." : "Claim"}
          </button>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
      <div>
        <h2 className="text-lg font-semibold">Token Vesting</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Track your vesting schedule and claim your rewards.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin">
            <div className="h-6 w-6 border-2 border-slate-300 border-t-yellow-500 rounded-full"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vested
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold">
                {formatTokens(vestingData.vested)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unvested
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold">
                {formatTokens(vestingData.unvested)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Claimed
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold">
                {formatTokens(vestingData.claimed)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold">
                {formatTokens(vestingData.lifetime)}
              </p>
            </div>
          </div>

          {/* Vesting Progress */}
          {vestingSchedule.percentVested !== null && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Vesting Progress</p>
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  {(Number(vestingSchedule.percentVested) / 100).toFixed(1)}%
                </p>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      Number(vestingSchedule.percentVested) / 100,
                      100,
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    Days Elapsed
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {Math.floor(Number(vestingSchedule.elapsed || 0) / 86400)}{" "}
                    days
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    Total Duration
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {Math.floor(Number(vestingSchedule.duration || 0) / 86400)}{" "}
                    days
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    Remaining
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {Math.max(
                      0,
                      Math.floor(
                        (Number(vestingSchedule.duration || 0) -
                          Number(vestingSchedule.elapsed || 0)) /
                          86400,
                      ),
                    )}{" "}
                    days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          {showClaimButton && (
            <button
              onClick={handleClaimTokens}
              disabled={
                loadingClaimTokens ||
                !vestingData.vested ||
                Number(vestingData.vested) === 0
              }
              className="w-full rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-500/60 disabled:text-slate-700"
            >
              {loadingClaimTokens
                ? "Claiming..."
                : Number(vestingData.vested) > 0
                ? "Claim Vested Tokens"
                : "No Vested Tokens to Claim"}
            </button>
          )}

          {/* Error Message */}
          {vestingError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {vestingError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
