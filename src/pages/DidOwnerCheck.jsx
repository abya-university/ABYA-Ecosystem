import React, { useState } from "react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const VerifyDIDOwner = () => {
  const [did, setDid] = useState("");
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyIdentityOwner = async (identityDID) => {
    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing environment variables");
      }

      // Extract the Ethereum address from the DID string
      const identityAddress = identityDID.split(":")[3]; // Assumes DID format: did:ethr:sepolia:<address>
      if (!identityAddress) {
        throw new Error("Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'");
      }

      setLoading(true);
      setError(null);

      // Connect to Ethereum provider
      const provider = new ethers.JsonRpcProvider(INFURA_URL);

      // Instantiate the DID Registry contract
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi, // Ethereum DID Registry ABI
        provider
      );

      // Call the `identityOwner` function
      const ownerAddress = await DidReg.identityOwner(identityAddress);
      setOwner(ownerAddress);
    } catch (err) {
      setError(err.message);
      setOwner(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (did) {
      verifyIdentityOwner(did);
    } else {
      setError("Please enter a valid DID.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-200 rounded-lg">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">Verify DID Owner</h1>

        <input
          type="text"
          placeholder="Enter DID (e.g., did:ethr:sepolia:<address>)"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
        >
          {loading ? "Verifying..." : "Verify Owner"}
        </button>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {owner && (
          <p className="text-green-500 text-center mt-4">
            Owner Address: {owner}
          </p>
        )}
      </div>
    </div>
  
  );
};

export default VerifyDIDOwner;
