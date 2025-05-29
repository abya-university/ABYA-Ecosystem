// src/pages/UpdateProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagonIcon, ArrowLeft, Clipboard, Loader } from 'lucide-react';
import { useDid } from '../contexts/DidContext';
import { resolveDid } from '../services/didService';
import { storeStudentProfile, unpinCID } from '../services/ipfsService';
import { ethers } from 'ethers';
import EthereumDIDRegistryArtifact from '../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json';

const UpdateProfileForm = () => {
  const navigate = useNavigate();
  const { ethrDid } = useDid();

  const [resolvedDid, setResolvedDid] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [profileCid, setProfileCid] = useState('');
  const [oldCid, setOldCid] = useState('');
  const [profileTxHash, setProfileTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch and resolve the DID document and existing profile
  useEffect(() => {
    if (!ethrDid) return;
    (async () => {
      try {
        const doc = await resolveDid(
          ethrDid,
          import.meta.env.VITE_INFURA_URL,
          import.meta.env.VITE_CONTRACT_ADDRESS
        );
        setResolvedDid(doc);

        const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_INFURA_URL);
        const contract = new ethers.Contract(
          import.meta.env.VITE_CONTRACT_ADDRESS,
          EthereumDIDRegistryArtifact.abi,
          provider
        );
        const identity = ethrDid.split(':')[3];
        const existingCid = await contract.getProfileCID(identity);
        if (existingCid) {
          setOldCid(existingCid);
          const profileJson = await (await fetch(
            `https://ipfs.io/ipfs/${existingCid}`
          )).json();
          setExistingProfile(profileJson.profile);
          setProfileCid(existingCid);
          setFirstName(profileJson.profile.firstName);
          setSecondName(profileJson.profile.secondName);
          setEmail(profileJson.profile.email);
        }
      } catch (err) {
        console.error('Error loading existing profile:', err);
      }
    })();
  }, [ethrDid]);

  // Browser signer helper
  const getBrowserSigner = async () => {
    if (!window.ethereum) throw new Error('No Ethereum provider');
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return await browserProvider.getSigner();
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccessMessage('');
    if (!ethrDid) return setError('Connect wallet first');
    if (!firstName || !secondName || !email) return setError('All fields required');

    setLoading(true);
    try {
      const updatedProfile = {
        did: ethrDid,
        owner: existingProfile.owner,
        profile: { firstName, secondName, email },
        didDocumentCid: existingProfile.didDocumentCid,
        timestamp: new Date().toISOString(),
      };

      // store updated JSON on IPFS
      const newCid = await storeStudentProfile(ethrDid, updatedProfile);
      setProfileCid(newCid);

      // unpin old CID to clean up
      if (oldCid) {
        try {
          await unpinCID(oldCid);
          console.log(`Unpinned old CID ${oldCid}`);
        } catch (unpErr) {
          console.warn('Failed to unpin old CID:', unpErr);
        }
      }

      // write new profile CID on-chain
      const signer = await getBrowserSigner();
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        EthereumDIDRegistryArtifact.abi,
        signer
      );
      const identity = ethrDid.split(':')[3];
      const tx = await contract.setProfileCID(identity, newCid);
      const receipt = await tx.wait();
      setProfileTxHash(receipt.transactionHash);
      setSuccessMessage('Profile updated and old data unpinned successfully');
    } catch (err) {
      setError(err.message || 'Error updating profile');
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

      <h2 className="text-xl font-semibold mb-2">Update Student Profile</h2>
      <div className="space-y-3">
        <input
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full p-2 border rounded"
        />
        <input
          value={secondName}
          onChange={e => setSecondName(e.target.value)}
          placeholder="Second Name"
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleUpdateProfile}
        disabled={loading}
        className={`mt-4 w-full p-2 rounded text-white flex items-center justify-center ${
          loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? <Loader className="animate-spin" size={18} /> : 'Update Profile'}
      </button>

      {error && <p className="mt-2 text-red-500">{error}</p>}
      {successMessage && <p className="mt-2 text-green-600">{successMessage}</p>}

      {profileCid && (
        <div className="mt-4 text-sm">
          <p><strong>Current Profile CID:</strong> {profileCid}</p>
          {profileTxHash && <p><strong>Profile TX:</strong> {profileTxHash}</p>}
        </div>
      )}
    </div>
  );
};

export default UpdateProfileForm;
