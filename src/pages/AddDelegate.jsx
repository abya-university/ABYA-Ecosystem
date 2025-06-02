import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";
import { useDid } from "../contexts/DidContext";

const AddDelegate = () => {
  const navigate = useNavigate();
  const { ethrDid } = useDid();
  const [delegateType, setDelegateType] = useState("");
  const [delegate, setDelegate] = useState("");
  const [validity, setValidity] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-gray-700");
  const [receipt, setReceipt] = useState(null);

  // Get a signer from the user's wallet (MetaMask, etc.)
  const getBrowserSigner = async () => {
    if (!window.ethereum) throw new Error('No Ethereum provider found');
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    // Request accounts if not yet connected
    await browserProvider.send("eth_requestAccounts", []);
    return browserProvider.getSigner();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing...");
    setMessageColor("text-blue-500");

    try {
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
      const identity = ethrDid.split(":").pop();

      // Get signer from wallet instead of raw private key
      const signer = await getBrowserSigner();
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        signer
      );
      const delegateTypeHash = ethers.id(delegateType);

      setMessage("Transaction sent. Waiting for confirmation...");
      setMessageColor("text-yellow-500");

      const tx = await DidReg.addDelegate(
        identity,
        delegateTypeHash,
        delegate,
        parseInt(validity, 10)
      );
      const receiptData = await tx.wait();

      setReceipt(receiptData);
      setMessage(`Delegate added successfully! Tx Hash: ${receiptData.transactionHash}`);
      setMessageColor("text-green-500");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageColor("text-red-500");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-200 rounded-lg">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-sm text-gray-600"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>

        <h2 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Add Delegate to DID
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full p-2 border rounded bg-gray-100">
            <label className="block text-sm font-medium text-gray-700">Your DID</label>
            <p className="mt-1 text-gray-900 break-all">{ethrDid}</p>
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

          <input
            type="number"
            placeholder="Validity (seconds)"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />

          <button
            type="submit"
            className="w-full p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
          >
            Add Delegate
          </button>
        </form>

        {message && <p className={`mt-4 text-center text-sm ${messageColor}`}>{message}</p>}

        {receipt && (
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(receipt, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default AddDelegate;
