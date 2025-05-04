import React, { useState } from "react";
import { Loader } from "lucide-react";
import { createDid } from "../services/didService";
import { ethers } from "ethers";
import EthereumDIDRegistryArtifact from "../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json";

const ConnectProfile = ({ onClose, onProfileConnected }) => {
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [onChainProfileCID, setOnChainProfileCID] = useState("");
  const [profile, setProfile] = useState(null);
  const [challenge, setChallenge] = useState("");
  const [signature, setSignature] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const generateChallenge = () => {
    return `Login challenge: ${Math.floor(Math.random() * 1000000)} at ${new Date().toISOString()}`;
  };

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      setError("Private key is required");
      return;
    }
    setError("");
    setLoading(true);
    setStatus("Deriving DID...");

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      // 1. Derive the DID from the private key
      const derivedDid = await createDid(privateKey, INFURA_URL, CONTRACT_ADDRESS);
      setDid(derivedDid);

      setStatus("Generating challenge and signing...");
      const challengeMessage = generateChallenge();
      setChallenge(challengeMessage);
      const wallet = new ethers.Wallet(privateKey);
      const sig = await wallet.signMessage(challengeMessage);
      setSignature(sig);

      setPrivateKey("");
      setStatus("Verifying signature...");

      const recoveredAddress = ethers.verifyMessage(challengeMessage, sig);
      const didParts = derivedDid.split(":");
      if (didParts.length < 3) {
        throw new Error("Invalid DID format");
      }
      const didAddress = didParts[didParts.length - 1];
      if (recoveredAddress.toLowerCase() !== didAddress.toLowerCase()) {
        throw new Error("Authentication failed: Signature does not match DID owner");
      }
      setAuthMessage("Authentication successful!");

      setStatus("Fetching on-chain profile CID...");
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const didContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        provider
      );
      const identityAddress = didParts[didParts.length - 1];
      const profileCidOnChain = await didContract.getProfileCID(identityAddress);
      setOnChainProfileCID(profileCidOnChain);
      if (!profileCidOnChain) {
        throw new Error("No profile CID found on-chain for this DID.");
      }

      setStatus("Fetching profile from IPFS...");
      const ipfsUrl = `https://sapphire-near-whippet-156.mypinata.cloud/ipfs/${profileCidOnChain}`;
      const response = await fetch(ipfsUrl);
      const responseText = await response.text();
      let profileJson;
      try {
        profileJson = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse profile JSON. Raw response:", responseText);
        throw new Error("Failed to parse profile JSON from IPFS. Raw response: " + responseText);
      }
      setProfile(profileJson);
      setStatus("Profile fetched successfully!");

      // Callback to update SettingsPage with the connected profile
      setTimeout(() => {
        onProfileConnected(derivedDid, profileJson);
      }, 1000);
    } catch (err) {
      setError(`Error: ${err.message || "An unexpected error occurred"}`);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-yellow-500">Connect to Your Profile</h1>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleConnect}
          className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loading}
        >
          {loading ? <Loader className="animate-spin" size={20} /> : "Connect Profile"}
        </button>
        {loading && status && <p className="mt-4 text-blue-500">{status}</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {authMessage && <p className="mt-4 text-green-500">{authMessage}</p>}
        {did && (
          <div className="mt-4">
            <p><strong>Your DID:</strong> {did}</p>
          </div>
        )}
        {challenge && (
          <div className="mt-4">
            <p><strong>Challenge:</strong> {challenge}</p>
            <p><strong>Signature:</strong> {signature}</p>
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
