import React, { useState } from "react";
import {
  Clock,
  Minus,
  ArrowDownUp,
  Droplet,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Activity,
  Zap,
} from "lucide-react";
import SwapComponent from "../../components/Liquidity-Components/SwapComponent";
import AddLiquidity from "../../components/Liquidity-Components/AddLiquidity";
import HistoryComponent from "../../components/Liquidity-Components/HistroryComponent";
import MintComponent from "../../components/Liquidity-Components/MintComponent";
import LiquiditySidebar from "../../components/Liquidity-Components/LiquiditySidebar";
import RemoveLiquidity from "../../components/Liquidity-Components/removeLiquidity";
import { useDarkMode } from "../../contexts/themeContext";

const LiquidityPage = () => {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("swap");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Modern card styles
  const cardStyle = darkMode
    ? "bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
    : "bg-gradient-to-br from-white to-slate-50/90 border-slate-200/70";

  const glassCardStyle = darkMode
    ? "bg-slate-800/40 backdrop-blur-xl border-slate-700/30"
    : "bg-white/70 backdrop-blur-xl border-slate-200/50";

  // Tab configuration
  const tabs = [
    {
      id: "swap",
      label: "Swap",
      icon: ArrowDownUp,
      description: "Trade tokens instantly",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "liquidity",
      label: "Add Liquidity",
      icon: Plus,
      description: "Earn fees by providing liquidity",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "removeLiquidity",
      label: "Remove Liquidity",
      icon: Minus,
      description: "Withdraw your liquidity position",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "history",
      label: "History",
      icon: Clock,
      description: "View your trading activity",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "mint",
      label: "Mint Tokens",
      icon: Droplet,
      description: "Create new tokens for testing",
      color: "from-yellow-500 to-amber-500",
    },
  ];

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative pt-24 px-4 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section with Gradient */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-3xl" />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 p-6 lg:p-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
                    Liquidity Pool
                  </h1>
                </div>
                <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                  Swap tokens, provide liquidity, and earn rewards. Your
                  complete DeFi dashboard for managing positions and tracking
                  performance.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-3">
                <div
                  className={`px-4 py-2 rounded-xl border ${glassCardStyle}`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium">24h Volume</span>
                    <span className="text-sm font-bold">$1.2M</span>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-xl border ${glassCardStyle}`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium">TVL</span>
                    <span className="text-sm font-bold">$5.8M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Trading Panel */}
            <div className="lg:col-span-3">
              <div
                className={`relative rounded-3xl border shadow-xl overflow-hidden ${cardStyle}`}
              >
                {/* Tab Navigation - Modern Design */}
                <div className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  {/* Mobile Tab Selector */}
                  <div className="lg:hidden p-4">
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        {activeTabData && (
                          <>
                            <div
                              className={`p-2 rounded-lg bg-gradient-to-r ${activeTabData.color} bg-opacity-20`}
                            >
                              <activeTabData.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold">
                              {activeTabData.label}
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showMobileMenu ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showMobileMenu && (
                      <div className="absolute left-4 right-4 mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setShowMobileMenu(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                                activeTab === tab.id
                                  ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-yellow-400"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-lg bg-gradient-to-r ${tab.color} bg-opacity-20`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm font-medium flex-1 text-left">
                                {tab.label}
                              </span>
                              {activeTab === tab.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Desktop Tabs */}
                  <div className="hidden lg:flex overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group relative flex-1 px-6 py-4 font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                            isActive
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          {/* Background gradient on hover/active */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${
                              tab.color
                            } opacity-0 transition-opacity duration-300 ${
                              isActive ? "opacity-10" : "group-hover:opacity-5"
                            }`}
                          />

                          <div
                            className={`relative p-2 rounded-lg transition-all duration-300 ${
                              isActive
                                ? `bg-gradient-to-r ${tab.color} bg-opacity-20 scale-110`
                                : "bg-slate-100 dark:bg-slate-800 group-hover:scale-105"
                            }`}
                          >
                            <Icon
                              size={18}
                              className={`transition-colors ${
                                isActive ? "text-white" : ""
                              }`}
                            />
                          </div>

                          <span className="relative whitespace-nowrap">
                            {tab.label}
                          </span>

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 lg:p-8">
                  {/* Active Tab Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span
                          className={`bg-gradient-to-r ${activeTabData?.color} bg-clip-text text-transparent`}
                        >
                          {activeTabData?.label}
                        </span>
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {activeTabData?.description}
                      </p>
                    </div>

                    {/* Refresh button for applicable tabs */}
                    {(activeTab === "swap" || activeTab === "liquidity") && (
                      <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                        <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-yellow-500 group-hover:rotate-180 transition-all duration-500" />
                      </button>
                    )}
                  </div>

                  {/* Tab Components with fade animation */}
                  <div className="transition-opacity duration-300 animate-fadeIn">
                    {activeTab === "swap" && <SwapComponent />}
                    {activeTab === "liquidity" && <AddLiquidity />}
                    {activeTab === "removeLiquidity" && <RemoveLiquidity />}
                    {activeTab === "history" && <HistoryComponent />}
                    {activeTab === "mint" && <MintComponent />}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Enhanced */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Pool Info Card */}
                <div className={`rounded-2xl border p-5 ${glassCardStyle}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold">Pool Overview</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Total Liquidity
                      </span>
                      <span className="font-semibold">$2.45M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Volume (24h)
                      </span>
                      <span className="font-semibold text-green-600">
                        $892K
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Fees (24h)
                      </span>
                      <span className="font-semibold">$2,450</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        APY
                      </span>
                      <span className="font-semibold text-yellow-600">
                        12.5%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Your Stats Card */}
                <div className={`rounded-2xl border p-5 ${glassCardStyle}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">Your Position</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        LP Tokens
                      </span>
                      <span className="font-semibold">1,234.56</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Share of Pool
                      </span>
                      <span className="font-semibold">0.12%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        Earned Fees
                      </span>
                      <span className="font-semibold text-green-600">
                        $45.67
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                    Manage Position
                  </button>
                </div>

                {/* Original Sidebar Component */}
                <LiquiditySidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityPage;
