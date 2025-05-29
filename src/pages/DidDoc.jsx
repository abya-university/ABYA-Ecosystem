// src/pages/DidDoc.jsx

import React, { useState, useEffect } from 'react';
import { Loader, AlertOctagonIcon } from 'lucide-react';
import { useDid } from '../contexts/DidContext';
import { ethers } from 'ethers';
import EthereumDIDRegistryArtifact from '../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json';

const DidDoc = () => {
  const { ethrDid } = useDid();
  const [didDoc, setDidDoc] = useState(null);
  const [docCid, setDocCid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ethrDid) return;
    fetchDidDocument();
  }, [ethrDid]);

  const fetchDidDocument = async () => {
    setError('');
    setLoading(true);

    try {
      const INFURA_URL = import.meta.env.VITE_INFURA_URL;
      const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

      // Extract identity address from did:ethr:0x...
      const parts = ethrDid.split(':');
      const identity = parts[parts.length - 1];

      // Read on-chain CID
      const provider = new ethers.JsonRpcProvider(INFURA_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        provider
      );
      const cidOnChain = await contract.getDIDDocumentCID(identity);
      if (!cidOnChain) {
        throw new Error('No DID Document CID found on-chain for this DID.');
      }

      setDocCid(cidOnChain);

      // Fetch from IPFS gateway
      const res = await fetch(`https://ipfs.io/ipfs/${cidOnChain}`);
      if (!res.ok) {
        throw new Error('Failed to fetch DID document from IPFS');
      }
      const json = await res.json();
      setDidDoc(json);
    } catch (err) {
      setError(err.message || 'Error fetching DID document');
    } finally {
      setLoading(false);
    }
  };

  if (!ethrDid) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <AlertOctagonIcon size={24} className="inline-block mr-2 text-red-500" />
        <span className="text-red-600">Connect your wallet to view DID Document.</span>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6 text-yellow-500">DID Document</h2>

      {loading && (
        <div className="flex items-center justify-center">
          <Loader className="animate-spin" size={20} />
          <span className="ml-2">Loading...</span>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {docCid && <p className="text-sm mb-2"><strong>CID:</strong> {docCid}</p>}

      {didDoc && (
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
          {JSON.stringify(didDoc, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DidDoc;
