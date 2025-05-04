import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const CheckDelegate = () => {
  const [identityDid, setIdentityDid] = useState("");
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

      const identity = identityDid.split(":").pop();
      console.log(`Checking delegate for identity: ${identity}`);

      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const DidReg = new ethers.Contract(CONTRACT_ADDRESS, EthereumDIDRegistry.abi, provider);

      const delegateTypeHash = ethers.id(delegateType);
      const isValidDelegate = await DidReg.validDelegate(identity, delegateTypeHash, delegate);

      setResult(isValidDelegate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();  // Prevents the default form submission behavior
    checkDelegate();  // Calls the checkDelegate function
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-200">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">Check Delegate</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Identity DID"
            value={identityDid}
            onChange={(e) => setIdentityDid(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Delegate Type"
            value={delegateType}
            onChange={(e) => setDelegateType(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Delegate Address"
            value={delegate}
            onChange={(e) => setDelegate(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"  // Ensure the button submits the form
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
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
