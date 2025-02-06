import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const ChangeOwner = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChangeOwner = async () => {
    try {      
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing environment variables: INFURA_URL or CONTRACT_ADDRESS.");
      }

      // Validate inputs
      if (!privateKey || !did || !newOwnerAddress) {
        throw new Error("All fields are required.");
      }

      const identityAddress = did.split(":")[3];
      if (!identityAddress) {
        throw new Error("Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'");
      }

      setLoading(true);
      setError(null);

      // Set up provider and signer
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Instantiate the DID Registry contract
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        wallet 
      );

      // Call the changeOwner function
      const tx = await DidReg.changeOwner(identityAddress, newOwnerAddress);
      const receipt = await tx.wait();

      setTransactionHash(tx.hash);
    } catch (err) {
      setError(err.message);
      setTransactionHash(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">Change DID Owner</h1>

        <input
          type="text"
          placeholder="Current Private Key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        <input
          type="text"
          placeholder="Enter DID (e.g., did:ethr:sepolia:<address>)"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        <input
          type="text"
          placeholder="New Owner Address"
          value={newOwnerAddress}
          onChange={(e) => setNewOwnerAddress(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        <button
          onClick={handleChangeOwner}
          disabled={loading}
          className="w-full p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
        >
          {loading ? "Changing Owner..." : "Change Owner"}
        </button>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {transactionHash && (
          <p className="text-green-500 text-center mt-4">
            Ownership changed successfully! Transaction Hash: {transactionHash}
          </p>
        )}
      </div>
      <div className="flex justify-center space-x-4 p-6">
        <button
          onClick={() => window.history.back()}
          className="border border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-yellow-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};

export default ChangeOwner;
