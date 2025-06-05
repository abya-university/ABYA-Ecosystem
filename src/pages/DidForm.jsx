// DidProfileForm.jsx
import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Clipboard, Loader } from "lucide-react";
import { createDid, resolveDid } from "../services/didService";
import {
  storeDidDocument,
  storeStudentProfile,
} from "../services/ipfsService";
import { ethers } from "ethers";
// Import your compiled contract artifact to ensure you have the correct ABI.
import EthereumDIDRegistryArtifact from "../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json";

const DidProfileForm = () => {
  // DID and IPFS states
  const [privateKey, setPrivateKey] = useState("");
  const [did, setDid] = useState("");
  const [resolvedDid, setResolvedDid] = useState(null);
  const [didCid, setDidCid] = useState("");
  const [owner, setOwner] = useState(null);

  // Profile states - now separate first and second name
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [email, setEmail] = useState("");
  const [profileCid, setProfileCid] = useState("");

  // Transaction hashes and success message
  const [docTxHash, setDocTxHash] = useState("");
  const [profileTxHash, setProfileTxHash] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Verify DID owner
  const verifyIdentityOwner = async (identityDID) => {
    const INFURA_URL = import.meta.env.VITE_INFURA_URL;
    const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
    const identityAddress = identityDID.split(":")[3];
    if (!identityAddress) {
      throw new Error(
        "Invalid DID format. Ensure it follows 'did:ethr:sepolia:<address>'"
      );
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const DidReg = new ethers.Contract(
      CONTRACT_ADDRESS,
      EthereumDIDRegistryArtifact.abi,
      provider
    );
    return await DidReg.identityOwner(identityAddress);
  };

  // Retry mechanism for owner verification
  const retryVerifyOwner = async (identityDID, retries = 3, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const ownerAddress = await verifyIdentityOwner(identityDID);
        if (ownerAddress) return ownerAddress;
      } catch (err) {}
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return null;
  };

  // Main function to generate DID and profile
  const handleCreateProfile = async () => {
    if (
      !privateKey.trim() ||
      !firstName.trim() ||
      !secondName.trim() ||
      !email.trim()
    ) {
      setError("Private key, first name, second name, and email are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setDocTxHash("");
    setProfileTxHash("");

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // 1. Generate a new DID using the private key
      const generatedDid = await createDid(privateKey, INFURA_URL, CONTRACT_ADDRESS);
      setDid(generatedDid);

      // 2. Resolve the DID to get its document
      const resolved = await resolveDid(generatedDid, INFURA_URL, CONTRACT_ADDRESS);
      setResolvedDid(resolved);

      // 3. Verify the owner address (with retry)
      const ownerAddress = await retryVerifyOwner(generatedDid, 3, 3000);
      setOwner(ownerAddress);

      // 4. Store the DID document on IPFS via Pinata
      const didDocumentCid = await storeDidDocument(generatedDid, resolved);
      setDidCid(didDocumentCid);

      // 5. Build the student profile object and store it on IPFS
      const studentProfile = {
        did: generatedDid,
        owner: ownerAddress,
        profile: { firstName, secondName, email },
        didDocumentCid,
        timestamp: new Date().toISOString(),
      };

      const profileIpfsCid = await storeStudentProfile(generatedDid, studentProfile);
      setProfileCid(profileIpfsCid);

      // 6. Save the DID document CID and the profile CID on-chain using the smart contract
      const identityAddress = generatedDid.split(":")[3];
      if (!identityAddress) {
        throw new Error("Invalid DID format. Could not extract identity address.");
      }
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const wallet = new ethers.Wallet(privateKey, provider);
      const didContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        wallet
      );

      // Save DID Document CID on-chain
      const txDoc = await didContract.setDIDDocumentCID(identityAddress, didDocumentCid);
      const receiptDoc = await txDoc.wait();
      setDocTxHash(receiptDoc.transactionHash);

      // Save Profile CID on-chain
      const txProfile = await didContract.setProfileCID(identityAddress, profileIpfsCid);
      const receiptProfile = await txProfile.wait();
      setProfileTxHash(receiptProfile.transactionHash);

      setSuccessMessage("CIDs have been saved successfully on-chain!");

    } catch (err) {
      setError(`Error: ${err?.message || "An unexpected error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  // Copy DID to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(did).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="flex justify-center text-2xl font-semibold mb-6 text-yellow-500">
          Create Your Profile & DID
        </h1>
        {/* Private Key Input */}
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

        {/* Profile Information Inputs */}
        <div className="mb-4">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={secondName}
            onChange={(e) => setSecondName(e.target.value)}
            placeholder="Second Name"
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>

        <button
          onClick={handleCreateProfile}
          className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loading}
        >
          {loading ? <Loader className="animate-spin" size={20} /> : "Create Profile & DID"}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        {successMessage && (
          <p className="text-green-600 mt-4 font-semibold">{successMessage}</p>
        )}

        {/* Display Generated Outputs */}
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

        {didCid && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">DID Document CID (IPFS):</h2>
            <p className="text-gray-700 break-all">{didCid}</p>
          </div>
        )}

        {profileCid && (
          <div className="mt-4">
            <h2 className="font-bold text-lg">Profile Stored on IPFS, CID:</h2>
            <p className="text-gray-700 break-all">{profileCid}</p>
          </div>
        )}

        {(docTxHash || profileTxHash) && (
          <div className="mt-4 bg-green-50 p-4 rounded-md">
            {docTxHash && (
              <p>
                <strong>DID Document TX:</strong>{" "}
                <span className="break-all">{docTxHash}</span>
              </p>
            )}
            {profileTxHash && (
              <p>
                <strong>Profile TX:</strong>{" "}
                <span className="break-all">{profileTxHash}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DidProfileForm;