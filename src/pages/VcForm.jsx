import React, { useState, useEffect } from "react";
import { Loader } from "lucide-react";
import { ethers } from "ethers";
import { useDid } from "../contexts/DidContext";
import { useProfile } from '../contexts/ProfileContext';

// Configuration
const VITE_VC_INFURA_URL = import.meta.env.VITE_VC_INFURA_URL;
const VITE_VC_CONTRACT_ADDRESS = import.meta.env.VITE_VC_CONTRACT_ADDRESS;
const VITE_VC_PINATA_JWT = import.meta.env.VITE_VC_PINATA_JWT;
const VITE_VC_PINATA_GATEWAY = import.meta.env.VITE_VC_PINATA_GATEWAY;

// ABI
const contractABI = [
  "function issueCredential(string studentDID, string credentialType, string metadata, string credentialHash, string signature, string mappingCID) public",
  "function getCredentialsForStudent(string studentDID) public view returns (uint256[])",
  "function credentials(uint256) public view returns (uint256 id, string studentDID, string issuerDID, string credentialType, uint256 issueDate, string metadata, string credentialHash, string signature, string mappingCID, bool valid)"
];

const mockIssuerPrivateKey = import.meta.env.VITE_VC_ISSUER_KEY;

// Courses
const mockCourses = [
  { courseId: "vc-101", title: "Introduction to Verifiable Credentials", instructor: "Dr. Jane Doe" },
  { courseId: "vc-102", title: "Blockchain Basics", instructor: "Prof. John Smith" },
];

// IPFS upload
const uploadJSONToIPFS = async (doc, name) => {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${VITE_VC_PINATA_JWT}` },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: doc }),
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  return (await res.json()).IpfsHash;
};

const VCIssuanceForm = () => {
  const { ethrDid } = useDid();
  const { profile } = useProfile();
  const holderDID = profile?.did || ethrDid;
  const fullName = [profile?.firstName, profile?.secondName].filter(Boolean).join(" ");

  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [vcDocument, setVcDocument] = useState(null);
  const [onchainCID, setOnchainCID] = useState("");

  useEffect(() => {
    if (!holderDID) setError("Connect your wallet or complete profile to get DID.");
  }, [holderDID]);

  const toggleCourseSelection = (id) => {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleIssueOrUpdateCredential = async () => {
    setError(""); setTxHash(""); setVcDocument(null); setOnchainCID("");
    if (!holderDID) return setError("No DID available.");
    if (!selectedCourses.length) return setError("Select at least one course.");

    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const wallet = new ethers.Wallet(mockIssuerPrivateKey, provider);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, wallet);

      // merge courses
      const merged = [...(vcDocument?.credentialSubject?.courses || []),
        ...mockCourses.filter(c => selectedCourses.includes(c.courseId))
      ].filter((v, i, a) => a.findIndex(t => t.courseId === v.courseId) === i);
      const metadata = JSON.stringify(merged);
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(metadata));
      const signature = await wallet.signMessage(credentialHash);

      // build VC
      const issuanceDate = new Date().toISOString();
      const version = vcDocument?.version ? vcDocument.version + 1 : 1;
      const vcDoc = {
        "@context": "https://www.w3.org/ns/credentials/v2",
        id: `vc-${holderDID}-${Date.now()}`,
        type: ["VerifiableCredential", "CourseCompletion"],
        issuer: { id: profile?.issuerDID || "did:example:abya-university", name: profile?.universityName || "ABYA University" },
        issuanceDate, version,
        credentialSubject: { id: holderDID, name: fullName, courses: merged },
        credentialHash,
        proof: { type: "EcdsaSecp256k1Signature2019", created: issuanceDate, proofPurpose: "assertionMethod", verificationMethod: `${holderDID}#key-1`, signatureValue: signature }
      };

      // upload VC
      const vcCID = await uploadJSONToIPFS(vcDoc, `vc-${holderDID}-${Date.now()}`);

      // send transaction and get hash immediately
      const tx = await contract.issueCredential(holderDID, "CourseCompletion", metadata, credentialHash, signature, vcCID, { gasLimit: 800000 });
      setTxHash(tx.hash);                // immediate tx hash display
      const receipt = await tx.wait();

      setVcDocument({ ...vcDoc, ipfsCID: vcCID, ipfsUrl: `https://${VITE_VC_PINATA_GATEWAY}/ipfs/${vcCID}` });

      // fetch on-chain CID
      const ids = await contract.getCredentialsForStudent(holderDID);
      const lastId = ids[ids.length - 1];
      const onchain = await contract.credentials(lastId);
      setOnchainCID(onchain.mappingCID);

    } catch (e) {
      console.error(e);
      setError(`Issuance failed: ${e.reason || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6 text-yellow-500">{vcDocument ? "Update Credential" : "Issue Credential"}</h1>
        {error && <p className="text-red-500 mb-4 whitespace-pre-wrap">{error}</p>}

        <p className="text-sm mb-4 break-all"><strong>Your DID:</strong> {holderDID || "Not available"}</p>
        {fullName && <p className="text-sm mb-4"><strong>Name:</strong> {fullName}</p>}

        <h2 className="text-lg font-semibold mb-2">Select Courses</h2>
        {mockCourses.map(c => (
          <div key={c.courseId} className="flex items-center mb-2">
            <input type="checkbox" checked={selectedCourses.includes(c.courseId)} onChange={() => toggleCourseSelection(c.courseId)} className="mr-2" />
            <label>{c.title}</label>
          </div>
        ))}

        <button onClick={handleIssueOrUpdateCredential} disabled={loading || !holderDID} className="w-full mt-4 p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md">
          {loading ? <Loader size={20} className="animate-spin mx-auto" /> : vcDocument ? "Update Credential" : "Issue Credential"}
        </button>

        {txHash && <p className="mt-4 text-green-500 break-all"><strong>Transaction Hash:</strong> {txHash}</p>}

        {vcDocument && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 border rounded">
            <h3 className="font-semibold">Generated VC Document (v{vcDocument.version}):</h3>
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto text-gray-700 dark:text-gray-100">{JSON.stringify(vcDocument, null, 2)}</pre>
            <p className="mt-2 text-sm break-all"><strong>IPFS CID:</strong> {vcDocument.ipfsCID}</p>
            <p className="mt-2 text-sm break-all"><strong>On-chain CID:</strong> {onchainCID}</p>
            <p className="mt-2 text-sm break-all"><strong>Transaction Hash:</strong> {txHash}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VCIssuanceForm;
