import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";
import { useDid } from "../contexts/DidContext";

const RevokeDelegate = () => {
  const navigate = useNavigate();
  const { ethrDid } = useDid();
  const [delegateType, setDelegateType] = useState("");
  const [delegate, setDelegate] = useState("");
  const [status, setStatus] = useState(null);

  // Helper to get signer from browser wallet
  const getBrowserSigner = async () => {
    if (!window.ethereum) throw new Error('No Ethereum provider found');
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    return browserProvider.getSigner();
  };

  const revokeDelegate = async () => {
    try {
      setStatus("⏳ Processing...");

      if (!ethrDid || !delegateType || !delegate) {
        setStatus("❌ Missing required fields. Please fill in all fields.");
        return;
      }

      const identity = ethrDid.split(":").pop();
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // Get signer instead of raw private key
      const signer = await getBrowserSigner();
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        signer
      );

      const delegateTypeHash = ethers.id(delegateType);

      const tx = await DidReg.revokeDelegate(identity, delegateTypeHash, delegate);
      setStatus("⏳ Transaction sent. Waiting for confirmation...");

      const receipt = await tx.wait(3);

      // Look for RevokedDelegate event
      const revokedTopic = ethers.id("RevokedDelegate(address,bytes32,address)");
      const revokedLog = receipt.logs.find(log => log.topics.includes(revokedTopic));

      if (revokedLog) {
        setStatus("🎉 Revocation successful! Delegate removed.");
      } else {
        setStatus("⚠️ No RevokedDelegate event found; revocation uncertain.");
      }

      // Double-check delegate validity
      const isValid = await DidReg.validDelegate(identity, delegateTypeHash, delegate);
      setStatus(`✅ Delegate ${delegate} revoked. Current status: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    } catch (error) {
      console.error("❌ Error during revocation:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900 p-6">
      <div className="bg-white dark:bg-gray-900 p-8 rounded shadow-md max-w-md w-full">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center text-sm text-gray-600">
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>

        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Revoke Delegate
        </h1>

        <div className="mb-4 w-full p-2 rounded bg-gray-100 dark:bg-gray-900">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-500">Your DID</label>
          <p className="mt-1 text-gray-900 dark:text-gray-100 break-all">{ethrDid}</p>
        </div>

        <input
          type="text"
          value={delegateType}
          onChange={e => setDelegateType(e.target.value)}
          placeholder="Delegate Type"
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          value={delegate}
          onChange={e => setDelegate(e.target.value)}
          placeholder="Delegate Address"
          className="mb-4 w-full p-2 border rounded"
          required
        />

        <button
          onClick={revokeDelegate}
          disabled={status && status.includes("Processing")}
          className={`w-full py-2 rounded text-white ${
            status && status.includes("Processing") ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
        >
          {status && status.includes("Processing") ? 'Revoking...' : 'Revoke Delegate'}
        </button>

        {status && <p className="mt-4 text-center text-sm text-yellow-500">{status}</p>}
      </div>
    </div>
  );
};

export default RevokeDelegate;
