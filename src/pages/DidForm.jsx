// src/components/DidForm.jsx
import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Clipboard } from "lucide-react";
import { createDid, resolveDid } from "../services/didService";
import { storeDidDocument, fetchDidDocument } from "../services/ipfsService";

const DidForm = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [resolvedDid, setResolvedDid] = useState(null);
  const [ipfsCid, setIpfsCid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Generate DID, resolve it, and store the DID document on Pinata
  const handleGenerateDid = async () => {
    if (!privateKey.trim()) {
      setError("Private key is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // Create the DID and resolve its DID document
      const generatedDid = await createDid(privateKey, INFURA_URL, CONTRACT_ADDRESS);
      setDid(generatedDid);

      const resolved = await resolveDid(generatedDid, INFURA_URL, CONTRACT_ADDRESS);
      setResolvedDid(resolved);

      // Store the resolved DID document on Pinata
      const cid = await storeDidDocument(resolved);
      setIpfsCid(cid);
      console.log("Stored DID document on Pinata, CID:", cid);
    } catch (err) {
      const errorMessage = err?.message || err?.toString() || "An unexpected error occurred";
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a DID document from Pinata by CID
  const handleFetchDid = async () => {
    // If we already have a CID from storage, use it; otherwise, prompt the user.
    const cid = ipfsCid || prompt("Enter the CID to fetch the DID document:");
    if (!cid) return;

    setLoading(true);
    setError("");
    try {
      const fetchedDid = await fetchDidDocument(cid);
      setResolvedDid(fetchedDid);
    } catch (err) {
      setError("Failed to fetch DID document from IPFS");
    } finally {
      setLoading(false);
    }
  };

  // Copy the generated DID to the clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(did);
    alert("DID copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Generate New DID
        </h1>
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
            onClick={() => setShowPrivateKey(!showPrivateKey)}
            className="absolute right-2 top-2 text-gray-500 hover:text-yellow-700"
          >
            {showPrivateKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button
          onClick={handleGenerateDid}
          className={`w-full py-2 px-4 rounded-md text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate DID"}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {did && (
          <div className="mt-4">
            <h2 className="font-bold text-lg flex items-center">
              Generated DID:
              <button onClick={copyToClipboard} className="ml-2 text-gray-600 hover:text-gray-800">
                <Clipboard size={18} />
              </button>
            </h2>
            <p className="text-gray-700 break-all">{did}</p>
          </div>
        )}
        {resolvedDid && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">Resolved DID Document:</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(resolvedDid, null, 2)}
            </pre>
          </div>
        )}
        {ipfsCid && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">Stored on Pinata, CID:</h2>
            <p className="text-gray-700 break-all">{ipfsCid}</p>
            <button
              onClick={handleFetchDid}
              className="w-full mt-2 py-2 px-4 rounded-md text-white bg-blue-500 hover:bg-blue-600"
            >
              Fetch DID Document from IPFS
            </button>
          </div>
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

export default DidForm;
