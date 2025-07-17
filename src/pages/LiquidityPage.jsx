import React, { useState } from "react";
import SwapComponent from "../components/Liquidity-Components/SwapComponent";
import AddLiquidity from "../components/Liquidity-Components/AddLiquidity";
import HistoryComponent from "../components/Liquidity-Components/HistroryComponent";
import MintComponent from "../components/Liquidity-Components/MintComponent";
import LiquiditySidebar from "../components/Liquidity-Components/LiquiditySidebar";
import RemoveLiquidity from "../components/Liquidity-Components/removeLiquidity";
import { Clock, Minus, ArrowDownUp, Droplet, Plus } from "lucide-react";

const LiquidityPage = () => {
  const [activeTab, setActiveTab] = useState("swap");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Main Container */}
      <div className="pt-[100px] px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold text-yellow-500 mb-2">
                Liquidity Pool
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Your journey of swapping & earning rewards
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Trading Panel */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTab("swap")}
                      className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative ${
                        activeTab === "swap"
                          ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ArrowDownUp size={20} />
                      Swap
                      {activeTab === "swap" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("liquidity")}
                      className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative ${
                        activeTab === "liquidity"
                          ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Plus size={20} />
                      Add Liquidity
                      {activeTab === "liquidity" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("removeLiquidity")}
                      className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative ${
                        activeTab === "removeLiquidity"
                          ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Minus size={20} />
                      Remove Liquidity
                      {activeTab === "removeLiquidity" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("history")}
                      className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative ${
                        activeTab === "history"
                          ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Clock size={20} />
                      History
                      {activeTab === "history" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("mint")}
                      className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative ${
                        activeTab === "mint"
                          ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Droplet size={20} />
                      Mint Tokens
                      {activeTab === "mint" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
                      )}
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 lg:p-8">
                  {/* Swap Tab */}
                  {activeTab === "swap" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Swap Tokens
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Trade tokens instantly
                        </div>
                      </div>
                      <SwapComponent />
                    </div>
                  )}

                  {/* Add Liquidity Tab */}
                  {activeTab === "liquidity" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Add Liquidity
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Earn fees by providing liquidity
                        </div>
                      </div>
                      <AddLiquidity />
                    </div>
                  )}

                  {/* Remove Liquidity Tab */}
                  {activeTab === "removeLiquidity" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Remove Liquidity
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Withdraw your liquidity position
                        </div>
                      </div>
                      <RemoveLiquidity />
                    </div>
                  )}

                  {/* Transaction History Tab */}
                  {activeTab === "history" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Transaction History
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          View your trading activity
                        </div>
                      </div>
                      <HistoryComponent />
                    </div>
                  )}

                  {/* Mint Tokens Tab */}
                  {activeTab === "mint" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Mint Tokens
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Create new tokens for testing
                        </div>
                      </div>
                      <MintComponent />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-[120px]">
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
