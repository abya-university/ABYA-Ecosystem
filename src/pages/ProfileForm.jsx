// src/pages/DidProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagonIcon, ArrowLeft, Clipboard, Loader } from 'lucide-react';
import { useDid } from '../contexts/DidContext';
import { resolveDid } from '../services/didService';
import { storeDidDocument, storeStudentProfile } from '../services/ipfsService';
import { ethers } from 'ethers';
import EthereumDIDRegistryArtifact from '../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json';

const DidProfileForm = () => {
  const navigate = useNavigate();
  const { ethrDid } = useDid();

  const [resolvedDid, setResolvedDid] = useState(null);
  const [owner, setOwner] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [didCid, setDidCid] = useState('');
  const [profileCid, setProfileCid] = useState('');
  const [docTxHash, setDocTxHash] = useState('');
  const [profileTxHash, setProfileTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Resolve DID document
  useEffect(() => {
    if (!ethrDid) return;
    (async () => {
      try {
        const resolved = await resolveDid(
          ethrDid,
          import.meta.env.VITE_INFURA_URL,
          import.meta.env.VITE_CONTRACT_ADDRESS
        );
        setResolvedDid(resolved);
      } catch (err) {
        console.error('Error resolving DID:', err);
      }
    })();
  }, [ethrDid]);

  // Provider & signer helpers
  const getProvider = () => new ethers.JsonRpcProvider(import.meta.env.VITE_INFURA_URL);
  const getBrowserSigner = async () => {
    if (!window.ethereum) throw new Error('No Ethereum provider');
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return browserProvider.getSigner();
  };

  // Fetch on-chain CIDs
  const fetchOnChainCIDs = async (identityAddress) => {
    const provider = getProvider();
    const contract = new ethers.Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      EthereumDIDRegistryArtifact.abi,
      provider
    );
    const existingDocCid = await contract.getDIDDocumentCID(identityAddress);
    const existingProfileCid = await contract.getProfileCID(identityAddress);
    return { existingDocCid, existingProfileCid };
  };

  const handleCreateProfile = async () => {
    setError('');
    setSuccessMessage('');

    if (!ethrDid) return setError('Connect wallet first');
    if (!firstName || !secondName || !email) return setError('All profile fields are required');

    setLoading(true);
    try {
      const identityAddress = ethrDid.split(':')[3];
      const provider = getProvider();
      const contractRead = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        provider
      );

      // Verify owner
      const ownerAddr = await contractRead.identityOwner(identityAddress);
      setOwner(ownerAddr);

      // Check existing on-chain
      const { existingDocCid, existingProfileCid } = await fetchOnChainCIDs(identityAddress);

      // IPFS store as needed
      const cidDoc = existingDocCid || await storeDidDocument(ethrDid, resolvedDid);
      setDidCid(cidDoc);

      const cidProfile = existingProfileCid || await storeStudentProfile(
        ethrDid,
        { did: ethrDid, owner: ownerAddr, profile: { firstName, secondName, email }, didDocumentCid: cidDoc, timestamp: new Date().toISOString() }
      );
      setProfileCid(cidProfile);

      // On-chain writes
      const signer = await getBrowserSigner();
      const contractWrite = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        signer
      );

      let created = false;
      if (!existingDocCid) {
        const tx1 = await contractWrite.setDIDDocumentCID(identityAddress, cidDoc);
        const receipt1 = await tx1.wait();
        setDocTxHash(receipt1.transactionHash);
        created = true;
      }
      if (!existingProfileCid) {
        const tx2 = await contractWrite.setProfileCID(identityAddress, cidProfile);
        const receipt2 = await tx2.wait();
        setProfileTxHash(receipt2.transactionHash);
        created = true;
      }

      // Messaging
      if (existingDocCid || existingProfileCid) {
        setSuccessMessage(
          created ? 'New parts of profile stored; existing fields were skipped.' : 'A profile already exists; nothing was changed.'
        );
      } else {
        setSuccessMessage('Profile successfully created on IPFS and on-chain!');
      }
    } catch (err) {
      setError(err.message || 'Error creating profile');
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
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center text-sm text-gray-600">
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      <h2 className="text-xl font-semibold mb-2">DID Document</h2>
      {resolvedDid && (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(resolvedDid, null, 2)}
        </pre>
      )}

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="font-mono text-sm break-all">{ethrDid}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(ethrDid); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
          className="text-gray-500 hover:text-gray-700"
        >
          <Clipboard size={18} />
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Create Student Profile</h2>
      <div className="space-y-3">
        <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-full p-2 border rounded" />
        <input value={secondName} onChange={e => setSecondName(e.target.value)} placeholder="Second Name" className="w-full p-2 border rounded" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
      </div>

      <button onClick={handleCreateProfile} disabled={loading} className={`mt-4 w-full p-2 rounded text-white flex items-center justify-center ${loading ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'}`}>        {loading ? <Loader className="animate-spin" size={18} /> : 'Submit Profile'}
      </button>

      {error && <p className="mt-2 text-red-500">{error}</p>}
      {successMessage && <p className="mt-2 text-green-600">{successMessage}</p>}

      {(didCid || profileCid) && (
        <div className="mt-4 text-sm space-y-1">
          {didCid && <p><strong>DID Doc CID:</strong> {didCid}</p>}
          {profileCid && <p><strong>Profile CID:</strong> {profileCid}</p>}
          {docTxHash && <p><strong>Doc TX:</strong> {docTxHash}</p>}
          {profileTxHash && <p><strong>Profile TX:</strong> {profileTxHash}</p>}
        </div>
      )}
    </div>
  );
};

export default DidProfileForm;
