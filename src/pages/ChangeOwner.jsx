import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const ChangeOwner = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleChangeOwner = async () => {
    try {
      // Retrieve environment variables
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      if (!INFURA_URL || !CONTRACT_ADDRESS) {
        throw new Error(
          "Missing environment variables: INFURA_URL or CONTRACT_ADDRESS."
        );
      }

      // Validate inputs
      if (!privateKey || !did || !newOwnerAddress) {
        throw new Error("All fields are required.");
      }

      // Validate DID format: expecting format "did:ethr:sepolia:<address>"
      const didParts = did.split(":");
      if (didParts.length < 4 || !ethers.isAddress(didParts[3])) {
        throw new Error(
          "Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'"
        );
      }
      const identityAddress = didParts[3];

      // Validate new owner address
      if (!ethers.isAddress(newOwnerAddress)) {
        throw new Error("Invalid new owner address.");
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

      // Call the changeOwner function on the contract
      const tx = await DidReg.changeOwner(identityAddress, newOwnerAddress);
      await tx.wait();

      setTransactionHash(tx.hash);
    } catch (err) {
      setError(err.message);
      setTransactionHash(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-200 rounded-lg">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Change DID Owner
        </h1>

        {/* DID Input */}
        <input
          type="text"
          placeholder="Enter DID (e.g., did:ethr:sepolia:<address>)"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        {/* Private Key Input with Toggle Visibility */}
        <div className="mb-4 relative">
          <input
            id="privateKey"
            type={showPrivateKey ? "text" : "password"}
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300 pr-10"
            placeholder="Enter your private key"
          />
          <button
            type="button"
            onClick={() => setShowPrivateKey((prev) => !prev)}
            className="absolute right-2 top-2 text-gray-500 hover:text-yellow-700"
          >
            {showPrivateKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* New Owner Address Input */}
        <input
          type="text"
          placeholder="New Owner Address"
          value={newOwnerAddress}
          onChange={(e) => setNewOwnerAddress(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        />

        {/* Change Owner Button */}
        <button
          onClick={handleChangeOwner}
          disabled={loading}
          className="w-full p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
        >
          {loading ? "Changing Owner..." : "Change Owner"}
        </button>

        {/* Error Message */}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        {/* Success Message */}
        {transactionHash && (
          <p className="text-green-500 text-center mt-4">
            Ownership changed successfully! Transaction Hash: {transactionHash}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangeOwner;
