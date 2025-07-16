import React, { useState } from "react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";
import { useDid } from "../contexts/DidContext";

const CheckDelegate = () => {
  // Pull DID from context
  const { ethrDid } = useDid();
  const [delegateType, setDelegateType] = useState("");
  const [delegate, setDelegate] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkDelegate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing environment variables.");
      }

      // Extract raw address from DID
      const identity = ethrDid.split(":").pop();
      console.log(`Checking delegate for identity: ${identity}`);

      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        provider
      );

      const delegateTypeHash = ethers.id(delegateType);
      const isValid = await DidReg.validDelegate(
        identity,
        delegateTypeHash,
        delegate
      );

      setResult(isValid);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    checkDelegate();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-200 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-yellow-500 flex justify-center">
          Check Delegate
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display DID */}
          <div className="w-full p-2 rounded bg-gray-100 dark:bg-gray-900">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-500">
              Your DID
            </label>
            <p className="mt-1 text-gray-900 dark:text-gray-100 break-all">{ethrDid}</p>
          </div>

          <input
            type="text"
            placeholder="Delegate Type"
            value={delegateType}
            onChange={(e) => setDelegateType(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          <input
            type="text"
            placeholder="Delegate Address"
            value={delegate}
            onChange={(e) => setDelegate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Delegate"}
          </button>

          {error && <p className="text-red-500">Error: {error}</p>}

          {result !== null && (
            <p className={result ? "text-green-500" : "text-red-500"}>
              {result ? "Delegate is valid." : "Delegate is NOT valid."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CheckDelegate;
