import React, { useState, useEffect } from "react";
import {
  Loader,
  User,
  Shield,
  Database,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useDid } from "../contexts/DidContext";
import { useProfile } from "../contexts/ProfileContext";
import { ethers } from "ethers";
import EthereumDIDRegistryArtifact from "../artifacts/contracts/EthereumDIDRegistry/EthereumDIDRegistry.sol/EthereumDIDRegistry.json";

const ConnectProfile = ({ onClose, onProfileConnected }) => {
  const { ethrDid } = useDid();
  const { setProfile: setCtxProfile } = useProfile();

  const [onChainProfileCID, setOnChainProfileCID] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const steps = [
    {
      icon: Shield,
      label: "Verifying DID",
      desc: "Validating your decentralized identity",
    },
    {
      icon: Database,
      label: "Fetching Profile CID",
      desc: "Retrieving profile reference from blockchain",
    },
    {
      icon: ExternalLink,
      label: "Loading from IPFS",
      desc: "Fetching your profile data from IPFS",
    },
    {
      icon: CheckCircle,
      label: "Complete",
      desc: "Profile successfully loaded",
    },
  ];

  // Auto-trigger when ethrDid changes
  useEffect(() => {
    if (ethrDid) {
      handleConnect();
    }
  }, [ethrDid]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleConnect = async () => {
    if (!ethrDid) {
      setError("Connect your wallet to fetch DID.");
      return;
    }
    setError("");
    setLoading(true);
    setCurrentStep(0);
    setStatus("Verifying DID...");

    try {
      const RPC_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env
        .VITE_CONTRACT_ADDRESS;

      // DID format: did:ethr:0x123...
      const parts = ethrDid.split(":");
      const identity = parts[parts.length - 1];

      setCurrentStep(1);
      setStatus("Fetching on-chain profile CID...");
      const provider = new ethers.JsonRpcProvider(RPC_URL);
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

      setCurrentStep(2);
      setStatus("Fetching profile from IPFS...");
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      const json = await response.json();

      // Store locally for preview
      setProfile(json);
      setCurrentStep(3);
      setStatus("Profile fetched successfully!");

      // Inform parent
      onProfileConnected(ethrDid, json);

      // Also stash into global ProfileContext
      setCtxProfile({
        did: ethrDid,
        firstName: json.profile?.firstName || "",
        secondName: json.profile?.secondName || "",
        dateOfBirth: json.profile?.dateOfBirth || "",
        gender: json.profile?.gender || "",
        email: json.profile?.email || "",
        countryOfResidence: json.profile?.countryOfResidence || "",
        preferredLanguages: json.profile?.preferredLanguages || "",
      });
    } catch (err) {
      setError(err.message || "Error connecting to profile.");
      setStatus("");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  if (!ethrDid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Wallet Connection Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your Ethereum wallet to access your decentralized
              profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Connect to Your Profile
                </h1>
                <p className="text-yellow-100">
                  Access your decentralized identity and profile data
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* DID Display */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Your Decentralized Identity (DID)
                  </label>
                  <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {ethrDid}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(ethrDid)}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Copy DID"
                >
                  <Copy
                    className={`w-4 h-4 ${copied ? "text-green-500" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            {loading && (
              <div className="bg-gray-50 dark:bg-gray-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Loading Your Profile
                </h3>
                <div className="space-y-4">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-gray-100 dark:bg-gray-800/30 border border-yellow-300 dark:border-yellow-600"
                            : isCompleted
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-gray-50 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-full ${
                            isActive
                              ? "bg-yellow-400 text-white animate-pulse"
                              : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {isActive && index < 3 ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div
                            className={`font-medium ${
                              isActive
                                ? "text-blue-900 dark:text-blue-100"
                                : isCompleted
                                ? "text-green-900 dark:text-green-100"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {step.label}
                          </div>
                          <div
                            className={`text-sm ${
                              isActive
                                ? "text-gray-700 dark:text-gray-300"
                                : isCompleted
                                ? "text-green-700 dark:text-green-300"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Button */}
            {!loading && !profile && (
              <button
                onClick={handleConnect}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span>Fetch My Profile</span>
              </button>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      Error
                    </h4>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile CID Display */}
            {onChainProfileCID && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1 block">
                      On-chain Profile CID
                    </label>
                    <div className="font-mono text-sm text-purple-900 dark:text-purple-100 break-all">
                      {onChainProfileCID}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(onChainProfileCID)}
                    className="ml-3 p-2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
                    title="Copy CID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile Display */}
            {profile && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Profile Loaded Successfully
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      Your decentralized profile data has been retrieved
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Profile Data
                  </h4>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Success Status */}
            {!loading && profile && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Profile connected successfully!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectProfile;
