import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";
import { VerifiedIcon } from "lucide-react";

const DelegateList = ({ did }) => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!did) return; // No DID provided, do not fetch delegates.
    fetchDelegates();
  }, [did]);

  const fetchDelegates = async () => {
    setLoading(true);
    setError(null);
    setDelegates([]);

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing environment variables.");
      }

      // Extract the identity address from the DID (e.g. did:ethr:sepolia:0xABC... becomes 0xABC...)
      const identity = did.split(":").pop();
      console.log(`Fetching delegates for identity: ${identity}`);

      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const DidReg = new ethers.Contract(CONTRACT_ADDRESS, EthereumDIDRegistry.abi, provider);

      // Create a filter for DIDDelegateChanged events for this identity.
      const filter = DidReg.filters.DIDDelegateChanged(identity);
      const events = await DidReg.queryFilter(filter);
      console.log("Fetched events:", events);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const delegateMap = {};

      // Process events to build the current delegate list.
      events.forEach(event => {
        const { delegateType, delegate, validTo } = event.args;
        const validToNumber = Number(validTo);
        // Only include delegates that are still valid.
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Delegates Lists
      </h2>
      {loading && (
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 animate-pulse">
          Loading delegates...
        </p>
      )}
      {error && (
        <p className="text-center text-red-500 mb-4">
          Error: {error}
        </p>
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
                <p className="text-green-600 dark:text-green-400">{<VerifiedIcon size={40}/>}</p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {delegate.delegateType}
              </p>
              <div className="mt-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                  <span className="font-medium">Address:</span> {delegate.delegateAddress}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  <span className="font-medium">Valid Until: </span> {new Date(delegate.validTo * 1000).toLocaleString()}
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
