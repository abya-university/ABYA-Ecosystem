import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { DollarSign, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useDarkMode } from "../../contexts/themeContext";
import { useRevenueSharing } from "../../contexts/RevenueSharingContext";

/**
 * CommissionWithdrawal Component
 * Displays commission balance breakdown and allows ambassadors to withdraw
 *
 * @param {Object} props
 * @param {String} props.ambassadorAddress - Optional address to fetch data for (defaults to connected account)
 */
export default function CommissionWithdrawal({ ambassadorAddress }) {
  const { darkMode } = useDarkMode();
  const account = useActiveAccount();
  const {
    commissionsBalance,
    withdrawLoading,
    fetchCommissionsBalance,
    withdrawCommissions,
    error: revenueError,
  } = useRevenueSharing();

  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const targetAddress = ambassadorAddress || account?.address;

  // Fetch commission balance on mount or when target address changes
  useEffect(() => {
    if (targetAddress && !hasLoadedOnce) {
      setIsLoading(true);
      fetchCommissionsBalance(targetAddress).finally(() => {
        setIsLoading(false);
        setHasLoadedOnce(true);
      });
    }
  }, [targetAddress, fetchCommissionsBalance, hasLoadedOnce]);

  const handleWithdraw = async () => {
    if (
      !commissionsBalance?.pending ||
      Number(commissionsBalance.pending) === 0
    ) {
      toast.warning("No pending commissions to withdraw");
      return;
    }

    const result = await withdrawCommissions();
    if (result.success) {
      // Refresh balance after withdrawal
      if (targetAddress) {
        await fetchCommissionsBalance(targetAddress);
      }
    }
  };

  // Format USDC amounts (6 decimals)
  const formatUSDC = (amount) => {
    if (!amount) return "0.00";
    try {
      const num = Number(amount) / 1e6;
      if (isNaN(num)) return "0.00";
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.error("Error formatting USDC:", error);
      return "0.00";
    }
  };

  const cardStyle = darkMode
    ? "border-white/10 bg-slate-900/60"
    : "border-slate-200/70 bg-white";

  const loading = isLoading;

  const pending = commissionsBalance?.pending
    ? formatUSDC(commissionsBalance.pending)
    : "0.00";
  const lifetime = commissionsBalance?.lifetime
    ? formatUSDC(commissionsBalance.lifetime)
    : "0.00";
  const withdrawn = commissionsBalance?.withdrawn
    ? formatUSDC(commissionsBalance.withdrawn)
    : "0.00";
  const canWithdraw =
    commissionsBalance?.pending && Number(commissionsBalance.pending) > 0;

  return (
    <div className={`space-y-4 rounded-3xl border p-6 ${cardStyle}`}>
      <div>
        <h2 className="text-lg font-semibold">Commission Withdrawal</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Manage and withdraw your earned commissions
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
          {/* Commission Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Pending Commissions */}
            <div className="rounded-xl bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Pending
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {pending} USDC
              </p>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Ready to withdraw
              </p>
            </div>

            {/* Lifetime Commissions */}
            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Lifetime
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {lifetime} USDC
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                Total earned all-time
              </p>
            </div>

            {/* Withdrawn Commissions */}
            <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                  Withdrawn
                </p>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {withdrawn} USDC
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                Already cashed out
              </p>
            </div>
          </div>

          {/* Withdraw Button */}
          <button
            onClick={handleWithdraw}
            disabled={withdrawLoading || !canWithdraw}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 ${
              canWithdraw
                ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400"
                : "bg-yellow-500/60 text-slate-700 cursor-not-allowed"
            } dark:disabled:text-slate-400`}
          >
            {withdrawLoading
              ? "Processing Withdrawal..."
              : canWithdraw
              ? `Withdraw ${pending} USDC`
              : "No Pending Commissions"}
          </button>

          {/* Info Message */}
          {!canWithdraw && Number(pending) === 0 && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Your commissions are earned through course purchases in your
                network. Check back when you have pending commissions to
                withdraw.
              </p>
            </div>
          )}

          {/* Error Message */}
          {revenueError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {revenueError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
