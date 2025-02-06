import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const AddDelegate = () => {
  const [identityDid, setIdentityDid] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [delegateType, setDelegateType] = useState("");
  const [delegate, setDelegate] = useState("");
  const [validity, setValidity] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("text-gray-700");
  const [receipt, setReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing...");
    setMessageColor("text-blue-500");

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // Extract Ethereum address from DID
      const identity = identityDid.split(":").pop();
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const signer = new ethers.Wallet(privateKey, provider);
      const DidReg = new ethers.Contract(CONTRACT_ADDRESS, EthereumDIDRegistry.abi, signer);
      const delegateTypeHash = ethers.id(delegateType);

      // Send transaction
      setMessage("Transaction sent. Waiting for confirmation...");
      setMessageColor("text-yellow-500");
      
      const tx = await DidReg.addDelegate(identity, delegateTypeHash, delegate, parseInt(validity, 10));
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">Add Delegate to DID</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Identity DID" value={identityDid} onChange={(e) => setIdentityDid(e.target.value)} className="w-full p-2 border rounded" required />
          <input type="password" placeholder="Private Key" value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} className="w-full p-2 border rounded" required />
          <input type="text" placeholder="Delegate Type" value={delegateType} onChange={(e) => setDelegateType(e.target.value)} className="w-full p-2 border rounded" required />
          <input type="text" placeholder="Delegate Address" value={delegate} onChange={(e) => setDelegate(e.target.value)} className="w-full p-2 border rounded" required />
          <input type="number" placeholder="Validity (seconds)" value={validity} onChange={(e) => setValidity(e.target.value)} className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400">Add Delegate</button>
        </form>
        {message && <p className={`mt-4 text-center text-sm ${messageColor}`}>{message}</p>}
        {receipt && <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">{JSON.stringify(receipt, null, 2)}</pre>}
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

export default AddDelegate;
