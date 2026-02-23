import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Coins,
  LineChart,
  CheckCircle,
  Wallet,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  DollarSign,
  Gift,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { useDarkMode } from "../../contexts/themeContext";
import { useAmbassadorNetwork } from "../../contexts/ambassadorNetworkContext";
import { useUser } from "../../contexts/userContext";
import { useRevenueSharing } from "../../contexts/RevenueSharingContext";
import VestingInfo from "../../components/AmbassadorComponents/VestingInfo";
import CommissionWithdrawal from "../../components/AmbassadorComponents/CommissionWithdrawal";

export default function RevenuePortfolio() {
  const { darkMode } = useDarkMode();
  const { ambassadorDetails } = useAmbassadorNetwork();
  const { role } = useUser();
  const account = useActiveAccount();
  const { commissionsBalance, fetchCommissionsBalance } = useRevenueSharing();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Fetch user's commission balance on component mount
  useEffect(() => {
    if (account?.address) {
      fetchCommissionsBalance(account.address);
    }
  }, [account?.address, fetchCommissionsBalance]);

  const ambassadorList = Array.isArray(ambassadorDetails)
    ? ambassadorDetails
    : [];

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

  const pendingAmount = commissionsBalance?.pending
    ? formatUSDC(commissionsBalance.pending)
    : "0.00";

  const lifetimeAmount = commissionsBalance?.lifetime
    ? formatUSDC(commissionsBalance.lifetime)
    : "0.00";

  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-slate-600/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70 hover:border-slate-300/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  const statsCards = [
    {
      title: "Pending Payouts",
      value: `${pendingAmount} USDC`,
      subtitle: `${pendingAmount} USDC`,
      icon: Coins,
      gradient: "from-yellow-500/20 to-amber-500/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      trend: pendingAmount !== "0.00" ? "Ready to withdraw" : "Coming soon",
    },
    {
      title: "Monthly Growth",
      value: "+18.2%",
      icon: TrendingUp,
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      trend: "+2.3%",
    },
    {
      title: "Next Payout",
      value: "Mar 02, 2024",
      icon: Calendar,
      gradient: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      subtext: "In 5 days",
    },
  ];

  const checklistItems = [
    {
      text: "Confirm ambassador tiers and bonus eligibility",
      icon: CheckCircle,
      color: "yellow",
      completed: true,
    },
    {
      text: "Review payout cadence and schedule reminders",
      icon: Clock,
      color: "blue",
      completed: false,
    },
    {
      text: "Check vesting schedule and claim eligible tokens",
      icon: Gift,
      color: "green",
      completed: false,
    },
    {
      text: "Approve next payout batch",
      icon: Zap,
      color: "purple",
      completed: false,
    },
  ];

  const colorVariants = {
    yellow: {
      bg: "from-yellow-500/20 to-amber-500/20",
      border: "border-yellow-500/30",
      text: "text-yellow-600 dark:text-yellow-400",
      light: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    blue: {
      bg: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      light: "bg-blue-50 dark:bg-blue-900/20",
    },
    green: {
      bg: "from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
      text: "text-green-600 dark:text-green-400",
      light: "bg-green-50 dark:bg-green-900/20",
    },
    purple: {
      bg: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      light: "bg-purple-50 dark:bg-purple-900/20",
    },
  };

  return (
    <section className="space-y-8">
      {/* Header with modern gradient */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-transparent p-8">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-green-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-4 w-4" />
              <span>Portfolio & Earnings</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Revenue & Vesting
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Monitor revenue streams, vesting schedules, unlock rewards, and
              keep payouts on track with real-time analytics.
            </p>
          </div>

          {role &&
            (role === "Founding Ambassador" ||
              role === "General Ambassador") && (
              <div
                className={`group relative inline-flex items-center gap-3 rounded-2xl px-6 py-3 ${
                  role === "Founding Ambassador"
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30"
                    : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                }`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold whitespace-nowrap">{role}</span>
              </div>
            )}
        </div>
      </header>

      {/* Vesting Section - enhanced container */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${cardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4">
              <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Vesting Dashboard</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track and manage your token vesting schedule
              </p>
            </div>
          </div>
          <VestingInfo showClaimButton={true} />
        </div>
      </div>

      {/* Commission Withdrawal Section */}
      <CommissionWithdrawal />

      {/* Stats Cards with modern design */}
      <div className="grid gap-6 md:grid-cols-3">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${cardStyle}`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-xl p-3 ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  {card.trend && (
                    <span
                      className={`text-xs font-semibold ${card.iconColor} bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full`}
                    >
                      {card.trend}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {card.subtitle}
                    </p>
                  )}
                  {card.subtext && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {card.subtext}
                    </p>
                  )}
                </div>

                <div className="relative mt-4 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-1 rounded-full bg-gradient-to-r ${card.gradient}`}
                    style={{ width: hoveredCard === index ? "100%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Checklist with modern design */}
      <div
        className={`group relative overflow-hidden rounded-3xl border p-8 shadow-lg transition-all duration-300 hover:shadow-xl ${glassCardStyle}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4">
              <LineChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Revenue Checklist</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track your progress and stay on top of tasks
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {checklistItems.map((item, index) => {
              const Icon = item.icon;
              const colors = colorVariants[item.color];

              return (
                <div
                  key={index}
                  className={`flex items-start gap-4 rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${
                    colors.border
                  } ${item.completed ? "opacity-75" : ""}`}
                >
                  <div className={`rounded-lg p-2 ${colors.light}`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        item.completed
                          ? "line-through text-slate-500"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.text}
                    </p>
                    {!item.completed && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending action
                      </p>
                    )}
                  </div>
                  {item.completed && (
                    <CheckCircle className={`h-5 w-5 ${colors.text}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Summary */}
          <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Progress Summary</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  1 of 4 tasks completed • 25% complete
                </p>
              </div>
            </div>
            <div className="h-2 w-32 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2 w-1/4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25">
              <Zap className="h-4 w-4" />
              Complete All
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800">
              <AlertCircle className="h-4 w-4" />
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Summary Card */}
      <div className={`grid gap-6 lg:grid-cols-2`}>
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 shadow-lg ${cardStyle}`}
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold">Earnings Overview</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Total Earned
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400 block">
                    {lifetimeAmount} USDC
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {lifetimeAmount} USDC
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  This Month
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  $1,234.56
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last Month
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  $987.65
                </span>
              </div>
              <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Growth</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  +25%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-3xl border p-6 shadow-lg ${cardStyle}`}
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold">Upcoming Payouts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Next Payout
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  March 2, 2024
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Estimated Amount
                </span>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block">
                    $234.56
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    234.56 USDC
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Payment Method
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  USDC
                </span>
              </div>
              <button className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25">
                View Payout Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
