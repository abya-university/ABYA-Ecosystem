import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { useDid } from '../contexts/DidContext';
import { useProfile } from '../contexts/ProfileContext';
import { ethers } from "ethers";
import EthereumDIDRegistryArtifact from "../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json";

const ConnectProfile = ({ onClose, onProfileConnected }) => {
  const { ethrDid } = useDid();
  const { setProfile: setCtxProfile } = useProfile();

  const [onChainProfileCID, setOnChainProfileCID] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Auto-trigger when ethrDid changes
  useEffect(() => {
    if (ethrDid) {
      handleConnect();
    }
  }, [ethrDid]);

  const handleConnect = async () => {
    if (!ethrDid) {
      setError("Connect your wallet to fetch DID.");
      return;
    }
    setError("");
    setLoading(true);
    setStatus("Verifying DID...");

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // DID format: did:ethr:0x123...
      const parts = ethrDid.split(":");
      const identity = parts[parts.length - 1];

      setStatus("Fetching on-chain profile CID...");
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        provider
      );
      const cid = await contract.getProfileCID(identity);
      if (!cid) {
        throw new Error("No profile CID found on-chain for this DID.");
      }
      setOnChainProfileCID(cid);

      setStatus("Fetching profile from IPFS...");
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      const json = await response.json();

      // Store locally for preview
      setProfile(json);
      setStatus("Profile fetched successfully!");

      // Inform parent
      onProfileConnected(ethrDid, json);

      // Also stash into global ProfileContext
      setCtxProfile({
        did:       ethrDid,
        firstName: json.profile?.firstName || "",
        secondName: json.profile?.secondName || "",
        email:      json.profile?.email || ""
      });

    } catch (err) {
      setError(err.message || "Error connecting to profile.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  if (!ethrDid) {
    return (
      <div className="p-6 bg-gray-100 rounded">
        <p className="text-red-500">Please connect your Ethereum wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-yellow-500">
          Connect to Your Profile
        </h1>

        <button
          onClick={handleConnect}
          className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loading}
        >
          {loading ? <Loader className="animate-spin" size={20} /> : "Fetch Profile"}
        </button>

        {loading && status && <p className="mt-4 text-blue-500">{status}</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {ethrDid && (
          <div className="mt-4">
            <p><strong>Your DID:</strong> {ethrDid}</p>
          </div>
        )}
        {onChainProfileCID && (
          <div className="mt-4">
            <p><strong>On-chain Profile CID:</strong> {onChainProfileCID}</p>
          </div>
        )}
        {profile && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">Your Profile</h2>
            <pre className="bg-yellow-100 p-4 rounded">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectProfile;
