import React, { useState } from "react";
import { Loader } from "lucide-react";
import { ethers } from "ethers";

// Configuration (ideally moved to environment variables)
const VITE_VC_INFURA_URL = "https://sepolia.infura.io/v3/189303beb46d46d8a0327f90f441168d";
const VITE_VC_CONTRACT_ADDRESS = "0xBe203f08DC55566fe826c6aAE8eb29cfE69Ae520";
const VITE_VC_PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NmQ0MjZjNi0yOWVhLTRhMjctYjM4NS1mNzhiYWFhMjllODUiLCJlbWFpbCI6Im5vcm1hbmdpdG9uZ2EzODhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQxYjhiMDM5ZjMyMTIyYjk5ODQzIiwic2NvcGVkS2V5U2VjcmV0IjoiMjFjN2U2YTE1ZTI1MDY5NzcxMjllNzBmMTQ5NWY3MWJkZjJlZjYxY2YwODk3MmY0YTRmNmM4MWE4MDkzZDBiZCIsImV4cCI6MTc3MTA1ODAzOH0.lPxRPlBrKhtWuiu4BSiN2gSCl7B-dVVITUS9OmLqtx0";
const VITE_VC_PINATA_GATEWAY = "sapphire-near-whippet-156.mypinata.cloud";

// Smart contract ABI
const contractABI = [
  "function issueCredential(string studentDID, string credentialType, string metadata, string credentialHash, string signature) public",
];

// Mock issuer credentials (to be handled securely in the backend)
const mockIssuerPrivateKey = "2d8b27effca40c55ff022b5ffa1d135fa99b5b701b5d4b511418b08ba38b117a";

// Available courses
const mockCourses = [
  {
    courseId: "vc-101",
    title: "Introduction to Verifiable Credentials",
    description: "Learn the fundamentals of Verifiable Credentials.",
    instructor: "Dr. Jane Doe",
    duration: "4 weeks",
    level: "Intermediate",
  },
  {
    courseId: "vc-102",
    title: "Blockchain Basics",
    description: "Understand the core principles of blockchain technology.",
    instructor: "Prof. John Smith",
    duration: "6 weeks",
    level: "Beginner",
  },
];

// Helper function to upload a JSON document to Pinata
const uploadJSONToIPFS = async (document, name) => {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VITE_VC_PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataMetadata: { name },
        pinataContent: document,
      }),
    });
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw error;
  }
};

const VCIssuanceForm = () => {
  // State for the VC holder's DID (user-provided) and course selection
  const [holderDID, setHolderDID] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [vcDocument, setVcDocument] = useState(null);
  const [mappingCID, setMappingCID] = useState("");

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // This function either issues a new credential or re-issues (updates) the VC document.
  const handleIssueOrUpdateCredential = async () => {
    if (!holderDID.trim() || selectedCourses.length === 0) {
      setError("Please enter the holder's DID and select at least one course.");
      return;
    }
    setError("");
    setLoading(true);
    setTxHash("");
    setVcDocument(null);
    setMappingCID("");

    try {
      // Use the mock issuer's private key for signing
      const provider = new ethers.JsonRpcProvider(VITE_VC_INFURA_URL);
      const wallet = new ethers.Wallet(mockIssuerPrivateKey, provider);
      const contract = new ethers.Contract(VITE_VC_CONTRACT_ADDRESS, contractABI, wallet);

      const issuanceDate = new Date().toISOString();

      // Merge previously issued courses (if any) with newly selected courses
      const previousCourses = vcDocument ? vcDocument.credentialSubject.courses : [];
      const newCourses = mockCourses.filter((course) => selectedCourses.includes(course.courseId));
      // Merge courses without duplicates
      const mergedCourses = [...previousCourses];
      newCourses.forEach((course) => {
        if (!mergedCourses.some((c) => c.courseId === course.courseId)) {
          mergedCourses.push(course);
        }
      });

      // Create metadata as JSON string of merged courses
      const metadata = JSON.stringify(mergedCourses);
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(metadata));
      const signature = await wallet.signMessage(credentialHash);

      // Call the smart contract to issue (or re-issue) the credential
      const tx = await contract.issueCredential(
        holderDID,
        "CourseCompletion",
        metadata,
        credentialHash,
        signature
      );
      await tx.wait();
      setTxHash(tx.hash);

      // Determine the version number (default is 1, or increment if updating)
      const version = vcDocument && vcDocument.version ? vcDocument.version + 1 : 1;

      // Build the new VC Document including versioning metadata
      const vcDoc = {
        "@context": "https://www.w3.org/ns/credentials/v2",
        id: `vc-${holderDID}-${Date.now()}`, // unique ID using the DID and timestamp
        type: ["VerifiableCredential", "CourseCompletion"],
        issuer: {
          id: "did:example:abya-university",
          name: "ABYA University",
        },
        issuanceDate,
        version,
        credentialSubject: {
          id: holderDID,
          courses: mergedCourses,
        },
        proof: {
          type: "EcdsaSecp256k1Signature2019",
          created: issuanceDate,
          proofPurpose: "assertionMethod",
          verificationMethod: "did:ethr:sepolia:0xBe203f08DC55566fe826c6aAE8eb29cfE69Ae520#key-1",
          signatureValue: signature,
        },
      };

      // Upload the new VC document to IPFS (naming it with the holder's DID)
      const vcDocName = `vc-${holderDID}-${Date.now()}`;
      const vcCID = await uploadJSONToIPFS(vcDoc, vcDocName);

      // Create a mapping document that links the holder's DID to the new VC document's CID and version
      const mappingDoc = {
        holderDID,
        vcCID,
        version,
        issuedAt: issuanceDate,
      };
      const mappingName = `vc-mapping-${holderDID}-${Date.now()}`;
      const mappingDocCID = await uploadJSONToIPFS(mappingDoc, mappingName);

      const updatedVCDoc = {
        ...vcDoc,
        ipfsCID: vcCID,
        ipfsUrl: `https://${VITE_VC_PINATA_GATEWAY}/ipfs/${vcCID}`,
      };

      setVcDocument(updatedVCDoc);
      setMappingCID(mappingDocCID);
    } catch (err) {
      console.error(err);
      setError("Credential issuance/update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6 text-yellow-500 text-center">
          {vcDocument ? "Update Credential" : "Issue Credential"}
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Holder DID</label>
          <input
            type="text"
            value={holderDID}
            onChange={(e) => setHolderDID(e.target.value)}
            placeholder="Enter the VC holder's DID"
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-300 focus:border-yellow-300"
          />
        </div>
        <h2 className="text-lg font-semibold mb-2">Select Courses</h2>
        {mockCourses.map((course) => (
          <div key={course.courseId} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selectedCourses.includes(course.courseId)}
              onChange={() => toggleCourseSelection(course.courseId)}
              className="mr-2"
            />
            <label>{course.title}</label>
          </div>
        ))}
        <button
          onClick={handleIssueOrUpdateCredential}
          className="w-full mt-4 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          disabled={loading}
        >
          {loading ? <Loader size={20} className="animate-spin mx-auto" /> : vcDocument ? "Update Credential" : "Issue Credential"}
        </button>
        {txHash && (
          <p className="mt-4 p-4 text-green-500 overflow-x-auto">
            Transaction Hash: {txHash}
          </p>
        )}
        {vcDocument && (
          <div className="mt-6 p-4 bg-gray-100 border rounded">
            <h3 className="font-semibold">Generated VC Document (v{vcDocument.version}):</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(vcDocument, null, 2)}
            </pre>
            <p className="mt-2">
              View on IPFS:{" "}
              <a
                href={vcDocument.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {vcDocument.ipfsUrl}
              </a>
            </p>
          </div>
        )}
        {mappingCID && (
          <div className="mt-6 p-4 bg-gray-100 border rounded">
            <h3 className="font-semibold">VC Mapping Document CID:</h3>
            <p className="text-sm text-gray-700 overflow-x-auto">{mappingCID}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VCIssuanceForm;
