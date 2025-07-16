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
      label: "Verify DID",
      desc: "Validating identity",
    },
    {
      icon: Database,
      label: "Fetch CID",
      desc: "Getting blockchain reference",
    },
    {
      icon: ExternalLink,
      label: "Load IPFS",
      desc: "Retrieving profile data",
    },
    {
      icon: CheckCircle,
      label: "Complete",
      desc: "Profile ready",
    },
  ];

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
      const RPC_URL = import.meta.env.VITE_APP_RPC_URL;
      const CONTRACT_ADDRESS = import.meta.env
        .VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS;

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Connection Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please connect your Ethereum wallet to access your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-lg font-semibold text-white">
                Connect Profile
              </h1>
              <p className="text-yellow-100 text-sm">
                Access your decentralized identity
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* DID Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Decentralized Identity
                </label>
                <div className="font-mono text-sm text-gray-900 dark:text-white truncate">
                  {ethrDid}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(ethrDid)}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Copy className={`w-4 h-4 ${copied ? "text-green-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Horizontal Progress Steps */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep && loading;
                const isCompleted =
                  index < currentStep || (!loading && profile);
                const isCurrent = index === currentStep;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    {/* Step Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isActive
                          ? "bg-yellow-400 border-yellow-400 text-white animate-pulse"
                          : isCurrent && !loading
                          ? "border-yellow-400 text-yellow-500"
                          : "border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500"
                      }`}
                    >
                      {isActive && index < 3 ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="text-center mt-2">
                      <div
                        className={`text-xs font-medium ${
                          isCompleted
                            ? "text-green-600 dark:text-green-400"
                            : isActive || isCurrent
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isCompleted
                            ? "text-green-500 dark:text-green-400"
                            : isActive
                            ? "text-yellow-500 dark:text-yellow-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="flex justify-between absolute top-5 left-5 right-5 -translate-y-1/2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${
                      index < currentStep || (!loading && profile)
                        ? "bg-green-500"
                        : index === currentStep - 1 && loading
                        ? "bg-yellow-400"
                        : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {(loading || status) && (
            <div
              className={`text-center p-3 rounded-lg ${
                profile
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : loading
                  ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="text-sm font-medium">{status}</div>
            </div>
          )}

          {/* Action Button */}
          {!loading && !profile && (
            <button
              onClick={handleConnect}
              disabled={!ethrDid}
              className={`w-full font-medium py-3 px-4 mt-5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                ethrDid
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{ethrDid ? "Connect My Profile" : "Wallet Required"}</span>
            </button>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {onChainProfileCID && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-purple-700 dark:text-purple-300 block mb-1">
                    Profile CID
                  </label>
                  <div className="font-mono text-sm text-purple-900 dark:text-purple-100 truncate">
                    {onChainProfileCID}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(onChainProfileCID)}
                  className="ml-2 p-2 text-purple-500 hover:text-purple-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {profile && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Profile Connected
                </h3>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-800">
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectProfile;
