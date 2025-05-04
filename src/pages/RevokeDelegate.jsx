import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry"; // Assuming this package is compatible in a browser environment

const RevokeDelegate = () => {
  const [identityDid, setIdentityDid] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [delegateType, setDelegateType] = useState("");
  const [delegate, setDelegate] = useState("");
  const [status, setStatus] = useState(null);

  const INFURA_URL = import.meta.env.VITE_INFURA_URL;
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  const revokeDelegate = async () => {
    try {
      setStatus("⏳ Processing...");

      // Input validation
      if (!identityDid || !privateKey || !delegateType || !delegate) {
        setStatus("❌ Missing required fields. Please fill in all fields.");
        return;
      }

      // Extract Ethereum address from the DID
      const identity = identityDid.split(":").pop();

      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        setStatus("❌ MetaMask is not installed. Please install MetaMask to continue.");
        return;
      }

      // Connect to Ethereum provider (via Infura)
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const wallet = new ethers.Wallet(privateKey, provider);
      console.log("✅ Transaction sender:", wallet.address);
      console.log("✅ DID identity owner:", identity);

      // // Ensure wallet address is the controller of the DID
      // if (wallet.address.toLowerCase() !== identity.toLowerCase()) {
      //   setStatus("⚠️ Wallet address is not the controller of this DID. Revocation may fail.");
      //   return;
      // }

      // Instantiate the DID Registry contract
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        wallet
      );

      // Encode delegateType
      const delegateTypeHash = ethers.id(delegateType);
      console.log("🔹 Encoded delegateType:", delegateTypeHash);

      // Send transaction to revoke delegate
      const tx = await DidReg.revokeDelegate(identity, delegateTypeHash, delegate);
      setStatus("⏳ Transaction sent. Waiting for confirmation...");

      // Wait for transaction confirmation (3 blocks for extra security)
      const receipt = await tx.wait(3);
      console.log("✅ Transaction confirmed:", receipt);

      // Check for revocation event in logs
      const revokedEvent = receipt.logs.find((log) =>
        log.topics.includes(ethers.id("RevokedDelegate(address,bytes32,address)"))
      );

      if (revokedEvent) {
        setStatus("🎉 Revocation successful! Delegate removed.");
      } else {
        setStatus("⚠️ No RevokedDelegate event found. Revocation may not have been processed correctly.");
      }

      // Verify delegate status
      const isValid = await DidReg.validDelegate(identity, delegateTypeHash, delegate);
      setStatus(`✅ Delegate ${delegate} has been revoked. Delegate new status: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    } catch (error) {
      console.error("❌ Error during revocation:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 p-6">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Revoke Delegate
        </h1>
        <div className="mb-4">
          <input
            type="text"
            value={identityDid}
            onChange={(e) => setIdentityDid(e.target.value)}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter Identity DID"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your private key"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={delegateType}
            onChange={(e) => setDelegateType(e.target.value)}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter Delegate Type"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={delegate}
            onChange={(e) => setDelegate(e.target.value)}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter Delegate Address"
          />
        </div>
        <button
          onClick={revokeDelegate}
          className={`w-full py-2 px-4 rounded-md text-white ${
            status && status.includes("Processing") ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={status && status.includes("Processing")}
        >
          {status && status.includes("Processing") ? "Revoking..." : "Revoke Delegate"}
        </button>
        {status && (
          <p className="text-yellow-500 mt-4 text-center">{status}</p>
        )}
      </div>

    </div>
  );
};

export default RevokeDelegate;
