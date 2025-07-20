import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const LiquiditySidebar = () => {
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const { balances, poolInfo, txHash, loadBalances, loadPoolInfo } =
    useTransactionHistory();
  const { address, isConnected } = useAccount();

  // Update useEffect to use stable references
  useEffect(() => {
    if (isConnected) {
      loadBalances();
      loadPoolInfo();
      const interval = setInterval(() => {
        loadBalances();
        loadPoolInfo();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, address, loadBalances]);

  return (
    <>
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Token Balances */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-none p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
            Token Balances
          </h3>
          <div className="space-y-3">
            {Object.entries(balances).map(([token, balance]) => (
              <div key={token} className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-400">
                  {token === "TOKEN0"
                    ? "TOKEN0 (USDC)"
                    : token === "TOKEN1"
                    ? "TOKEN1 (ABYTKN)"
                    : token}
                </span>
                <span className="text-gray-500 truncate max-w-[120px] dark:text-yellow-400 font-semibold">
                  {balance}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Pool Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-none p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg dark:text-white font-semibold text-gray-900">
              Pool Information
            </h3>
            <button
              onClick={() => setShowPoolInfo(!showPoolInfo)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white rounded-lg transition-colors"
            >
              <Info
                size={20}
                className="text-gray-600 dark:hover:text-yellow-500"
              />
            </button>
          </div>
          {showPoolInfo && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Liquidity
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]">
                  {poolInfo.liquidity !== "0" ? poolInfo.liquidity : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  24h Volume
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.volume24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  24h Fees
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.fees24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">APR</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.apr}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  TOKEN0 Price
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.token0Price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  TOKEN1 Price
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.token1Price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tick</span>
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {poolInfo.tick}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Sqrt Price X96
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]">
                  {poolInfo.sqrtPriceX96}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Transaction Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-none p-6">
          <h3 className="text-lg dark:text-white font-semibold text-gray-900 mb-4">
            Transaction Status
          </h3>
          {txHash ? (
            <div className="text-sm text-gray-700">
              <CheckCircle
                size={20}
                className="text-green-600 inline-block mr-2"
              />
              Transaction successful! Hash:{" "}
              <span className="font-mono truncate w-[200px] relative text-wrap">
                {txHash}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <AlertCircle size={20} className="inline-block mr-2" />
              No recent transactions
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LiquiditySidebar;
