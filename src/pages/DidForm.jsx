import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Clipboard, Loader } from "lucide-react";
import { createDid, resolveDid } from "../services/didService";
import {
  storeDidDocument,
  fetchDidDocument,
  updateDidRegistry,
} from "../services/ipfsService";
import { ethers } from "ethers";
import { EthereumDIDRegistry } from "ethr-did-registry";

const DidForm = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [resolvedDid, setResolvedDid] = useState(null);
  const [ipfsCid, setIpfsCid] = useState("");
  const [owner, setOwner] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [storedDids, setStoredDids] = useState([]);

  // Refactored function to verify the DID owner.
  // It returns the owner address instead of setting state directly.
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

      // Connect to Ethereum provider
      const provider = new ethers.JsonRpcProvider(INFURA_URL);

      // Instantiate the DID Registry contract
      const DidReg = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistry.abi,
        provider
      );

      // Call the `identityOwner` function to get the owner's address
      const ownerAddress = await DidReg.identityOwner(identityAddress);
      return ownerAddress;
    } catch (err) {
      throw err;
    }
  };

  // Retry mechanism to verify the owner in case of propagation delays.
  const retryVerifyOwner = async (identityDID, retries = 3, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const ownerAddress = await verifyIdentityOwner(identityDID);
        if (ownerAddress) return ownerAddress;
      } catch (err) {
        // Optionally log the error if needed.
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return null;
  };

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

      // Generate a new DID
      const generatedDid = await createDid(privateKey, INFURA_URL, CONTRACT_ADDRESS);
      setDid(generatedDid);

      // Resolve the DID to get the DID document
      const resolved = await resolveDid(generatedDid, INFURA_URL, CONTRACT_ADDRESS);
      setResolvedDid(resolved);

      // Use the retry mechanism to fetch the owner for the generated DID
      const ownerAddress = await retryVerifyOwner(generatedDid, 3, 3000);
      setOwner(ownerAddress);

      // Store the DID document on IPFS using a filename that includes the DID
      const cid = await storeDidDocument(generatedDid, resolved);
      setIpfsCid(cid);

      // Save the generated DID, CID, and owner in state
      setStoredDids((prev) => [...prev, { did: generatedDid, cid, owner: ownerAddress }]);

      // Update the DID registry on Pinata by appending the new DID record
      const registryCid = await updateDidRegistry({
        did: generatedDid,
        didDocumentCid: cid,
        didOwner: ownerAddress,
      });
      console.log("Updated DID registry CID:", registryCid);
    } catch (err) {
      setError(`Error: ${err?.message || "An unexpected error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDid = async () => {
    const cid = ipfsCid || prompt("Enter the CID to fetch the DID document:");
    if (!cid) return;

    setLoading(true);
    setError("");
    try {
      const fetchedDid = await fetchDidDocument(cid);
      setResolvedDid(fetchedDid);
    } catch (err) {
      setError(`Failed to fetch DID document: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(did).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
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
          className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loading}
        >
          {loading ? <Loader className="animate-spin" size={20} /> : "Generate DID"}
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
            {copySuccess && <p className="text-green-500">Copied to clipboard!</p>}
            {owner && (
              <p className="mt-2 text-gray-600">
                <strong>Owner:</strong> {owner}
              </p>
            )}
          </div>
        )}
        {resolvedDid && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">Resolved DID Document:</h2>
            <pre className="bg-yellow-100 p-4 rounded-md overflow-x-auto">
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
              className="w-full mt-2 py-2 px-4 rounded-md text-white bg-yellow-500 hover:bg-yellow-600"
            >
              Fetch DID Document from IPFS
            </button>
          </div>
        )}
        {storedDids.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-lg">Previously Generated DIDs:</h2>
            <ul>
              {storedDids.map((item, index) => (
                <li key={index} className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md overflow-x-auto">
                  <p>
                    <strong>DID:</strong> {item.did}
                  </p>
                  <p>
                    <strong>CID:</strong> {item.cid}
                  </p>
                  <p>
                    <strong>Owner:</strong> {item.owner || "Unknown Owner"}
                  </p>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      await fetchDidDocument(item.cid);
                      setLoading(false);
                    }}
                    className="mt-2 py-2 px-4 text-white bg-yellow-500 hover:bg-yellow-600 rounded"
                  >
                    Fetch DID Document
                  </button>
                </li>
              ))}
            </ul>
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
