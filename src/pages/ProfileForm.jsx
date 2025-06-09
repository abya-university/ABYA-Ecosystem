import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertOctagonIcon,
  ArrowLeft,
  Clipboard,
  Loader,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useDid } from "../contexts/DidContext";
import { resolveDid } from "../services/didService";
import { storeDidDocument, storeStudentProfile } from "../services/ipfsService";
import { ethers } from "ethers";
import EthereumDIDRegistryArtifact from "../artifacts/contracts/EthereumDIDRegistry/EthereumDIDRegistry.sol/EthereumDIDRegistry.json";

const DidProfileForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { ethrDid } = useDid();

  const [resolvedDid, setResolvedDid] = useState(null);
  const [owner, setOwner] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    secondName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    countryOfResidence: "",
    preferredLanguages: [""],
  });
  const [genderOptions] = useState(["Male", "Female", "Other"]);
  const [didCid, setDidCid] = useState("");
  const [profileCid, setProfileCid] = useState("");
  const [docTxHash, setDocTxHash] = useState("");
  const [profileTxHash, setProfileTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Resolve DID document
  useEffect(() => {
    if (!ethrDid) return;
    (async () => {
      try {
        const resolved = await resolveDid(
          ethrDid,
          import.meta.env.VITE_APP_RPC_URL,
          import.meta.env.VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS
        );
        setResolvedDid(resolved);
      } catch (err) {
        console.error("Error resolving DID:", err);
      }
    })();
  }, [ethrDid]);

  // Provider & signer helpers
  const getProvider = () =>
    new ethers.JsonRpcProvider(import.meta.env.VITE_APP_RPC_URL);
  const getBrowserSigner = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider");
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return browserProvider.getSigner();
  };

  // Fetch on-chain CIDs
  const fetchOnChainCIDs = async (identityAddress) => {
    const provider = getProvider();
    const contract = new ethers.Contract(
      import.meta.env.VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS,
      EthereumDIDRegistryArtifact.abi,
      provider
    );
    const existingDocCid = await contract.getDIDDocumentCID(identityAddress);
    const existingProfileCid = await contract.getProfileCID(identityAddress);
    return { existingDocCid, existingProfileCid };
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const arr = [...formData[field]];
    arr[index] = value;
    setFormData((prev) => ({ ...prev, [field]: arr }));
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayItem = (field, index) => {
    const arr = formData[field].filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, [field]: arr }));
  };

  const handleCreateProfile = async () => {
    setError("");
    setSuccessMessage("");

    const {
      firstName,
      secondName,
      dateOfBirth,
      gender,
      email,
      countryOfResidence,
    } = formData;
    if (!ethrDid) return setError("Connect wallet first");
    if (
      !firstName ||
      !secondName ||
      !dateOfBirth ||
      !gender ||
      !email ||
      !countryOfResidence
    )
      return setError("All profile fields are required");

    setLoading(true);
    try {
      const identityAddress = ethrDid.split(":")[3];
      const provider = getProvider();
      const contractRead = new ethers.Contract(
        import.meta.env.VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        provider
      );

      // Verify owner
      const ownerAddr = await contractRead.identityOwner(identityAddress);
      setOwner(ownerAddr);

      // Check existing on-chain
      const { existingDocCid, existingProfileCid } = await fetchOnChainCIDs(
        identityAddress
      );

      // IPFS store as needed
      const cidDoc =
        existingDocCid || (await storeDidDocument(ethrDid, resolvedDid));
      setDidCid(cidDoc);

      const cidProfile =
        existingProfileCid ||
        (await storeStudentProfile(ethrDid, {
          did: ethrDid,
          owner: ownerAddr,
          profile: { ...formData },
          didDocumentCid: cidDoc,
          timestamp: new Date().toISOString(),
        }));
      setProfileCid(cidProfile);

      // On-chain writes
      const signer = await getBrowserSigner();
      const contractWrite = new ethers.Contract(
        import.meta.env.VITE_APP_DID_REGISTRY_CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        signer
      );

      let created = false;
      if (!existingDocCid) {
        const tx1 = await contractWrite.setDIDDocumentCID(
          identityAddress,
          cidDoc
        );
        const receipt1 = await tx1.wait();
        setDocTxHash(receipt1.transactionHash);
        created = true;
      }
      if (!existingProfileCid) {
        const tx2 = await contractWrite.setProfileCID(
          identityAddress,
          cidProfile
        );
        const receipt2 = await tx2.wait();
        setProfileTxHash(receipt2.transactionHash);
        created = true;
      }

      // Messaging
      if (existingDocCid || existingProfileCid) {
        setSuccessMessage(
          created
            ? "New parts of profile stored; existing fields were skipped."
            : "A profile already exists; nothing was changed."
        );
      } else {
        setSuccessMessage("Profile successfully created on IPFS and on-chain!");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Error creating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!ethrDid) {
    return (
      <p className="p-4 text-red-500 flex items-center">
        <AlertOctagonIcon size={24} className="mr-2" />
        Please connect your wallet first.
      </p>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sm text-gray-600"
      >
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      <h2 className="text-xl font-semibold mb-2 dark:text-gray-200">
        DID Document
      </h2>
      <div className="w-full max-w-4xl mx-auto dark:bg-gray-700">
        {/* Toggle Header */}
        <div
          onClick={() => setIsVisible((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors group"
        >
          <div className="flex-shrink-0">
            {isVisible ? (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            DID Resolution Details
          </span>
          <div className="flex-1"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {isVisible ? "Click to hide" : "Click to expand"}
          </span>
        </div>

        {/* Resolved DID Section */}
        {isVisible && (
          <div className="mt-2 border-l-2 border-gray-200 dark:border-gray-600 ml-6 pl-4">
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-mono text-gray-600 dark:text-cyan-100">
                  Resolved DID Document
                </span>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-800 dark:text-cyan-50 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(resolvedDid, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="font-mono text-sm break-all">{ethrDid}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(ethrDid);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <Clipboard size={18} />
        </button>
      </div>

      {/* Personal Information */}
      <section className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-300 pb-2">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Second Name
            </label>
            <input
              type="text"
              value={formData.secondName}
              onChange={(e) => handleInputChange("secondName", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            >
              <option value="">Select Gender</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Country of Residence
            </label>
            <input
              type="text"
              value={formData.countryOfResidence}
              onChange={(e) =>
                handleInputChange("countryOfResidence", e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Preferred Languages
          </label>
          {formData.preferredLanguages.map((lang, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={lang}
                onChange={(e) =>
                  handleArrayChange("preferredLanguages", index, e.target.value)
                }
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:text-gray-700"
                placeholder="Language"
              />
              <button
                type="button"
                onClick={() => removeArrayItem("preferredLanguages", index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem("preferredLanguages")}
            className="flex items-center gap-1 text-yellow-600 hover:text-yellow-800"
          >
            <Plus size={16} /> Add Language
          </button>
        </div>
      </section>

      <button
        onClick={handleCreateProfile}
        disabled={loading}
        className={`mt-4 w-full p-2 rounded text-white flex items-center justify-center ${
          loading ? "bg-gray-400" : "bg-yellow-500 hover:bg-yellow-600"
        }`}
      >
        {loading ? (
          <Loader className="animate-spin" size={18} />
        ) : (
          "Submit Profile"
        )}
      </button>

      {error && <p className="mt-2 text-red-500">{error}</p>}
      {successMessage && (
        <p className="mt-2 text-green-600">{successMessage}</p>
      )}

      {(didCid || profileCid) && (
        <div className="mt-4 text-sm space-y-1">
          {didCid && (
            <p>
              <strong>DID Doc CID:</strong> {didCid}
            </p>
          )}
          {profileCid && (
            <p>
              <strong>Profile CID:</strong> {profileCid}
            </p>
          )}
          {docTxHash && (
            <p>
              <strong>Doc TX:</strong> {docTxHash}
            </p>
          )}
          {profileTxHash && (
            <p>
              <strong>Profile TX:</strong> {profileTxHash}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DidProfileForm;
