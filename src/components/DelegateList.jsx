import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";
import { VerifiedIcon, RefreshCw } from "lucide-react";

const AUTO_REFRESH_INTERVAL_MS = 60000; // 60 seconds

const DelegateList = ({ did }) => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDelegates = useCallback(async () => {
    if (!did) return;
    setLoading(true);
    setError(null);
    setDelegates([]);

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing environment variables.");
      }

      // Extract the identity address from the DID
      const identity = did.split(":").pop();
      console.log(`Fetching delegates for identity: ${identity}`);

      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        provider
      );

      // Create a filter for DIDDelegateChanged events
      const filter = DidReg.filters.DIDDelegateChanged(identity);
      const events = await DidReg.queryFilter(filter);
      console.log("Fetched events:", events);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const delegateMap = {};

      events.forEach((event) => {
        const { delegateType, delegate, validTo } = event.args;
        const validToNumber = Number(validTo);
        if (validToNumber > currentTimestamp) {
          const key = `${delegateType.toString()}_${delegate.toLowerCase()}`;
          delegateMap[key] = {
            delegateType: delegateType.toString(),
            delegateAddress: delegate,
            validTo: validToNumber,
          };
        }
      });

      setDelegates(Object.values(delegateMap));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [did]);

  // Initial fetch
  useEffect(() => {
    fetchDelegates();
  }, [fetchDelegates]);

  // Auto-refresh
  useEffect(() => {
    if (!did) return;
    const interval = setInterval(fetchDelegates, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [did, fetchDelegates]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Delegates List
        </h2>
        <button
          onClick={fetchDelegates}
          disabled={loading}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          {/* <span>Refresh</span> */}
        </button>
      </div>

      {loading && (
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 animate-pulse">
          Loading delegates...
        </p>
      )}
      {error && (
        <p className="text-center text-red-500 mb-4">Error: {error}</p>
      )}
      {!loading && delegates.length === 0 && !error && (
        <p className="text-center text-gray-700 dark:text-gray-300">
          No delegates found for this DID.
        </p>
      )}
      {delegates.length > 0 && (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {delegates.map((delegate, index) => (
            <div
              key={index}
              className="group p-5 border rounded-xl bg-gray-50 dark:bg-gray-900 shadow-md transition-transform hover:scale-105 hover:shadow-lg cursor-pointer animate-fadeIn overflow-x-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">
                  Delegate Type:
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  <VerifiedIcon size={40} />
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {delegate.delegateType}
              </p>
              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                  <span className="font-medium">Address:</span> {delegate.delegateAddress}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  <span className="font-medium">Valid Until: </span>
                  {new Date(delegate.validTo * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DelegateList;
