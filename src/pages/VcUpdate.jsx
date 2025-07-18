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

// Smart contract ABI
const contractABI = [
  "function issueCredential(string studentDID, string credentialType, string metadata, string credentialHash, string signature, string mappingCID) public",
  "function getCredentialsForStudent(string studentDID) public view returns (uint256[])",
  "function credentials(uint256) public view returns (uint256 id, string studentDID, string issuerDID, string credentialType, uint256 issueDate, string metadata, string credentialHash, string signature, string mappingCID, bool valid)"
];

// Mock issuer private key
const mockIssuerPrivateKey = import.meta.env.VITE_VC_ISSUER_KEY;

// Available courses
const mockCourses = [
  { courseId: "vc-101", title: "Introduction to Verifiable Credentials" },
  { courseId: "vc-102", title: "Blockchain Basics" },
];

// Utility: upload JSON to IPFS via Pinata
async function uploadJSONToIPFS(doc, name) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VITE_VC_PINATA_JWT}`
    },
    body: JSON.stringify({ pinataMetadata: { name }, pinataContent: doc })
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.IpfsHash;
}

export default function VCUpdateForm() {
  const { ethrDid } = useDid();
  const { profile } = useProfile();
  const holderDID = profile?.did || ethrDid;

  const [vcDocument, setVcDocument] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // On mount: fetch current VC from on-chain + IPFS
  useEffect(() => {
    async function fetchVC() {
      if (!holderDID) return setError('No DID available');
      try {
        const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
        const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, provider);
        // get credential IDs
        const ids = await contract.getCredentialsForStudent(holderDID);
        if (!ids.length) return setError('No credential found for this DID');
        const lastId = ids[ids.length - 1];
        const onchain = await contract.credentials(lastId);
        // fetch JSON from IPFS
        const cid = onchain.mappingCID;
        const url = `https://${VITE_VC_PINATA_GATEWAY}/ipfs/${cid}`;
        const resp = await fetch(url);
        const doc = await resp.json();
        setVcDocument({ ...doc, ipfsCID: cid });
        setSelectedCourses(doc.credentialSubject.courses.map(c => c.courseId));
      } catch (e) {
        console.error(e);
        setError(`Failed to load VC: ${e.message}`);
      }
    }
    fetchVC();
  }, [holderDID]);

  const toggleCourse = (id) => {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleUpdate = async () => {
    setError('');
    if (!vcDocument) return;
    setLoading(true);
    try {
      // rebuild merged course list
      const merged = mockCourses
        .filter(c => selectedCourses.includes(c.courseId));
      const metadata = JSON.stringify(merged);
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(metadata));
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const wallet = new ethers.Wallet(mockIssuerPrivateKey, provider);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, wallet);
      // sign
      const signature = await wallet.signMessage(credentialHash);
      // build updated doc
      const issuanceDate = new Date().toISOString();
      const version = (vcDocument.version || 1) + 1;
      const updatedDoc = {
        ...vcDocument,
        issuanceDate,
        version,
        credentialSubject: { ...vcDocument.credentialSubject, courses: merged },
        credentialHash,
        proof: { ...vcDocument.proof, created: issuanceDate, signatureValue: signature }
      };
      // upload
      const newCID = await uploadJSONToIPFS(updatedDoc, `vc-${holderDID}-${Date.now()}`);
      // submit on-chain
      const tx = await contract.issueCredential(
        holderDID,
        'CourseCompletion',
        metadata,
        credentialHash,
        signature,
        newCID,
        { gasLimit: 800000 }
      );
      setTxHash(tx.hash);
      await tx.wait();
      // update state
      setVcDocument({ ...updatedDoc, ipfsCID: newCID });
    } catch (e) {
      console.error(e);
      setError(`Update failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6 text-yellow-500">Update Credential</h1>
        {error && <p className="text-red-500 mb-4 whitespace-pre-wrap">{error}</p>}
        {!vcDocument ? (
          <Loader className="mx-auto" />
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2">Courses</h2>
            {mockCourses.map(c => (
              <div key={c.courseId} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(c.courseId)}
                  onChange={() => toggleCourse(c.courseId)}
                  className="mr-2"
                />
                <label>{c.title}</label>
              </div>
            ))}
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full mt-4 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              {loading ? <Loader size={20} className="animate-spin mx-auto" /> : 'Submit Update'}
            </button>

            {txHash && (
              <p className="mt-4 text-green-500 break-all">
                <strong>Transaction Hash:</strong> {txHash}
              </p>
            )}

            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 border rounded">
              <h3 className="font-semibold">Current VC Document (v{vcDocument.version}):</h3>
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto text-gray-700 dark:text-gray-100">{JSON.stringify(vcDocument, null, 2)}</pre>
              <p className="mt-2 text-sm break-all"><strong>IPFS CID:</strong> {vcDocument.ipfsCID}</p>
              <p className="mt-2 text-sm break-all"><strong>On-chain DID-CID:</strong> {vcDocument.ipfsCID}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
