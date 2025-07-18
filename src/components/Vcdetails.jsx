import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { ethers } from "ethers";
import { useDid } from "../contexts/DidContext";
import { useProfile } from "../contexts/ProfileContext";
import QRCode from "react-qr-code";

// Configuration
const VITE_VC_INFURA_URL = import.meta.env.VITE_VC_INFURA_URL;
const VITE_VC_CONTRACT_ADDRESS = import.meta.env.VITE_VC_CONTRACT_ADDRESS;
const VITE_VC_PINATA_GATEWAY = import.meta.env.VITE_VC_PINATA_GATEWAY;
const VITE_PUBLIC_VERIFY_URL = import.meta.env.VITE_PUBLIC_VERIFY_URL || "https://verify.abya.org";

// Smart contract ABI
const contractABI = [
  "function getCredentialsForStudent(string studentDID) public view returns (uint256[])",
  "function credentials(uint256) public view returns (uint256 id, string studentDID, string issuerDID, string credentialType, uint256 issueDate, string metadata, string credentialHash, string signature, string mappingCID, bool valid)"
];

const AUTO_REFRESH_INTERVAL_MS = 60000; // 60 seconds

const VCDisplay = () => {
  const { ethrDid } = useDid();
  const { profile } = useProfile();
  const holderDID = profile?.did || ethrDid;

  const [vcDocument, setVcDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const qrRef = useRef(null);

  const fetchCurrentVC = useCallback(async () => {
    if (!holderDID) return;
    setLoading(true);
    setError(null);
    setVcDocument(null);

    try {
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const contract = new ethers.Contract(
        VITE_VC_CONTRACT_ADDRESS,
        contractABI,
        provider
      );

      const ids = await contract.getCredentialsForStudent(holderDID);
      if (!ids.length) throw new Error("No credentials found for this DID.");
      const lastId = ids[ids.length - 1];

      const onchain = await contract.credentials(Number(lastId));
      const { mappingCID } = onchain;

      const url = `https://${VITE_VC_PINATA_GATEWAY}/ipfs/${mappingCID}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`IPFS fetch failed: ${response.statusText}`);
      const doc = await response.json();

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
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [holderDID]);

  useEffect(() => {
    fetchCurrentVC();
  }, [fetchCurrentVC]);

  useEffect(() => {
    if (!holderDID) return;
    const interval = setInterval(fetchCurrentVC, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [holderDID, fetchCurrentVC]);

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vc-qr-${holderDID}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Verifiable Credential
        </h2>
        <button
          onClick={fetchCurrentVC}
          disabled={loading}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          {/* <span>Refresh</span> */}
        </button>
      </div>

      {loading && <Loader className="animate-spin mx-auto my-6" />}
      {error && <p className="text-red-500 text-center my-4">Error: {error}</p>}
      {!loading && !error && !vcDocument && (
        <p className="text-center text-gray-600 dark:text-gray-400 my-4">
          No VC document to display.
        </p>
      )}

      {vcDocument && (
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p><strong>ID:</strong> {vcDocument.id}</p>
          <p><strong>Type:</strong> {vcDocument.type.join(", ")}</p>
          <p><strong>Issuer:</strong> {vcDocument.issuer.name} ({vcDocument.issuer.id})</p>
          <p>
            <strong>Issued:</strong>{" "}
            {new Date(vcDocument.issuanceDate).toLocaleString()}
          </p>
          <p><strong>Version:</strong> {vcDocument.version}</p>
          <p><strong>Valid:</strong> {vcDocument.onchain.valid ? "Yes" : "No"}</p>
          <p><strong>IPFS CID:</strong> {vcDocument.ipfsCID}</p>
          <p><strong>Subject DID:</strong> {vcDocument.credentialSubject.id}</p>

          <div className="mt-4">
            <h3 className="font-semibold">Courses:</h3>
            <ul className="list-disc list-inside">
              {vcDocument.credentialSubject.courses.map(course => (
                <li key={course.courseId}>
                  {course.title} ({course.courseId})
                </li>
              ))}
            </ul>
          </div>

          <div ref={qrRef} className="mt-6 text-center">
            <h3 className="font-semibold mb-2">Scan to Verify</h3>
            <QRCode 
              value={`${VITE_PUBLIC_VERIFY_URL}/?did=${encodeURIComponent(holderDID)}`} 
              size={128}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="Q"
              className="inline-block rounded-md border p-2 bg-white dark:bg-gray-900"
            />
            <p className="text-xs mt-2 text-gray-500 break-words">
              {VITE_PUBLIC_VERIFY_URL}/?did={holderDID}
            </p>
            <button
              onClick={downloadQR}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VCDisplay;
