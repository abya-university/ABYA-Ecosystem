// VerifyVc.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ethers } from 'ethers';

const VITE_VC_INFURA_URL = import.meta.env.VITE_VC_INFURA_URL;
const VITE_VC_CONTRACT_ADDRESS = import.meta.env.VITE_VC_CONTRACT_ADDRESS;
const VITE_VC_PINATA_GATEWAY = import.meta.env.VITE_VC_PINATA_GATEWAY;

const contractABI = [
  "function getCredentialsForStudent(string studentDID) public view returns (uint256[])",
  "function credentials(uint256) public view returns (uint256 id, string studentDID, string issuerDID, string credentialType, uint256 issueDate, string metadata, string credentialHash, string signature, string mappingCID, bool valid)"
];

const PublicVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const studentDID = searchParams.get("did");

  const [vcDocument, setVcDocument] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studentDID) {
      fetchVC();
    }
  }, [studentDID]);

  const fetchVC = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, provider);
      const ids = await contract.getCredentialsForStudent(studentDID);
      if (!ids.length) throw new Error("No credentials found.");
      const lastId = ids[ids.length - 1];
      const onchain = await contract.credentials(Number(lastId));
      const { mappingCID } = onchain;
      const url = `https://${VITE_VC_PINATA_GATEWAY}/ipfs/${mappingCID}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch document from IPFS");
      const doc = await res.json();

      setVcDocument({
        ...doc,
        onchain: {
          id: Number(onchain.id),
          issueDate: new Date(Number(onchain.issueDate) * 1000).toISOString(),
          valid: onchain.valid,
        },
        ipfsCID: mappingCID,
        ipfsUrl: url
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading credential...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!vcDocument) return <p>No credential found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-4">Credential Verification</h2>
      <p><strong>Student DID:</strong> {vcDocument.credentialSubject.id}</p>
      <p><strong>Issuer:</strong> {vcDocument.issuer.name} ({vcDocument.issuer.id})</p>
      <p><strong>Issued On:</strong> {new Date(vcDocument.issuanceDate).toLocaleString()}</p>
      <p><strong>Valid:</strong> {vcDocument.onchain.valid ? "Yes" : "No"}</p>
      <p><strong>IPFS CID:</strong> {vcDocument.ipfsCID}</p>
      <a className="text-blue-600 underline mt-2 block" href={vcDocument.ipfsUrl} target="_blank" rel="noopener noreferrer">View raw on IPFS</a>
    </div>
  );
};

export default PublicVerifyPage;
