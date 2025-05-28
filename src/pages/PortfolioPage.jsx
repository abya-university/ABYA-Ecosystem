import React from "react";
import {
  Wallet,
  TrendingUp,
  PieChart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PortfolioPage = () => {
  // Mock data - replace with actual data from your contract
  const portfolioHistory = [
    { date: "Jan", value: 10000 },
    { date: "Feb", value: 12000 },
    { date: "Mar", value: 11500 },
    { date: "Apr", value: 13500 },
    { date: "May", value: 14800 },
    { date: "Jun", value: 16000 },
  ];

  const assetAllocation = [
    { name: "ETH", value: 45, color: "#627EEA" },
    { name: "BTC", value: 30, color: "#F7931A" },
    { name: "USDC", value: 15, color: "#2775CA" },
    { name: "Other", value: 10, color: "#E5E7EB" },
  ];

  const recentTransactions = [
    {
      type: "Stake",
      asset: "ETH",
      amount: "2.5",
      timestamp: "2 hours ago",
      status: "completed",
    },
    {
      type: "Unstake",
      asset: "BTC",
      amount: "0.15",
      timestamp: "1 day ago",
      status: "completed",
    },
    {
      type: "Reward",
      asset: "USDC",
      amount: "150",
      timestamp: "3 days ago",
      status: "completed",
    },
  ];

  const stats = {
    totalValue: {
      value: "$16,000",
      change: "+8.1%",
      isPositive: true,
    },
    dailyReturn: {
      value: "$320",
      change: "+2.3%",
      isPositive: true,
    },
    totalRewards: {
      value: "$1,250",
      change: "+15.5%",
      isPositive: true,
    },
    averageAPY: {
      value: "12.5%",
      change: "-0.5%",
      isPositive: false,
    },
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-8">Portfolio</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Value Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <Wallet size={20} />
                  <span>Total Value</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.totalValue.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.totalValue.isPositive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.totalValue.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.totalValue.change}</span>
              </div>
            </div>
          </div>

          {/* Daily Return Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <TrendingUp size={20} />
                  <span>Daily Return</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.dailyReturn.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.dailyReturn.isPositive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.dailyReturn.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.dailyReturn.change}</span>
              </div>
            </div>
          </div>

          {/* Total Rewards Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <PieChart size={20} />
                  <span>Total Rewards</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.totalRewards.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.totalRewards.isPositive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.totalRewards.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.totalRewards.change}</span>
              </div>
            </div>
          </div>

          {/* Average APY Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <Clock size={20} />
                  <span>Average APY</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.averageAPY.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.averageAPY.isPositive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.averageAPY.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.averageAPY.change}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Value Chart */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              Portfolio Value
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                    }}
                    labelStyle={{ color: "#9CA3AF" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#EAB308"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              Asset Allocation
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={assetAllocation}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-yellow-500 mb-4">
            Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left dark:text-gray-400">
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Asset</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Time</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, index) => (
                  <tr key={index} className="border-t dark:border-gray-700">
                    <td className="py-4">{tx.type}</td>
                    <td className="py-4">{tx.asset}</td>
                    <td className="py-4">{tx.amount}</td>
                    <td className="py-4">{tx.timestamp}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
