import React, { useState, useEffect } from "react";
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
  Plus,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { useDarkMode } from "../../contexts/themeContext";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { useActiveAccount } from "thirdweb/react";
import { useVesting } from "../../contexts/VestingContext";
import { useRevenueSharing } from "../../contexts/RevenueSharingContext";
import { useUserPositions } from "../../contexts/fake-liquidity-test-contexts/userPositionContext";
import { ethers } from "ethers";

const PortfolioPage = () => {
  const { darkMode } = useDarkMode();
  const {
    transactions,
    allTransactions,
    loading: historyLoading,
    loadingAllTransactions,
    balances,
    poolInfo,
  } = useTransactionHistory();
  const { vestingData, getVestingInfo } = useVesting();
  const { commissionsBalance, fetchCommissionsBalance } = useRevenueSharing();
  const { positions, getUserPositions } = useUserPositions();
  const [timeframe, setTimeframe] = useState("1m");
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const account = useActiveAccount();
  const address = account?.address || "";

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (getVestingInfo && address) {
        await getVestingInfo(address);
      }
      if (fetchCommissionsBalance) {
        await fetchCommissionsBalance();
      }
      if (getUserPositions) {
        await getUserPositions();
      }
    };
    loadData();
  }, [address]);

  // Calculate actual asset allocation from balances
  const calculateAssetAllocation = () => {
    const abytknBal = parseFloat(balances.ABYTKN || 0);
    const usdc = parseFloat(balances.USDC || 0);
    const eth = parseFloat(balances.ETH || 0);

    const abytknUSDPrice = parseFloat(poolInfo?.token0Price) || 1000;
    const abytknUSD = abytknBal / abytknUSDPrice;
    const usdcUSD = usdc;
    const ethUSD = eth * 1600; // Simplified ETH price

    const total = abytknUSD + usdcUSD + ethUSD;

    if (total === 0) {
      return [
        {
          name: "No Assets",
          value: 100,
          amount: "0",
          usd: 0,
          color: "#94A3B8",
        },
      ];
    }

    const allocation = [];
    if (abytknUSD > 0) {
      allocation.push({
        name: "ABYTKN",
        value: (abytknUSD / total) * 100,
        amount: abytknBal.toFixed(2),
        usd: abytknUSD,
        color: "#EAB308",
      });
    }
    if (usdcUSD > 0) {
      allocation.push({
        name: "USDC",
        value: (usdcUSD / total) * 100,
        amount: usdc.toFixed(2),
        usd: usdcUSD,
        color: "#2775CA",
      });
    }
    if (ethUSD > 0) {
      allocation.push({
        name: "ETH",
        value: (ethUSD / total) * 100,
        amount: eth.toFixed(4),
        usd: ethUSD,
        color: "#627EEA",
      });
    }

    return allocation;
  };

  const assetAllocation = calculateAssetAllocation();

  // Calculate staking positions from actual user liquidity positions
  const stakingPositions = positions.map((pos, index) => ({
    pool: `Position #${pos.tokenId}`,
    staked: `${parseFloat(pos.liquidity || 0).toFixed(2)} LP`,
    value: `$${(parseFloat(pos.liquidity || 0) * 0.001).toFixed(2)}`, // Simplified conversion
    apy: poolInfo.apr !== "N/A" ? `${poolInfo.apr}%` : "N/A",
    rewards: `$${(
      parseFloat(pos.fees?.token0 || 0) + parseFloat(pos.fees?.token1 || 0)
    ).toFixed(2)}`,
    lockTime: "Flexible",
  }));

  const activityTransactions = (
    allTransactions.length > 0 ? allTransactions : transactions
  )
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  // Calculate total value
  const calculateTotalValue = () => {
    const total = assetAllocation.reduce((sum, asset) => sum + asset.usd, 0);
    return `$${total.toFixed(2)}`;
  };

  // Calculate total rewards from vesting
  const calculateTotalRewards = () => {
    if (!vestingData?.vested) return "$0";
    const vested = parseFloat(ethers.formatEther(vestingData.vested));
    const abytknUSDPrice = parseFloat(poolInfo?.token0Price) || 1000;
    const vestedUSD = vested / abytknUSDPrice;
    return `$${vestedUSD.toFixed(2)}`;
  };

  // Mock data - replace with actual data from your contract
  const portfolioHistory = [
    { date: "Jan", value: 10000, staked: 6000, liquidity: 4000 },
    { date: "Feb", value: 12000, staked: 7200, liquidity: 4800 },
    { date: "Mar", value: 11500, staked: 6900, liquidity: 4600 },
    { date: "Apr", value: 13500, staked: 8100, liquidity: 5400 },
    { date: "May", value: 14800, staked: 8880, liquidity: 5920 },
    { date: "Jun", value: 16000, staked: 9600, liquidity: 6400 },
  ];

  const recentTransactions = [
    {
      type: "Stake",
      asset: "ETH",
      amount: "2.5",
      value: "$4,000",
      timestamp: "2 hours ago",
      status: "completed",
      hash: "0x1234...5678",
    },
    {
      type: "Unstake",
      asset: "BTC",
      amount: "0.15",
      value: "$4,800",
      timestamp: "1 day ago",
      status: "completed",
      hash: "0x8765...4321",
    },
    {
      type: "Reward Claim",
      asset: "USDC",
      amount: "150",
      value: "$150",
      timestamp: "3 days ago",
      status: "completed",
      hash: "0x9876...1234",
    },
    {
      type: "Swap",
      asset: "ETH → USDC",
      amount: "1.2 ETH",
      value: "$1,920",
      timestamp: "5 days ago",
      status: "completed",
      hash: "0x5432...6789",
    },
  ];

  const stats = {
    totalValue: {
      value: calculateTotalValue(),
      change: "+8.1%",
      isPositive: true,
      breakdown: {
        total: calculateTotalValue(),
        positions: stakingPositions.length,
      },
    },
    dailyReturn: {
      value: "$0.00",
      change: "+2.3%",
      isPositive: true,
      breakdown: { staking: "$0.00", fees: "$0.00" },
    },
    totalRewards: {
      value: calculateTotalRewards(),
      change: "+15.5%",
      isPositive: true,
      breakdown: { vested: calculateTotalRewards(), pending: "$0.00" },
    },
    averageAPY: {
      value: poolInfo.apr !== "N/A" ? `${poolInfo.apr}%` : "N/A",
      change: "-0.5%",
      isPositive: false,
      breakdown: { min: "5.2%", max: "18.5%" },
    },
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText("0x1234...5678");
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
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

  // Truncate address with dots
  const truncateAddress = (addr) => {
    if (!addr) return "";
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6 transition-colors duration-300 pt-20 md:pt-[100px]">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-green-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent rounded-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:p-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Portfolio Dashboard
                </h1>
              </div>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Track your assets, monitor performance, and manage your DeFi
                positions
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Address Display */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${glassCardStyle}`}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-mono">
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={copyAddress}
                  className="hover:text-yellow-500 transition-colors"
                >
                  {copiedAddress ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

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
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats).map(([key, stat], index) => {
            const icons = {
              totalValue: Wallet,
              dailyReturn: TrendingUp,
              totalRewards: PieChart,
              averageAPY: Clock,
            };
            const Icon = icons[key];
            const colors = {
              totalValue: "from-blue-500 to-cyan-500",
              dailyReturn: "from-green-500 to-emerald-500",
              totalRewards: "from-purple-500 to-pink-500",
              averageAPY: "from-yellow-500 to-amber-500",
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
                          key === "totalValue"
                            ? "text-blue-600"
                            : key === "dailyReturn"
                            ? "text-green-600"
                            : key === "totalRewards"
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
                      {key === "totalValue"
                        ? "Total Portfolio Value"
                        : key === "dailyReturn"
                        ? "Daily Return"
                        : key === "totalRewards"
                        ? "Total Rewards"
                        : "Average APY"}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {showBalances ? stat.value : "••••••"}
                    </p>

                    {/* Breakdown */}
                    {key === "totalValue" && stat.breakdown && (
                      <div className="mt-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Staked:</span>
                          <span className="font-medium">
                            {showBalances ? stat.breakdown.staked : "••••"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Liquidity:</span>
                          <span className="font-medium">
                            {showBalances ? stat.breakdown.liquidity : "••••"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Value Chart */}
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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-500">Staked</span>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioHistory}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorStaked"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
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
                    stroke="#3B82F6"
                    fill="url(#colorStaked)"
                  />
                  <Area
                    type="monotone"
                    dataKey="liquidity"
                    stackId="1"
                    stroke="#EAB308"
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                  Current portfolio distribution
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[250px]">
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

              <div className="space-y-3">
                {assetAllocation.map((asset) => (
                  <div
                    key={asset.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: asset.color }}
                      />
                      <span className="text-sm font-medium">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{asset.amount}</p>
                      <p className="text-xs text-slate-500">
                        {showBalances ? asset.usd : "••••"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Staking Positions */}
        <div
          className={`rounded-2xl border p-6 mb-8 transition-all duration-300 hover:shadow-xl ${cardStyle}`}
        >
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
            <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/25 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Stake More
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stakingPositions.map((position, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${glassCardStyle}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{position.pool}</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">
                    {position.apy} APY
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Staked</span>
                    <span className="font-medium">{position.staked}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Value</span>
                    <span className="font-medium">{position.value}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Rewards</span>
                    <span className="font-medium text-green-600">
                      {position.rewards}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lock Period</span>
                    <span className="font-medium">{position.lockTime}</span>
                  </div>
                </div>
                <button className="w-full mt-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`rounded-2xl border p-6 ${cardStyle}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Recent Transactions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your latest activity on the protocol
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-yellow-500 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 dark:text-slate-400">
                  <th className="pb-4 font-medium">Type</th>
                  <th className="pb-4 font-medium">Asset</th>
                  <th className="pb-4 font-medium">Amount</th>
                  <th className="pb-4 font-medium">Value</th>
                  <th className="pb-4 font-medium">Time</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {activityTransactions.length > 0 ? (
                  activityTransactions.map((tx, index) => {
                    const formatTimeAgo = (timestamp) => {
                      if (!timestamp) return "Unknown";
                      const seconds = Math.floor(
                        (Date.now() - new Date(timestamp).getTime()) / 1000,
                      );
                      if (seconds < 60) return "just now";
                      if (seconds < 3600)
                        return `${Math.floor(seconds / 60)}m ago`;
                      if (seconds < 86400)
                        return `${Math.floor(seconds / 3600)}h ago`;
                      return `${Math.floor(seconds / 86400)}d ago`;
                    };
                    return (
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
                            {tx.type?.charAt(0).toUpperCase() +
                              tx.type?.slice(1) || "Tx"}
                          </span>
                        </td>
                        <td className="py-4 font-medium">
                          {tx.fromToken}/{tx.toToken}
                        </td>
                        <td className="py-4 font-mono">
                          {parseFloat(tx.fromAmount).toFixed(4)}
                        </td>
                        <td className="py-4 font-mono">
                          {parseFloat(tx.toAmount).toFixed(4)}
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
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500 truncate w-24">
                              {tx.hash?.substring(0, 10)}...
                            </span>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-yellow-500 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : historyLoading || loadingAllTransactions ? (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-slate-500">
                      No transactions yet. Start trading to see activity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <p className="text-sm text-slate-500">
              Showing {Math.min(5, transactions.length)} of{" "}
              {transactions.length} transactions
            </p>
            <button className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              View All →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
