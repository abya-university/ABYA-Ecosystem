import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Info,
  Clock,
  Zap,
  Shield,
  Globe,
  Wallet,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import { useDarkMode } from "../../contexts/themeContext";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { toast } from "react-toastify";

const AnalyticsPage = () => {
  const { darkMode } = useDarkMode();
  const {
    transactions,
    allTransactions,
    loading: historyLoading,
    loadingAllTransactions,
  } = useTransactionHistory();
  const [timeframe, setTimeframe] = useState("6m"); // '1w', '1m', '3m', '6m', '1y'
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual data from your contract
  const tvlHistory = [
    { date: "Jan", tvl: 800000, staked: 500000, liquidity: 300000 },
    { date: "Feb", tvl: 1200000, staked: 750000, liquidity: 450000 },
    { date: "Mar", tvl: 1000000, staked: 600000, liquidity: 400000 },
    { date: "Apr", tvl: 1500000, staked: 900000, liquidity: 600000 },
    { date: "May", tvl: 1800000, staked: 1100000, liquidity: 700000 },
    { date: "Jun", tvl: 2000000, staked: 1200000, liquidity: 800000 },
  ];

  const volumeData = [
    { date: "Jan", swaps: 35000, liquidity: 15000, total: 50000 },
    { date: "Feb", swaps: 55000, liquidity: 20000, total: 75000 },
    { date: "Mar", swaps: 40000, liquidity: 20000, total: 60000 },
    { date: "Apr", swaps: 65000, liquidity: 25000, total: 90000 },
    { date: "May", swaps: 60000, liquidity: 25000, total: 85000 },
    { date: "Jun", swaps: 75000, liquidity: 25000, total: 100000 },
  ];

  const stakingData = [
    { date: "Jan", stakers: 100, totalStaked: 500000, avgStake: 5000 },
    { date: "Feb", stakers: 150, totalStaked: 750000, avgStake: 5000 },
    { date: "Mar", stakers: 200, totalStaked: 900000, avgStake: 4500 },
    { date: "Apr", stakers: 250, totalStaked: 1200000, avgStake: 4800 },
    { date: "May", stakers: 300, totalStaked: 1500000, avgStake: 5000 },
    { date: "Jun", stakers: 350, totalStaked: 1800000, avgStake: 5143 },
  ];

  const distributionData = [
    { name: "ABYTKN", value: 45, color: "#EAB308" },
    { name: "USDC", value: 30, color: "#3B82F6" },
    { name: "ETH", value: 15, color: "#8B5CF6" },
    { name: "Others", value: 10, color: "#10B981" },
  ];

  console.log("All Transactions: ", allTransactions);

  const stats = {
    tvl: {
      value: "$2.0M",
      change: "+15.3%",
      isPositive: true,
      history: "+$265K",
    },
    volume24h: {
      value: "$145.2K",
      change: "-5.2%",
      isPositive: false,
      history: "-$7.9K",
    },
    activeStakers: {
      value: "350",
      change: "+12.5%",
      isPositive: true,
      history: "+39 users",
    },
    apy: {
      value: "12.5%",
      change: "+2.3%",
      isPositive: true,
      history: "+0.3%",
    },
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  // Format currency
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 transition-colors duration-300 pt-20 md:pt-[100px]">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:p-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Protocol Analytics
                </h1>
              </div>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Comprehensive overview of protocol performance, user activity,
                and market metrics
              </p>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border p-1 ${glassCardStyle}`}>
                {[
                  { value: "1w", label: "1W" },
                  { value: "1m", label: "1M" },
                  { value: "3m", label: "3M" },
                  { value: "6m", label: "6M" },
                  { value: "1y", label: "1Y" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeframe === option.value
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
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
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats).map(([key, stat], index) => {
            const icons = {
              tvl: BarChart3,
              volume24h: TrendingUp,
              activeStakers: Users,
              apy: DollarSign,
            };
            const Icon = icons[key];
            const colors = {
              tvl: "from-blue-500 to-cyan-500",
              volume24h: "from-green-500 to-emerald-500",
              activeStakers: "from-purple-500 to-pink-500",
              apy: "from-yellow-500 to-amber-500",
            };

            return (
              <div
                key={key}
                className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${cardStyle}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colors[key]} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${colors[key]} bg-opacity-20`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          key === "tvl"
                            ? "text-blue-600"
                            : key === "volume24h"
                            ? "text-green-600"
                            : key === "activeStakers"
                            ? "text-purple-600"
                            : "text-yellow-600"
                        } dark:text-white`}
                      />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="font-semibold">{stat.change}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      {key === "tvl"
                        ? "Total Value Locked"
                        : key === "volume24h"
                        ? "24h Volume"
                        : key === "activeStakers"
                        ? "Active Stakers"
                        : "Current APY"}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stat.history} from last period
                    </p>
                  </div>

                  {/* Sparkline indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                      className={`h-full w-full bg-gradient-to-r ${colors[key]} opacity-20`}
                    />
                    <div
                      className={`h-full bg-gradient-to-r ${colors[key]} transition-all duration-1000`}
                      style={{ width: stat.isPositive ? "70%" : "30%" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* TVL Breakdown Chart */}
          <div
            className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">TVL Breakdown</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Staked vs Liquidity
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-xs text-slate-500">Staked</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-500">Liquidity</span>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tvlHistory}>
                  <defs>
                    <linearGradient
                      id="colorStaked"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorLiquidity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E2E8F0"}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="staked"
                    stackId="1"
                    stroke="#EAB308"
                    fill="url(#colorStaked)"
                  />
                  <Area
                    type="monotone"
                    dataKey="liquidity"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="url(#colorLiquidity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Composition Chart */}
          <div
            className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Volume Composition</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Swaps vs Liquidity Events
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E2E8F0"}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [formatCurrency(value), ""]}
                  />
                  <Bar
                    dataKey="swaps"
                    stackId="a"
                    fill="#EAB308"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="liquidity"
                    stackId="a"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staking Growth */}
          <div
            className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Staking Growth</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Staked vs Stakers
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stakingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E2E8F0"}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="stakers"
                    fill="#EAB308"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalStaked"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Stake */}
          <div
            className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                  <Wallet className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Average Stake</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Per staker over time
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stakingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? "#374151" : "#E2E8F0"}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                  />
                  <YAxis
                    stroke={darkMode ? "#9CA3AF" : "#64748B"}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [formatCurrency(value), "Avg Stake"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgStake"
                    stroke="#EAB308"
                    strokeWidth={2}
                    dot={{ fill: "#EAB308", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgStake"
                    fill="#EAB308"
                    fillOpacity={0.1}
                    stroke="none"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Distribution */}
          <div className={`rounded-2xl border p-6 ${glassCardStyle}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">Token Distribution</h3>
            </div>

            <div className="space-y-4">
              {distributionData.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Supply</span>
                <span className="font-semibold">10,000,000</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-500">Circulating</span>
                <span className="font-semibold">7,500,000</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-2xl border p-6 ${glassCardStyle}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Recent Activity</h3>
            </div>

            <div className="space-y-4">
              {loadingAllTransactions ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-green-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-t-green-500/30 rounded-full animate-pulse" />
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Loading all transactions...
                  </p>
                </div>
              ) : allTransactions && allTransactions.length > 0 ? (
                allTransactions
                  .slice()
                  .sort((a, b) => {
                    // Handle timestamp that could be Date object or string
                    const timeA = a.timestamp
                      ? new Date(a.timestamp).getTime()
                      : 0;
                    const timeB = b.timestamp
                      ? new Date(b.timestamp).getTime()
                      : 0;
                    return timeB - timeA;
                  })
                  .slice(0, 4)
                  .map((tx, i) => {
                    console.log("Rendering transaction:", tx); // Debug log

                    // Safe amount formatting with fallback
                    const formatAmount = (amount) => {
                      if (amount === undefined || amount === null) return "0";
                      try {
                        const num =
                          typeof amount === "string"
                            ? parseFloat(amount)
                            : amount;
                        if (isNaN(num)) return "0";
                        // Handle very small numbers (like 0.0000000000025)
                        if (num < 0.000001 && num > 0)
                          return num.toExponential(2);
                        if (num >= 1000) return num.toFixed(0);
                        return num.toFixed(4);
                      } catch {
                        return "0";
                      }
                    };

                    // Safe timestamp formatting
                    const formatTimeAgo = (timestamp) => {
                      if (!timestamp) return "Unknown";
                      try {
                        const date =
                          timestamp instanceof Date
                            ? timestamp
                            : new Date(timestamp);
                        if (isNaN(date.getTime())) return "Invalid date";

                        const seconds = Math.floor(
                          (Date.now() - date.getTime()) / 1000,
                        );
                        if (seconds < 60) return "just now";
                        if (seconds < 3600)
                          return `${Math.floor(seconds / 60)}m ago`;
                        if (seconds < 86400)
                          return `${Math.floor(seconds / 3600)}h ago`;
                        if (seconds < 604800)
                          return `${Math.floor(seconds / 86400)}d ago`;
                        return date.toLocaleDateString();
                      } catch {
                        return "Unknown";
                      }
                    };

                    // Determine transaction color based on type
                    const getTransactionColor = (type) => {
                      switch (type?.toLowerCase()) {
                        case "swap":
                          return "from-yellow-500 to-amber-500";
                        case "liquidity":
                          return "from-green-500 to-emerald-500";
                        default:
                          return "from-purple-500 to-pink-500";
                      }
                    };

                    // Determine pulse color based on type
                    const getPulseColor = (type) => {
                      switch (type?.toLowerCase()) {
                        case "swap":
                          return "bg-yellow-500";
                        case "liquidity":
                          return "bg-green-500";
                        default:
                          return "bg-purple-500";
                      }
                    };

                    // Get display text based on transaction type
                    const getTransactionDisplay = (tx) => {
                      if (tx.type === "swap") {
                        return (
                          <>
                            <span className="font-mono">
                              {tx.fromToken || "Unknown"}
                            </span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-mono">
                              {tx.toToken || "Unknown"}
                            </span>
                          </>
                        );
                      } else if (tx.type === "liquidity") {
                        return (
                          <>
                            <span className="text-slate-500">Added</span>
                            <span className="font-mono ml-1">
                              {tx.fromToken || "Unknown"}
                            </span>
                            <span className="text-slate-400 mx-1">+</span>
                            <span className="font-mono">
                              {tx.toToken || "Unknown"}
                            </span>
                          </>
                        );
                      }
                      return null;
                    };

                    return (
                      <div
                        key={tx.id || i}
                        className="group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        {/* Background gradient on hover */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getTransactionColor(
                            tx.type,
                          )} opacity-0 group-hover:opacity-5 transition-opacity`}
                        />

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Animated indicator */}
                            <div className="relative">
                              <div
                                className={`w-2 h-2 rounded-full ${getPulseColor(
                                  tx.type,
                                )} animate-pulse`}
                              />
                              <div
                                className={`absolute inset-0 w-2 h-2 rounded-full ${getPulseColor(
                                  tx.type,
                                )} animate-ping opacity-75`}
                              />
                            </div>

                            {/* Transaction details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                <span className="capitalize">
                                  {tx.type || "Transaction"}
                                </span>
                                {" • "}
                                {getTransactionDisplay(tx)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>{formatTimeAgo(tx.timestamp)}</span>
                                {tx.hash && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">
                                      {typeof tx.hash === "string"
                                        ? `${tx.hash.slice(
                                            0,
                                            6,
                                          )}...${tx.hash.slice(-4)}`
                                        : "Invalid hash"}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Amount and explorer link */}
                          <div className="flex items-center gap-3 ml-4">
                            <span className="text-sm font-mono font-medium whitespace-nowrap">
                              {formatAmount(tx.fromAmount)} {tx.fromToken || ""}
                            </span>

                            {tx.hash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group/link"
                                title="View on Etherscan"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-cyan-500 transition-colors" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Additional info for liquidity transactions */}
                        {tx.type === "liquidity" && (
                          <div className="mt-2 ml-7 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Pool:</span>{" "}
                            <span className="font-mono">
                              {formatAmount(tx.fromAmount)} {tx.fromToken} +{" "}
                              {formatAmount(tx.toAmount)} {tx.toToken}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="relative inline-block">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No transactions yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Start swapping or adding liquidity to see your activity
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Protocol Health */}
          <div className={`rounded-2xl border p-6 ${glassCardStyle}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">Protocol Health</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Utilization Rate</span>
                  <span className="font-semibold">78%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-[78%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Protocol Revenue</span>
                  <span className="font-semibold text-green-600">$124.5K</span>
                </div>
                <p className="text-xs text-slate-500">+12.3% from last month</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Treasury</span>
                  <span className="font-semibold">$2.1M</span>
                </div>
                <p className="text-xs text-slate-500">Multi-sig secured</p>
              </div>

              <div className="pt-4">
                <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
