import { Plus, ArrowDownUp, Activity, Clock } from "lucide-react";
import { useTransactionHistory } from "../../contexts/fake-liquidity-test-contexts/historyContext";

const HistoryComponent = () => {
  const { refreshHistory, loading, transactions } = useTransactionHistory();

  const TRANSACTION_TYPES = {
    SWAP: 0,
    LIQUIDITY: 1,
  };
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Transactions
          </h3>
          <button
            onClick={refreshHistory}
            className="px-3 py-1 bg-yellow-100 dark:bg-gray-700 text-yellow-600 dark:text-yellow-500 rounded-lg hover:bg-yellow-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity
              size={48}
              className="mx-auto mb-4 opacity-50 animate-spin"
            />
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...transactions]
              .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp, newest first
              .map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {tx.type === "swap" ? (
                        <ArrowDownUp
                          size={16}
                          className="text-yellow-600 dark:text-yellow-500"
                        />
                      ) : (
                        <Plus
                          size={16}
                          className="text-green-600 dark:text-green-500"
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {tx.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === "confirmed"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.timestamp.toLocaleDateString()}{" "}
                      {tx.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {tx.type === "swap" ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tx.token0Amount}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {tx.token0Symbol}
                        </span>
                        <ArrowDownUp size={12} className="mx-1 text-gray-400" />
                        <span className="font-medium">{tx.token1Amount}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {tx.token1Symbol}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Added</span>
                        <span className="font-medium">{tx.token0Amount}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {tx.token0Symbol}
                        </span>
                        <span>+</span>
                        <span className="font-medium">{tx.token1Amount}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {tx.token1Symbol}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[200px] hover:max-w-full transition-all duration-300">
                      {tx.hash}
                    </div>
                    <a
                      href={`https://aware-fake-trim-testnet.explorer.testnet.skalenodes.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-600 dark:text-yellow-500 hover:text-yellow-800 dark:hover:text-yellow-400 hover:underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HistoryComponent;
