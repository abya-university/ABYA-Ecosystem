import React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
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
} from "recharts";

const AnalyticsPage = () => {
  // Mock data - replace with actual data from your contract
  const tvlHistory = [
    { date: "Jan", tvl: 800000 },
    { date: "Feb", tvl: 1200000 },
    { date: "Mar", tvl: 1000000 },
    { date: "Apr", tvl: 1500000 },
    { date: "May", tvl: 1800000 },
    { date: "Jun", tvl: 2000000 },
  ];

  const volumeData = [
    { date: "Jan", volume: 50000 },
    { date: "Feb", volume: 75000 },
    { date: "Mar", volume: 60000 },
    { date: "Apr", volume: 90000 },
    { date: "May", volume: 85000 },
    { date: "Jun", volume: 100000 },
  ];

  const stakingData = [
    { date: "Jan", stakers: 100, totalStaked: 500000 },
    { date: "Feb", stakers: 150, totalStaked: 750000 },
    { date: "Mar", stakers: 200, totalStaked: 900000 },
    { date: "Apr", stakers: 250, totalStaked: 1200000 },
    { date: "May", stakers: 300, totalStaked: 1500000 },
    { date: "Jun", stakers: 350, totalStaked: 1800000 },
  ];

  const stats = {
    tvl: {
      value: "$2.0M",
      change: "+15.3%",
      isPositive: true,
    },
    volume24h: {
      value: "$145.2K",
      change: "-5.2%",
      isPositive: false,
    },
    activeStakers: {
      value: "350",
      change: "+12.5%",
      isPositive: true,
    },
    apy: {
      value: "12.5%",
      change: "+2.3%",
      isPositive: true,
    },
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-8">Analytics</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* TVL Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <BarChart3 size={20} />
                  <span>Total TVL</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.tvl.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.tvl.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {stats.tvl.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.tvl.change}</span>
              </div>
            </div>
          </div>

          {/* Volume Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <TrendingUp size={20} />
                  <span>24h Volume</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.volume24h.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.volume24h.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {stats.volume24h.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.volume24h.change}</span>
              </div>
            </div>
          </div>

          {/* Active Stakers Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <Users size={20} />
                  <span>Active Stakers</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.activeStakers.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.activeStakers.isPositive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.activeStakers.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.activeStakers.change}</span>
              </div>
            </div>
          </div>

          {/* APY Card */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                  <DollarSign size={20} />
                  <span>Current APY</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                  {stats.apy.value}
                </div>
              </div>
              <div
                className={`flex items-center ${
                  stats.apy.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {stats.apy.isPositive ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
                <span>{stats.apy.change}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* TVL Chart */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              TVL History
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tvlHistory}>
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
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke="#EAB308"
                    fill="#EAB308"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              Trading Volume
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
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
                  <Bar dataKey="volume" fill="#EAB308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staking History */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              Total Staked Over Time
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stakingData}>
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
                    dataKey="totalStaked"
                    stroke="#EAB308"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stakers Growth */}
          <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
            <h3 className="text-xl font-semibold text-yellow-500 mb-4">
              Number of Stakers
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stakingData}>
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
                    dataKey="stakers"
                    stroke="#EAB308"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
