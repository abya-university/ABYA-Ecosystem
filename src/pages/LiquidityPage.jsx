import React, { useState } from "react";
import { BarChart3, ArrowDown, ArrowUp } from "lucide-react";

const LiquidityPage = () => {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  // Mock data - replace with actual Web3 calls
  const stats = {
    totalLiquidity: "1,000,000 ABYTKN",
    totalStaked: "750,000 ABYTKN",
    rewardRate: "0.3%",
    yourStake: "5,000 ABYTKN",
    yourRewards: "150 ABYTKN",
    apr: "12.5%",
    balance: 10000, // Added numeric balance for calculations
    stakedBalance: 5000, // Added numeric staked balance
  };

  // Handler for stake input
  const handleStakeInput = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Validate the input
    if (numericValue === "" || parseFloat(numericValue) <= stats.balance) {
      setStakeAmount(numericValue);
    }
  };

  // Handler for unstake input
  const handleUnstakeInput = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Validate the input
    if (
      numericValue === "" ||
      parseFloat(numericValue) <= stats.stakedBalance
    ) {
      setUnstakeAmount(numericValue);
    }
  };

  // Handler for MAX buttons
  const handleMaxStake = () => {
    setStakeAmount(stats.balance.toString());
  };

  const handleMaxUnstake = () => {
    setUnstakeAmount(stats.stakedBalance.toString());
  };

  // Handler for stake submission
  const handleStakeSubmit = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid amount to stake");
      return;
    }
    if (parseFloat(stakeAmount) > stats.balance) {
      alert("Insufficient balance");
      return;
    }
    // Add your staking logic here
    console.log("Staking:", stakeAmount, "ABYTKN");
  };

  // Handler for unstake submission
  const handleUnstakeSubmit = () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      alert("Please enter a valid amount to unstake");
      return;
    }
    if (parseFloat(unstakeAmount) > stats.stakedBalance) {
      alert("Insufficient staked balance");
      return;
    }
    // Add your unstaking logic here
    console.log("Unstaking:", unstakeAmount, "ABYTKN");
  };

  return (
    <div className="dark:bg-gray-900 dark:text-gray-100 bg-white text-gray-900 min-h-screen p-6 transition-colors duration-300 pt-[100px]">
      {/* Main Stats */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 mb-8">
          Liquidity Pool
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
              <BarChart3 size={20} />
              <span>Total TVL</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
              {stats.totalLiquidity}
            </div>
          </div>

          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
              <BarChart3 size={20} />
              <span>Total Staked</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
              {stats.totalStaked}
            </div>
          </div>

          <div
            className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
          >
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
              <BarChart3 size={20} />
              <span>APR</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-300">
              {stats.apr}
            </div>
          </div>
        </div>

        {/* Staking Interface */}
        <div className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200 transform hover:scale-105 transition-transform duration-1000 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Stake Section */}
            <div className="flex-1">
              <h3 className="text-yellow-500 text-xl font-semibold mb-4">
                Stake
              </h3>
              <div className="p-4 mb-4 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <input
                  type="number"
                  placeholder="Enter amount to stake"
                  value={stakeAmount}
                  onChange={(e) => handleStakeInput(e.target.value)}
                  min="0"
                  max={stats.balance}
                  step="any"
                  className="w-full p-3 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-300">
                  <span>Balance: {stats.balance.toLocaleString()} ABYTKN</span>
                  <button
                    onClick={handleMaxStake}
                    className="text-yellow-500 hover:text-yellow-400"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <button
                onClick={handleStakeSubmit}
                disabled={
                  !stakeAmount ||
                  parseFloat(stakeAmount) <= 0 ||
                  parseFloat(stakeAmount) > stats.balance
                }
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDown size={20} />
                Stake Tokens
              </button>
            </div>

            {/* Unstake Section */}
            <div className="flex-1">
              <h3 className="text-yellow-500 text-xl font-semibold mb-4">
                Unstake
              </h3>
              <div className="p-4 mb-4 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
                <input
                  type="number"
                  placeholder="Enter amount to unstake"
                  value={unstakeAmount}
                  onChange={(e) => handleUnstakeInput(e.target.value)}
                  min="0"
                  max={stats.stakedBalance}
                  step="any"
                  className="w-full p-3 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-300">
                  <span>
                    Staked: {stats.stakedBalance.toLocaleString()} ABYTKN
                  </span>
                  <button
                    onClick={handleMaxUnstake}
                    className="text-yellow-500 hover:text-yellow-400"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <button
                onClick={handleUnstakeSubmit}
                disabled={
                  !unstakeAmount ||
                  parseFloat(unstakeAmount) <= 0 ||
                  parseFloat(unstakeAmount) > stats.stakedBalance
                }
                className="w-full bg-cyan-950 hover:bg-cyan-900 text-gray-300 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp size={20} />
                Unstake Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Your Position */}
        <div
          className="p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200
                transform hover:scale-105 transition-transform duration-1000"
        >
          <h3 className="text-yellow-500 text-xl font-semibold mb-4">
            Your Position
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center w-full p-3 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white">
              <span className="text-gray-300">Staked Balance</span>
              <span className="text-gray-300 font-bold">{stats.yourStake}</span>
            </div>
            <div className="flex justify-between items-center w-full p-3 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:bg-gray-800 dark:text-white">
              <span className="text-gray-300">Pending Rewards</span>
              <span className="text-yellow-500 font-bold">
                {stats.yourRewards}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityPage;
