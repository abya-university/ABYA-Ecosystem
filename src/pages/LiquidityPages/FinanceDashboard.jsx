import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  Shield,
  Zap,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle,
  Info,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Activity,
  Globe,
  Users,
  Award,
  Crown,
  Target,
  Rocket,
  Gift,
  Coins,
  LineChart,
  Layers,
  Network,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  Home,
  BookOpen,
  User,
  LogOut,
  HelpCircle,
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
} from "recharts";
import { useDarkMode } from "../../contexts/themeContext";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";

const FinanceDashboard = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  const {
    transactions,
    allTransactions,
    loading: historyLoading,
    loadingAllTransactions,
  } = useTransactionHistory();
  const [timeframe, setTimeframe] = useState("1m");
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mock data - replace with actual data from your contracts
  const portfolioHistory = [
    { date: "Jan", value: 10000, staked: 6000, liquidity: 4000, rewards: 500 },
    { date: "Feb", value: 12000, staked: 7200, liquidity: 4800, rewards: 600 },
    { date: "Mar", value: 11500, staked: 6900, liquidity: 4600, rewards: 550 },
    { date: "Apr", value: 13500, staked: 8100, liquidity: 5400, rewards: 700 },
    { date: "May", value: 14800, staked: 8880, liquidity: 5920, rewards: 800 },
    { date: "Jun", value: 16000, staked: 9600, liquidity: 6400, rewards: 900 },
  ];

  const revenueData = [
    { date: "Jan", commissions: 500, staking: 300, trading: 200 },
    { date: "Feb", commissions: 600, staking: 400, trading: 250 },
    { date: "Mar", commissions: 550, staking: 350, trading: 220 },
    { date: "Apr", commissions: 700, staking: 450, trading: 280 },
    { date: "May", commissions: 800, staking: 500, trading: 320 },
    { date: "Jun", commissions: 900, staking: 550, trading: 350 },
  ];

  const networkData = [
    { level: "Level 1", members: 5, volume: 25000, commissions: 1250 },
    { level: "Level 2", members: 12, volume: 48000, commissions: 2400 },
    { level: "Level 3", members: 28, volume: 95000, commissions: 4750 },
    { level: "Level 4", members: 45, volume: 156000, commissions: 7800 },
  ];

  const assetAllocation = [
    { name: "Staked", value: 45, amount: "$7,200", color: "#EAB308" },
    { name: "Liquidity", value: 30, amount: "$4,800", color: "#3B82F6" },
    { name: "Rewards", value: 15, amount: "$2,400", color: "#10B981" },
    { name: "Available", value: 10, amount: "$1,600", color: "#8B5CF6" },
  ];

  const activityTransactions = (
    allTransactions.length > 0 ? allTransactions : transactions
  )
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const displayTransactions = activityTransactions.slice(0, 5);
  const isActivityLoading = historyLoading || loadingAllTransactions;

  const formatTransactionType = (tx) => {
    if (tx.type === "swap") return "Swap";
    if (tx.type === "liquidity") return "Liquidity";
    return (
      tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1) || "Transaction"
    );
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    const seconds = Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const recentTransactions = [
    {
      type: "Commission",
      asset: "USDC",
      amount: "+$234.50",
      from: "Level 2 Network",
      timestamp: "2 hours ago",
      status: "completed",
      hash: "0x1234...5678",
    },
    {
      type: "Staking Reward",
      asset: "ABYTKN",
      amount: "+45.2 ABYTKN",
      from: "ETH Pool",
      timestamp: "1 day ago",
      status: "completed",
      hash: "0x8765...4321",
    },
    {
      type: "Swap",
      asset: "ETH → USDC",
      amount: "-1.2 ETH",
      value: "+$1,920",
      timestamp: "3 days ago",
      status: "completed",
      hash: "0x9876...1234",
    },
    {
      type: "Liquidity Fee",
      asset: "USDC",
      amount: "+$12.50",
      from: "ABYTKN/USDC Pool",
      timestamp: "4 days ago",
      status: "completed",
      hash: "0x5432...6789",
    },
  ];

  const stats = {
    totalValue: {
      value: "$16,000",
      change: "+8.1%",
      isPositive: true,
      breakdown: { staked: "$9,600", liquidity: "$4,800", rewards: "$1,600" },
    },
    dailyEarnings: {
      value: "$45.20",
      change: "+12.3%",
      isPositive: true,
      breakdown: { commissions: "$23.50", staking: "$15.70", fees: "$6.00" },
    },
    totalCommissions: {
      value: "$2,450",
      change: "+15.5%",
      isPositive: true,
      breakdown: { level1: "$450", level2: "$800", level3: "$1,200" },
    },
    activeStakes: {
      value: "3",
      change: "0",
      isPositive: true,
      breakdown: { pools: "2", validators: "1" },
    },
    networkSize: {
      value: "89",
      change: "+12",
      isPositive: true,
      breakdown: { direct: "5", indirect: "84" },
    },
    averageAPY: {
      value: "12.5%",
      change: "-0.5%",
      isPositive: false,
      breakdown: { staking: "8.2%", liquidity: "15.3%" },
    },
  };

  const networkLevels = [
    {
      level: 1,
      members: 5,
      volume: "$25K",
      commission: "5%",
      earnings: "$1,250",
    },
    {
      level: 2,
      members: 12,
      volume: "$48K",
      commission: "3%",
      earnings: "$1,440",
    },
    {
      level: 3,
      members: 28,
      volume: "$95K",
      commission: "2%",
      earnings: "$1,900",
    },
    {
      level: 4,
      members: 45,
      volume: "$156K",
      commission: "1%",
      earnings: "$1,560",
    },
  ];

  const activePools = [
    {
      name: "ABYTKN/ETH",
      staked: "1,250 ABYTKN",
      value: "$3,750",
      apy: "15.3%",
      rewards: "$47.80",
      poolFee: "0.3%",
    },
    {
      name: "USDC/ABYTKN",
      staked: "2,500 USDC",
      value: "$2,500",
      apy: "12.8%",
      rewards: "$26.50",
      poolFee: "0.05%",
    },
    {
      name: "ETH Staking",
      staked: "0.5 ETH",
      value: "$800",
      apy: "5.2%",
      rewards: "$3.40",
      poolFee: "10%",
    },
  ];

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

  const sections = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "portfolio", label: "Portfolio", icon: Wallet },
    { id: "network", label: "Network", icon: Network },
    { id: "staking", label: "Staking", icon: Zap },
    { id: "rewards", label: "Rewards", icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                <Rocket className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                ABYA Finance
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </div>
                    {activeSection === section.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-2 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:p-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                  <Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                  Finance Dashboard
                </h1>
              </div>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Track your portfolio, monitor network growth, and manage your
                DeFi positions
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Timeframe Selector */}
              <div className={`flex rounded-xl border p-1 ${glassCardStyle}`}>
                {[
                  { value: "1d", label: "24H" },
                  { value: "1w", label: "1W" },
                  { value: "1m", label: "1M" },
                  { value: "3m", label: "3M" },
                  { value: "1y", label: "1Y" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeframe === option.value
                        ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
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

              {/* Hide/Show Balances */}
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {showBalances ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {Object.entries(stats).map(([key, stat], index) => {
            const icons = {
              totalValue: Wallet,
              dailyEarnings: TrendingUp,
              totalCommissions: DollarSign,
              activeStakes: Zap,
              networkSize: Users,
              averageAPY: Clock,
            };
            const Icon = icons[key];
            const colors = {
              totalValue: "from-blue-500 to-cyan-500",
              dailyEarnings: "from-green-500 to-emerald-500",
              totalCommissions: "from-purple-500 to-pink-500",
              activeStakes: "from-yellow-500 to-amber-500",
              networkSize: "from-indigo-500 to-purple-500",
              averageAPY: "from-red-500 to-rose-500",
            };

            return (
              <div
                key={key}
                className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${cardStyle}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colors[key]} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${colors[key]} bg-opacity-20`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          key === "totalValue"
                            ? "text-blue-600"
                            : key === "dailyEarnings"
                            ? "text-green-600"
                            : key === "totalCommissions"
                            ? "text-purple-600"
                            : key === "activeStakes"
                            ? "text-yellow-600"
                            : key === "networkSize"
                            ? "text-indigo-600"
                            : "text-red-600"
                        } dark:text-white`}
                      />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        stat.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.isPositive ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span className="font-semibold">{stat.change}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {key === "totalValue"
                        ? "Total Value"
                        : key === "dailyEarnings"
                        ? "Daily Earnings"
                        : key === "totalCommissions"
                        ? "Commissions"
                        : key === "activeStakes"
                        ? "Active Stakes"
                        : key === "networkSize"
                        ? "Network Size"
                        : "Avg APY"}
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {showBalances ? stat.value : "••••••"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Sections */}
        {activeSection === "overview" && (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Portfolio Performance */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Portfolio Performance</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Value over time
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioHistory}>
                      <defs>
                        <linearGradient
                          id="colorTotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#EAB308"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#EAB308"
                            stopOpacity={0}
                          />
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
                        dataKey="value"
                        stroke="#EAB308"
                        fill="url(#colorTotal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Revenue Breakdown</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        By source
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
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
                      />
                      <Bar
                        dataKey="commissions"
                        stackId="a"
                        fill="#EAB308"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="staking"
                        stackId="a"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="trading"
                        stackId="a"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Asset Allocation & Network Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Asset Allocation */}
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Asset Allocation</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Portfolio distribution
                    </p>
                  </div>
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={assetAllocation}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                          border: "none",
                          borderRadius: "12px",
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2">
                  {assetAllocation.map((asset) => (
                    <div
                      key={asset.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        />
                        <span className="text-sm">{asset.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {showBalances ? asset.amount : "••••"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Overview */}
              <div
                className={`lg:col-span-2 rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Network Performance</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Downline volume by level
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                        <th className="pb-4 font-medium">Level</th>
                        <th className="pb-4 font-medium">Members</th>
                        <th className="pb-4 font-medium">Volume</th>
                        <th className="pb-4 font-medium">Commission</th>
                        <th className="pb-4 font-medium">Your Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkLevels.map((level) => (
                        <tr
                          key={level.level}
                          className="border-t border-slate-200 dark:border-slate-700"
                        >
                          <td className="py-3 text-sm font-medium">
                            Level {level.level}
                          </td>
                          <td className="py-3 text-sm">{level.members}</td>
                          <td className="py-3 text-sm">{level.volume}</td>
                          <td className="py-3 text-sm text-green-600">
                            {level.commission}
                          </td>
                          <td className="py-3 text-sm font-semibold">
                            {level.earnings}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "portfolio" && (
          <div className={`rounded-2xl border p-6 ${cardStyle}`}>
            <h3 className="text-lg font-semibold mb-4">Portfolio Details</h3>
            <p className="text-slate-500">
              Detailed portfolio view coming soon...
            </p>
          </div>
        )}

        {activeSection === "network" && (
          <div className={`rounded-2xl border p-6 ${cardStyle}`}>
            <h3 className="text-lg font-semibold mb-4">Network Analytics</h3>
            <p className="text-slate-500">Network analytics coming soon...</p>
          </div>
        )}

        {activeSection === "staking" && (
          <>
            {/* Active Pools */}
            <div className={`rounded-2xl border p-6 mb-8 ${cardStyle}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Active Staking Positions</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your current yield-generating positions
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all">
                  Stake More
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activePools.map((pool, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${glassCardStyle}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{pool.name}</h4>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                        {pool.apy} APY
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Staked</span>
                        <span className="font-medium">{pool.staked}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Value</span>
                        <span className="font-medium">{pool.value}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Rewards</span>
                        <span className="font-medium text-green-600">
                          {pool.rewards}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pool Fee</span>
                        <span className="font-medium">{pool.poolFee}</span>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === "rewards" && (
          <div className={`rounded-2xl border p-6 ${cardStyle}`}>
            <h3 className="text-lg font-semibold mb-4">Rewards Dashboard</h3>
            <p className="text-slate-500">Rewards tracking coming soon...</p>
          </div>
        )}

        {/* Recent Transactions - Always visible */}
        <div className={`rounded-2xl border p-6 mt-8 ${cardStyle}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Recent Activity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your latest transactions
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 dark:text-slate-400">
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Asset</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">From/To</th>
                  <th className="pb-4 font-medium">Time</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayTransactions.length > 0 ? (
                  displayTransactions.map((tx, index) => (
                    <tr
                      key={tx.id || index}
                      className="border-t border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.type === "swap"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-purple-500/10 text-purple-600"
                          }`}
                        >
                          {formatTransactionType(tx)}
                        </span>
                      </td>
                      <td className="py-4 font-medium">
                        {tx.fromToken}-{tx.toToken}
                      </td>
                      <td className="py-4 font-mono">
                        {parseFloat(tx.fromAmount).toFixed(2)} →{" "}
                        {parseFloat(tx.toAmount).toFixed(2)}
                      </td>
                      <td className="py-4 text-slate-500 font-mono text-xs">
                        {tx.hash?.substring(0, 10)}...
                      </td>
                      <td className="py-4 text-slate-500">
                        {formatTimeAgo(tx.timestamp)}
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs">Confirmed</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : isActivityLoading ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-500">
                      No transactions yet. Start by adding liquidity or swapping
                      tokens.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              View All Transactions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
